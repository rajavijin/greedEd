'use strict';

var _ = require('lodash');
var Wall = require('./wall.model');

// Get list of walls
exports.index = function(req, res) {
  Wall.find(function (err, walls) {
    if(err) { return handleError(res, err); }
    return res.json(200, walls);
  });
};
// Get list of walls
exports.wall = function(req, res) {
  console.log("requested wall:", req.params);
  if(req.params.to == "hm") {
    delete req.params.to;
  } else {
    var classes = req.params.to.split(",");
    req.params.to = {$in:classes};
  }
  Wall.find(req.params,null, {sort:{date: -1}}, function (err, walls) {
    if(err) { return handleError(res, err); }
    return res.json(200, walls);
  });
};
// Get a single wall
exports.show = function(req, res) {
  Wall.findById(req.params.id, function (err, wall) {
    if(err) { return handleError(res, err); }
    if(!wall) { return res.send(404); }
    return res.json(wall);
  });
};

// Creates a new wall in the DB.
exports.create = function(req, res) {
  console.log("wall requested:", req.body);
  if(req.body.to.indexOf(":") > 0) {
    var recievers = req.body.to.split(":");
    req.body.to = {$in:recievers};
  }
  Wall.create(req.body, function(err, wall) {
    if(err) { return handleError(res, err); }
    return res.json(201, wall);
  });
};

// Upload files to the server.
exports.upload = function(req, res, next) {
  var app = require('../../app');
  var fs = require('fs');
  var busboy = require('connect-busboy'); //middleware for form/file upload
  
  console.log("req.files:", req.files);
  console.log("req.body:", req.body);
  console.log("req.busboy:", req.busboy);
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename); 
    fstream = fs.createWriteStream('./client/uploads/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {
      //res.redirect('back');
      res.json(200,  '/uploads/' + filename);
    });
  });
/*        var fstream;
        console.log("requested", req.busboy);
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);

            //Path where image will be uploaded
            fstream = fs.createWriteStream('./server/uploads/' + filename);
            console.log("fstream", fstream);
            file.pipe(fstream);
            fstream.on('close', function () {    
                console.log("Upload Finished of " + filename);              
                //res.redirect('back');           //where to go next
            });
        });*/

/*    console.log("upload");
    var file = req.files.file,
        filePath = file.path,
        fileName = file.name, file name passed by client. Not used here. We use the name auto-generated by Node
        lastIndex = filePath.lastIndexOf("/"),
        tmpFileName = filePath.substr(lastIndex + 1),
        image = req.body;
    image.fileName = tmpFileName;
    console.log(tmpFileName);
    if(!image) {
      console.log(err);
      return next(err);
    }
    res.json(image);*/
};

// Updates an existing wall in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Wall.findById(req.params.id, function (err, wall) {
    if (err) { return handleError(res, err); }
    if(!wall) { return res.send(404); }
    req.body.likecount = wall.likecount + req.body.like;
    if(req.body.like == 1) {
      wall.likeuids.push(req.body.likeuid);
    } else {
      for (var i = 0; i < wall.likeuids.length; i++) {
        if(wall.likeuids[i]._id == req.body.likeuid._id) {
          console.log("deleting", wall.likeuids[i]);
          wall.likeuids.splice(i,1);
        }
      };
    }
    var updated = _.merge(wall, req.body);
    console.log("before save", updated);
    updated.save(function (err) {
      console.log("err", err);
      if (err) { return handleError(res, err); }
      console.log("Wall after updated", wall);
      return res.json(200, wall);
    });
  });
};

// Deletes a wall from the DB.
exports.destroy = function(req, res) {
  Wall.findById(req.params.id, function (err, wall) {
    if(err) { return handleError(res, err); }
    if(!wall) { return res.send(404); }
    wall.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}