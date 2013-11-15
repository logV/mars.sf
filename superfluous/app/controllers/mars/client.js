"use strict";

module.exports = {
  click_handler_uno: function() {
    console.log("Handling a click");
  },

  init: function() {
    this.on("add_comment", function(data) {
      console.log("ADDING THIS COMMENT BUSINESS", data);
      SF.socket().emit("add_comment", data);
    });
  }

};
