var models = require_app("server/models");

module.exports = {
  setup_app: function(app) {
    models.install(app);
  },
  setup: function(options) {
    console.log("Main setup stuff, something, something");
  }
}
