'use strict';

var _ = require('lodash');
var Devices = require('./devices.model');

// Get list of devicess
exports.index = function(req, res) {
  Devices.find(function (err, devicess) {
    if(err) { return handleError(res, err); }
    return res.json(200, devicess);
  });
};

// Get a single devices
exports.show = function(req, res) {
  Devices.findById(req.params.id, function (err, devices) {
    if(err) { return handleError(res, err); }
    if(!devices) { return res.send(404); }
    return res.json(devices);
  });
};

// Creates a new devices in the DB.
exports.create = function(req, res) {
  console.log("requested", req.body);
  var uids = [req.body.uid];
  if(req.body.role == "parent") {
    uids = req.body.uids;
  }
  console.log("uids", uids);
  Devices.find({uid:{$in:uids}}, function(err, devices) {
    console.log("found devices", devices);
    if(err) { return handleError(res, err); }
    if(devices.length > 0) {
      for (var i = 0; i < devices.length; i++) {
        var updated = devices[i];
        updated.tokens.push(req.body.tokens);
        updated.tokens = _.uniq(updated.tokens);
        updated.class = _.merge(updated.class, req.body.class);
        updated.class = _.uniq(updated.class);      
        console.log("updated", updated);
        updated.save(function (err) {
          if (err) { return handleError(res, err); }
          if(i == (devices.length - 1))
            return res.json(200, devices);
        });
      };
    } else {
      console.log("no device found so insert it");
      for (var i = 0; i < uids.length; i++) {
        var create = {schoolid:req.body.schoolid, uid:uids[i], class:req.body.class[i], tokens:req.body.tokens};
        Devices.create(create, function(er, devices) {
          if(er) { return handleError(res, er); }
          if(i == (uids.length - 1))
            return res.json(201, devices);
        });
      };
    }
  })
};

// Updates an existing devices in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Devices.findById(req.params.id, function (err, devices) {
    if (err) { return handleError(res, err); }
    if(!devices) { return res.send(404); }
    var updated = _.merge(devices, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, devices);
    });
  });
};

// Deletes a devices from the DB.
exports.destroy = function(req, res) {
  Devices.findById(req.params.id, function (err, devices) {
    if(err) { return handleError(res, err); }
    if(!devices) { return res.send(404); }
    devices.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}