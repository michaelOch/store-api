const mongoose = require('mongoose');
import passportLocalMongoose from "passport-local-mongoose";

const Schema = mongoose.Schema;

var userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'user'
  },
  mobile: {
      type: String
  },
  altMobile: {
      type: String
  },
  street: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  verified: {
      type: Boolean,
      default: false
  },
  annonymous: {
    type: Boolean,
    unique: true
  },
  date:  { 
    type: Date, 
    default: Date.now
  }
});

userSchema.plugin(passportLocalMongoose);

userSchema.virtual('address').get(function() {
  return this.street + ', ' + this.city + ', ' + this.state + ', ' + this.zipCode;
});

module.exports = mongoose.model('User', userSchema);