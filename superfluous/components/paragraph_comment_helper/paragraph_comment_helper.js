"use strict";

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize: function(options) {
  },
  client: function(options) {
    var counter = $("<div class='counter'>")
      .css("position", "absolute");


    counter.html("<div style='width: 10px; height: 20px; cursor: pointer; font-size: 32px' >+</div>");

    $("p").prepend(counter);
    $("p").hover(function() {
      $(this).find(".counter").stop(true, true).fadeIn();
    }, function() {
      $(this).find(".counter").stop(true, true).fadeOut();
    });
    $("p .counter").on('click', function() {
      var p = $(this).parent("p");

      $C("comment_adder", { }, function(cmp) {
        cmp.$el.hide();
        p.append(cmp.$el);
        cmp.$el.slideDown();
      });
    });

    var client_options = options.client_options;

  }
};
