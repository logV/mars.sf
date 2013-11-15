"use strict";

module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: ""
  },
  initialize: function(options) {
    this.paragraph_index = options.index;
    this.page = options.page;
    this.pageid = options.pageid;
  },
  client: function(options) {
    var client_options = options.client_options;
  },
  close: function() {
    var self = this;
    self.$el.slideUp(function() {
      self.$el.remove();
      self.trigger("closed");
    });
  }
};
