var mongoose = require('mongoose');
import Config from '../config/config';
let Schema  = mongoose.Schema;

const { port, secretKey, expiredAfter } = Config;

var SubServiceSchema = new mongoose.Schema({
    title: {type: String, required: true},
    price: {type: Number },
    service: {type: String}
  });

  module.exports =  mongoose.model('Subservice', SubServiceSchema);
