"use strict";

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: ""
  },
  client: function(options) {
    this.$el.find(".toc").empty();

    // For now, let's just wrap content div
    var $el = $(options.client_options.div);
    var headers = $el.find("h1, h2, h3, h4");
    var contents = $("<ul />");
    contents.addClass("nav");
    contents.addClass("nav-stacked");

    _.each(headers, function(heading) {
      var hId = _.uniqueId("heading");
      var tagName = heading.tagName;
      var indent = tagName[1];
      var div = $("<li />");
      var weight = 'normal';
      if (indent <= 1) {
        weight = 'bold';
      }
      var a = $("<a />")
        .attr('href', '#' + hId)
        .addClass("content-link")
        .css('margin-left', indent * 5)
        .css('font-weight', weight)
        .html($(heading).html());

      div.append(a);
      contents.append(div);


      $(heading).append($("<a />").attr("id", hId).attr('href', '#'));

    });

    this.$el.append(contents);
  },
  render: function() {
    this.$el.find(".toc").empty();
    this.$el.find(".toc").append("Generating contents...");

  },
  rivets: function() {
    console.log("RIVETS");
    return {
      data: 'test'
    }
  }
};
