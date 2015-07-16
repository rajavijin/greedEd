'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DevicesSchema = new Schema({
  schoolid: String,
  uid: {type:String,unique:true},
  class: Array,
  tokens: Array,
  platform: String,
  active: {type: Boolean, default:true}
});

module.exports = mongoose.model('Devices', DevicesSchema);