var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
import Config from '../config/config';
var jwt = require('jsonwebtoken');

const { port, secretKey, expiredAfter } = Config;

var UserSchema = new mongoose.Schema({
    name: {type:String, required:true},
    email: {type:String, required:true,unique:true},
    mobile: {type: Number, required: true, unique: true},
    company: {type: String},
    business_nature: {type: String},
    business_type: {type: String},
    desc: {type: String},
    password: {type:String, required:true},
    permission:{type:Array, default:[], required: true },
    ref_code: {type: String},
    signup_by: {type: String},
    status:{type:Number, default:0}, // 0> active,1->blocked
    created:{type:Number,default:null},
    updated_date: { type: Number, default: null },
    deleted:{ type: Number, default: 0 }, // 0-> active,1->inactive
    login_date:{type: Number, default: null},
    ref_bonus: {type: Number, default: 0},
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date}
  });

  UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

  UserSchema.methods.generateJwt = function() {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
      _id: this._id,
      email: this.email,
      name: this.name,
      exp: parseInt(expiry.getTime() / 1000),
    }, secretKey); // DO NOT KEEP YOUR SECRET IN THE CODE!
  };

  module.exports = mongoose.model('user', UserSchema);



