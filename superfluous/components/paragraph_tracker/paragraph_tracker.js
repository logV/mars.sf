"use strict";

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  client: function(options) {
    // Detect when the user becomes idle vs. is active. Watch for scrolling, etc
    var paragraphs = $("p").length;
    var pagename = options.client_options.page;
    var pageid = options.client_options.pageid;
    $("p").prepend(
      $("<div class='counter'>")
        .css("position", "absolute")
    );
    var session = {};
    session.count = paragraphs;
    session.idle = 0;

    var idle_time = 0;
    var current_tick = 0;

    // Poll the page every second and keep track of which paragraphs are visible
    function count_visible_paragraphs() {
      if (window.document.hidden) {
        return;
      }

      current_tick += 1;
      idle_time += 1;

      session.ticks = current_tick;
      session.active = session.ticks - session.idle;

      if (current_tick % 5 === 0) {
        var socket_data = {
          data: session,
          page: pagename,
          pageid: pageid
        };
        SF.socket().emit("timespent", socket_data);
      }

      // don't count the time if the user has been idle
      if (idle_time < 30) {
        var vis_paragraphs = $("p").filter(function() { return $(this).isOnScreen(); });
        _.each(vis_paragraphs, function(p) {
          var $p = $(p);
          var index = $p.index();
          // locate where in the text these words are. right?
          session[index] = (session[index]||0) + 1;

        });

        _.each($("p"), function(p) {
          var $p = $(p);
          var index = $p.index();

          // We should set this color to represent the number of seconds spent on this paragraph.
          var opacity = Math.round(session[index] / parseFloat(session.active) * 100.0) / 100;

          $p.find(".counter")
            .html("<div style='width: 10px; height: 20px' />")
            .css("background-color", "#3b7")
            .css("opacity", opacity);
        });
      } else {
        session.idle += 1;
      }


      setTimeout(function() {
        count_visible_paragraphs();
      }, 1000);
    }


    count_visible_paragraphs();

    $(window.document).scroll(_.throttle(function (e) {
      idle_time = 0;
    }, 100));
    $(window.document).mousemove(_.throttle(function (e) {
      idle_time = 0;
    }, 100));
    $(window.document).keypress(function (e) {
      idle_time = 0;
    });
  }
};
