var config = require("config");
var request = require("request");

var goConnect = function() {
  var self = this;

  this.pipelines = [];

  //build pipelines object from config
  config.go.pipelines.forEach(function(pipeline) {
    self.pipelines.push({
      name: pipeline,
      lastBuild: null
    });
  });

  self.pullUpdates();
};

//Iterate over all pipelines and see if there is a new build
goConnect.prototype.pullUpdates = function() {
  console.log('Check for new builds');
  var self = this;

  self.pipelines.forEach(function(pipeline) {
    request(config.go.url + '/go/api/pipelines/' + pipeline.name + '/history', {
      'auth': {
        'user': config.go.username,
        'pass': config.go.password
      }
    }, function(err, res, body) {


      var last = {pipelines: [{}]};
      try {
        last = JSON.parse(body);
      } catch(e) {
        console.log("ERROR: " + e);
      }

      last = last.pipelines[0];

      if(last.id && last.id != pipeline.lastBuild) {

        //iterate over stages and see if all of them passed
        var passed = true;
        var failedOn = false;
        var running = false;

        last.stages.forEach(function(stage) {
          if(stage.result == 'Failed') {
            passed = false;
            failedOn = stage.name;
          } else if(stage.result != 'Passed') {
            running = true;
          }
        });

        //Ignore if build is still running
        if(!running) {
          //Don't send a message on startup
          if(pipeline.lastBuild !== null) {
            if(passed) {
              self.sendMessage("The last build(" + last.id + ") for " + pipeline.name + " passed", "passed");
            } else {
              self.sendMessage("The last build(" + last.id + ") for " + pipeline.name + " FAILED", "failed");
            }
          }

          pipeline.lastBuild = last.id;
        }
      }

    });
  });

  var timeout = (function() {
    this.pullUpdates();

  }).bind(self);

  //and in a minute the same again
  setTimeout(timeout, 20000);
};

//placeholder that needs to be overwritten by the user
goConnect.prototype.sendMessage = function(){};

module.exports = goConnect;
