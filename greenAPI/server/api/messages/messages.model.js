'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessagesSchema = new Schema({
  schoolid: String,
  chatname: String,
  name: String,
  userId: String,
  to: Array,
  text: String,
  img: String,
  type: String,
  date: Date,
  seen: Array,
  seencount: {type:Number, default:0}
});

module.exports = mongoose.model('Messages', MessagesSchema);