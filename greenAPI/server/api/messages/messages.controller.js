'use strict';

var _ = require('lodash');
var Messages = require('./messages.model');
var Devices = require('../devices/devices.model');
// Get list of messagess
exports.index = function(req, res) {
  Messages.find(function (err, messagess) {
    if(err) { return handleError(res, err); }
    return res.json(200, messagess);
  });
};

// Get a single messages
exports.show = function(req, res) {
  Messages.findById(req.params.id, function (err, messages) {
    if(err) { return handleError(res, err); }
    if(!messages) { return res.send(404); }
    return res.json(messages);
  });
};

// Get a single messages
exports.getMessages = function(req, res) {
  console.log("requested to get messages", req.params);
  if(req.params.classes != "undefined") {
    var allclasses = req.params.classes.split(",");
    var allparams = {schoolid:req.params.schoolid, $or:[{"userId":req.params.userId},{"to":{$elemMatch:{"id":{$in:allclasses}}}},{"to":{$elemMatch:{"id":req.params.userId}}}]};
  } else {
    var allparams = {schoolid:req.params.schoolid, $or:[{"type":"group"},{"userId":req.params.userId},{"to":{$elemMatch:{"id":req.params.userId}}}]};
  }
  console.log("requested messages", allparams);
  Messages.find(allparams, function (err, messages) {
    if(err) { return handleError(res, err); }
    if(!messages) { return res.send(404); }
    return res.json(messages);
  });
};

// Get a single messages
exports.getConversation = function(req, res) {
  console.log("requested conversation", req.params);
  Messages.find({ schoolid:req.params.schoolid, chatname:req.params.chatname}).sort({date: 1}).exec(function (err, messages) {
    if(err) { return handleError(res, err); }
    if(!messages) { return res.send(404); }
    return res.json(messages);
  });
};

// Creates a new messages in the DB.
exports.create = function(req, res) {
  console.log("Requested message:", req.body);
  var ionicPushServer = require('ionic-push-server');

  var credentials = {
      IonicApplicationID : "e6a31325",
      IonicApplicationAPIsecret : "7c5dcd3ddd0d723e35d291e7ad8b678c417733be0adc193f"
  };
  var notification = {
    "tokens":[],
    "notification":{
      "alert":req.body.text,
      "ios":{
        "badge":1,
        "sound":"chime.aiff",
        "expiry": 1423238641,
        "priority": 10,
        "contentAvailable": true,
        "payload":{
          "key1":"value",
          "key2":"value"
        }
      },
      "android":{
        "collapseKey":"foo",
        "delayWhileIdle":true,
        "timeToLive":300,
        "payload":{
          "chatname":req.body.chatname,
          "toId":req.body.to[0].id,
          "toName":req.body.to[0].name,
          "userId":req.body.userId,
          "name":req.body.name,
          "type":req.body.type,
        }
      }
    } 
  };
  if(req.body.type == "group") {
    console.log("its a group message");
    Devices.find({class:req.body.to[0].id}, 'tokens', function(err, device) {
      console.log("devices", device);
      if(device) {
        for (var i = 0; i < device.length; i++) {
          console.log("notification token", notification.tokens);
          notification.tokens = notification.tokens.concat(device[i].tokens);
        };
        console.log("Push notification sent to:", notification.tokens);
        Messages.create(req.body, function(err, messages) {
          if(err) { return handleError(res, err); }
          ionicPushServer(credentials, notification);
          return res.json(201, messages);
        });
      }
    });
  } else {
    console.log("single message");
    Devices.findOne({uid:req.body.to[0].id}, 'tokens', function(err, device) {
      console.log("device Status", device);
      if(device) notification.tokens = device.tokens;
      console.log("Push notification sent to:", notification.tokens);
      Messages.create(req.body, function(err, messages) {
        if(err) { return handleError(res, err); }
        if(notification.tokens)
          ionicPushServer(credentials, notification);
        return res.json(201, messages);
      });
    });
  }  
};

// Updates an existing messages in the DB.
exports.update = function(req, res) {
//  if(req.body._id) { delete req.body._id; }
  console.log("requested to update", req.body);
  Messages.find({schoolid:req.body.schoolid,chatname:req.body.chatname,type:req.body.type,userId:{$ne:req.body.seen},seen:{$ne:req.body.seen}}, function (err, messages) {
    console.log("items found to be updated", messages.length);
    if (err) { return handleError(res, err); }
    if(!messages) { return res.send(404); }
    for (var i = 0; i < messages.length; i++) {
      messages[i].seen.push(req.body.seen);
      console.log("updated", messages[i]);
      messages[i].save(function (err) {
        if (err) { return handleError(res, err); }
        if(i == messages.length - 1)
          return res.json(200, messages);
      });
    };
  });
};

// Deletes a messages from the DB.
exports.destroy = function(req, res) {
  Messages.findById(req.params.id, function (err, messages) {
    if(err) { return handleError(res, err); }
    if(!messages) { return res.send(404); }
    messages.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}