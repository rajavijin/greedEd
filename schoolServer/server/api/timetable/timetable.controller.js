'use strict';

var _ = require('lodash');
var Timetable = require('./timetable.model');

var validationError = function(res, err) {
  return res.json(422, err);
};
// Get list of timetables
exports.index = function(req, res) {
  Timetable.find(function (err, timetables) {
    if(err) { return handleError(res, err); }
    return res.json(200, timetables);
  });
};

// Get a single timetable
exports.show = function(req, res) {
  Timetable.findById(req.params.id, function (err, timetable) {
    if(err) { return handleError(res, err); }
    if(!timetable) { return res.send(404); }
    return res.json(timetable);
  });
};

//Get Timetable
exports.timetable = function(req, res) {
  var params = req.params;
  _.each(req.params, function(p, pkey) {
    if((p.toLowerCase() == 'all') || (p.toLowerCase() == 'undefined')) {
      delete params[pkey];
    }
  })
  if(params.class.indexOf(",") > 0) {
    var classes = params.class.split(",");
    params.class = {$in:classes};
  }
  if(params.subject) {
    params.timetable = {$elemMatch:{subject:params.subject}};
    delete params.subject;
  }
  console.log("request timeTable", params);
  Timetable.find(params, null, {sort:{_id: 1}}, function (err, timetable) {
    if(err) { return handleError(res, err); }
    if(!timetable) { return res.send(404); }
    return res.json(timetable);
  });
}

// Creates a new timetable in the DB.
exports.create = function(req, res) {
  Timetable.findOne({schoolid:req.body.schoolid,class:req.body.class,day:req.body.day},function(err, timetableData) {
    if (err) return next(err);
    if(timetableData) {
      timetableData.timetable = req.body.timetable;
      console.log("timetableData", timetableData);
      timetableData.save(function (err) {
        if (err) { return validationError(res, err); }
        console.log("Teacher updated");
        return res.json(200, timetableData);
      });
    } else {
      Timetable.create(req.body, function(err, timetable) {
        if(err) { return handleError(res, err); }
        return res.json(201, timetable);
      });
    }
  })
};

// Updates an existing timetable in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Timetable.findById(req.params.id, function (err, timetable) {
    if (err) { return handleError(res, err); }
    if(!timetable) { return res.send(404); }
    var updated = _.merge(timetable, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, timetable);
    });
  });
};

// Deletes a timetable from the DB.
exports.destroy = function(req, res) {
  Timetable.findById(req.params.id, function (err, timetable) {
    if(err) { return handleError(res, err); }
    if(!timetable) { return res.send(404); }
    timetable.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}