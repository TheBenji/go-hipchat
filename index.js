var config = require('config');

var apiKey = config.hipchat.apiKey;
var roomID = config.hipchat.roomID;
var fromName = config.hipchat.name;

var moment = require('moment');
var HipChat = require('node-hipchat');
var hipClient = new HipChat(apiKey);

var GoConnect = require('./lib/goConnect');
var goConnect = new GoConnect();



GoConnect.prototype.sendMessage = function(message, level) {
  var colour = 'green';
  if(level === 'failed') {
    colour = 'red';
  }

  hipClient.postMessage({
        room_id: roomID,
        from: fromName,
        message: message,
        message_format: 'text',
        notify: true,
        color: colour
      });
}


