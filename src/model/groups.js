const mongoose = require('mongoose');

var groupSchema =  mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  date:  { 
    type: Date, 
    default: Date.now
  }
});

module.exports = mongoose.model('Group', groupSchema);