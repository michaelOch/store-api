const mongoose = require('mongoose');

var categorySchema =  mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
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

module.exports = mongoose.model('Category', categorySchema);