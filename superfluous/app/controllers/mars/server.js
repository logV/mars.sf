'use strict';

var page = require_core("server/page");
var bridge = require_core("server/bridge");
var template = require_core("server/template");
var context = require_core("server/context");
var marked = require("marked");
var models = require_app("server/models");
var $ = require("cheerio");

var fs = require("fs");

var MARS_PATH = "app/mars/tharsis prime/";

var MARS_FILES = null;
var value_of = require_core("server/controller").value_of;
var array_of = require_core("server/controller").array_of;

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

function render_chapter_listing() {
    var template_str = template.render("controllers/mars.html.erb", {
      files: MARS_FILES
    });
    page.render({ content: template_str, socket: true });
}

function error_reading_chapters() {
  page.render( { content: "Couldnt read files from mars directory, make"
  + "sure to initialize git submodules" });
}

function render_chapter(filename, comments) {
  template.add_stylesheet("mars.css");

  fs.readFile(MARS_PATH + filename, function(err, data) {
    if (!err) {
      var rendered = marked(data.toString());
      var template_str = template.partial("mars/chapter.html.erb", {
        rendered: rendered,
        render_chapter_links: function() { return render_chapter_links(filename, comments); }
      });
      page.render({ content: template_str, socket: true });
    } else {
      page.render({ content: "Error reading file: " + filename });
    }
  });
}
function render_chapter_links(filename, comments) {
  return page.async(function(flush) {
    function render_links() {
      var index =_.indexOf(MARS_FILES, filename);
      var links = $("<div />");

      var url = "/mars/read?f=";
      if (comments) { 
        url = "/mars/comments?f=";
      }

      if (index > 0) {
        links.append($("<a class='lfloat'/>").html("PREV").attr("href", url + MARS_FILES[index-1]));
      }

      if (index < MARS_FILES.length - 1) {
        links.append($("<a class='rfloat'/>").html("NEXT").attr("href", url + MARS_FILES[index+1]));
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
}

module.exports = {
  routes: {
    "" : "get_index",
    "/read" : "get_read",
    "/watch" : "get_watch",
    "/comments" : "get_comments",
    "/admin" : "get_admin"
  },

  get_index: function() {
    template.add_stylesheet("mars.css");

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

  get_admin: function() {
    load_mars_files(function() {
      var template_str = template.partial("mars/admin.html.erb", { 
        files: MARS_FILES
      });
      page.render({ content: template_str, socket: true });
    });
  },

  get_comments: function() {
    template.add_stylesheet("mars.css");
    var filename = context("req").query.f;

    models.comment.find({ 
      page: filename
    }, context.wrap(function(err, results) {
      var el = $("<div />");
      _.each(results, function(comment) {
        var cmp = $C("admin_comment", comment);
        el.append(cmp.$el);

        cmp.marshall();
      });

      bridge.controller("mars", "add_comments", results);
      render_chapter(filename, true);
    }));
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
    var client_options = {client_options: { page: filename, pageid: +Date.now()}};
    $C("paragraph_comment_helper", client_options).marshall();
    $C("paragraph_tracker", client_options).marshall();

    render_chapter(filename);
  },

  socket: function(socket) {
    socket.on("add_comment", function(data) {

      var comment_data = {
        comment: value_of(data, "comment"),
        author: value_of(data, "author", ""),
        page: value_of(data, "page"),
        index: value_of(data, "index"),
        pageid: value_of(data, "pageid"),
        paragraph: value_of(data, "paragraph"),
        time: Date.now(),
        public: false,
        sid: socket.handshake.sid
      };


      if (!_.isNumber(comment_data.index) || !comment_data.page) {
        console.log("Missing comment data information");
      } else {
        console.log("Adding comment", comment_data);

        models.comment.create([comment_data], function(err, result) { 
          socket.emit("comment_added"); 
        });
      }
    });

    // TODO: need to actually trust the incoming data
    socket.on("promote_comment", function(comment) {
      models.comment.find({ _id: comment._id}, function(err, results) {
        if (results.length) {
          var comment = results.pop();
          comment.public = true;
          comment.save();
        }

      });
    });

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
  }
};
