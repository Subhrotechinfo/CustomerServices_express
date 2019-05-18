var mongoose = require('mongoose');
import Config from '../config/config';
let Schema  = mongoose.Schema;

const { port, secretKey, expiredAfter } = Config;

var ServiceSchema = new mongoose.Schema({
    title: {type: String, required: true},
    desc: {type: String }
  });

  module.exports =  mongoose.model('service', ServiceSchema);

 
  