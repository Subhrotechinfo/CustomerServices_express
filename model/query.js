var mongoose = require('mongoose');
import Config from '../config/config';
let Schema  = mongoose.Schema;

const { port, secretKey, expiredAfter } = Config;

var QuerySchema = new mongoose.Schema({
    name: {type: String, required: true},
    mobile: {type: Number },
    sub_service: {type: Schema.Types.ObjectId, ref: "Subservice"},
    desc: {type: String},
    query_for: {type: String},
    query_by: {type: Schema.Types.ObjectId, ref: "user"},
    created: {type: Number, default: Date.now()}
  });

  module.exports =  mongoose.model('Query', QuerySchema);