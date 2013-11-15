'use strict';

var page = require_core("server/page");
var template = require_core("server/template");
var context = require_core("server/context");
var marked = require("marked");
var models = require_app("server/models");
var $ = require("cheerio");

var fs = require("fs");

var MARS_PATH = "app/mars/tharsis prime/";

var MARS_FILES = null;

function load_mars_files(cb) {
  fs.readdir(MARS_PATH, function(err, files) {
    if (!err) {
      MARS_FILES = _.filter(files, function(filename) {
        var end = filename.substr(-3);
        return end === ".md";
      });
    }
    cb();
  });
}

function error_reading_chapters() {
  page.render( { content: "Couldnt read files from mars directory, make"
  + "sure to initialize git submodules" });
}

module.exports = {
  routes: {
    "" : "index",
    "/read" : "get_read",
    "/watch" : "get_watch"
  },

  index: function() {
    template.add_stylesheet("mars.css");

    function render_chapter_listing() {
        var template_str = template.render("controllers/mars.html.erb", {
          files: MARS_FILES
        });
        page.render({ content: template_str, socket: true });
    }

    if (MARS_FILES) {
      render_chapter_listing();
      return;
    }

    load_mars_files(function() {
      if (MARS_FILES) {
        render_chapter_listing();
      } else {
        error_reading_chapters();
      }
    });
  },

  get_watch: function() {
    template.add_stylesheet("mars.css");
    var filename = context("req").query.f;
    models.timespent.find({page: filename}, context.wrap(function(err, results) {
      if (!err) {
        var template_str = template.partial("mars/watch.html.erb", {
          results: results
        });
        page.render({ content: template_str, socket: true });
      } else {
        page.render({ content: "Couldn't find any results" });
      }

    }));
  },

  get_read: function() {
    // TODO: make sure filename is only a basepath
    // ../../../etc/passwd
    var filename = context("req").query.f;

    template.add_stylesheet("mars.css");

    $C("paragraph_tracker", {client_options: { page: filename, pageid: +Date.now()}}).marshall();

    var render_chapter_links = function() {
      return page.async(function(flush) {
        function render_links() {
          var index =_.indexOf(MARS_FILES, filename);
          var links = $("<div />");

          if (index > 0) {
            links.append($("<a class='lfloat'/>").html("PREV").attr("href", "/mars/read?f=" + MARS_FILES[index-1]));
          }

          if (index < MARS_FILES.length - 1) {
            links.append($("<a class='rfloat'/>").html("NEXT").attr("href", "/mars/read?f=" + MARS_FILES[index+1]));
          } else {
            links.append($("<div class='rfloat'>END</div>"));
          }

          return links.html();
        }

        if (MARS_FILES) {
          flush(render_links());
          return;
        }


        load_mars_files(function() {
          if (MARS_FILES) {
            flush(render_links()); 
          } else {
            flush("");
          }

        });
      })();
    };

    fs.readFile(MARS_PATH + filename, function(err, data) {
      if (!err) {
        var rendered = marked(data.toString());
        var template_str = template.partial("mars/chapter.html.erb", {
          rendered: rendered,
          render_chapter_links: render_chapter_links
        });
        page.render({ content: template_str, socket: true });
      } else {
        page.render({ content: "Error reading file: " + filename });
      }
    });
  },

  socket: function(socket) {
    socket.on("timespent", function(data) {
      models.timespent.find({
        sid: socket.handshake.sid, page: data.page, pageid: data.pageid
      }, 1, function(err, results) {
        if (err || !results.length) {
          // Create the first time, drop the rest
          models.timespent.create([{
            sid: socket.handshake.sid,
            data: data,
            page: data.page,
            pageid: data.pageid,
            controller: socket.handshake.controller
          }], function() { });
        } else {
          var result = results.pop();
          result.data = data;
          result.page = data.page;
          result.pageid = data.pageid;
          result.save();
        }

      });
    });

    socket.on("comment", function(data) {
      console.log("RECEIVED COMMENT DATA", data);
      // TODO: do this
    });

    socket.on("get_timespent", function(data) {
      models.timespent.find({}, function(err, timespent) {
        socket.emit("timespent", timespent);
      });
    });
  }
};
