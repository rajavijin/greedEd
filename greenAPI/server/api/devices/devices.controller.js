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
  Devices.findOne({uid:req.body.uid}, function(err, devices) {
    if(err) { return handleError(res, err); }
    console.log("devices", devices);
    if(devices) {
      var updated = _.merge(devices, req.body);
      console.log("updated", updated);
      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.json(200, devices);
      });
    } else {
      Devices.create(req.body, function(er, devices) {
        if(er) { return handleError(res, er); }
        return res.json(201, devices);
      });
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