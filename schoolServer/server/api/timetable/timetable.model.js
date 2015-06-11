'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TimetableSchema = new Schema({
  schoolid: String,
  class: String,
  day: String,
  timetable: Array,
  created: Date,
});

module.exports = mongoose.model('Timetable', TimetableSchema);