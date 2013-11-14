'use strict';

var page = require_core("server/page");
var template = require_core("server/template");
var context = require_core("server/context");
var marked = require("marked");
var models = require_app("server/models");

var fs = require("fs");

var MARS_PATH = "app/mars/tharsis prime/";
module.exports = {
  routes: {
    "" : "index",
    "/read" : "get_read"
  },

  index: function() {
    template.add_stylesheet("mars.css");

    fs.readdir(MARS_PATH, function(err, files) {
      files = _.filter(files, function(filename) {
        var end = filename.substr(-3);
        return end === ".md";
      });

      if (!err) {
        var template_str = template.render("controllers/mars.html.erb", {
          files: files
        });
        page.render({ content: template_str, socket: true });
      } else {
        page.render( { content: "Couldnt read files from mars directory, make"
        + "sure to initialize git submodules" });
      }
    });
  },

  get_read: function() {
    // TODO: make sure filename is only a basepath
    // ../../../etc/passwd
    var filename = context("req").query.f;

    template.add_stylesheet("mars.css");

    $C("paragraph_tracker", {client_options: { page: filename, pageid: +Date.now()}}).marshall();


    fs.readFile(MARS_PATH + filename, function(err, data) {
      if (!err) {
        var rendered = marked(data.toString());
        var template_str = template.partial("mars/chapter.html.erb", {
          rendered: rendered
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
