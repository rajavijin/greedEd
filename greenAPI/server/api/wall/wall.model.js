'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WallSchema = new Schema({
  schoolid: String,
  message: String,
  pictures: Array,
  user: String,
  userid: String,
  to: Array,
  likecount: { type:Number, default:0 },
  likeuids: { type:Array},
  date: Date,
});

module.exports = mongoose.model('Wall', WallSchema);