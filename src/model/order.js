const mongoose = require('mongoose');

var orderSchema =  mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    recipient:{
        email: {
            type: String,
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
        mobile: {
            type: String,
          required: true,

        },
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,

        },
        state: {
          type: String,
          required: true,

        },
        zipCode: {
          type: String,
          required: true,
        },
    },
    products: {
        type: Array,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'New',
        required: true
    },
    date:  { 
        type: Date, 
        default: Date.now
    }
});

orderSchema.virtual('address').get(function() {
  return this.recipient.street + ', ' + this.recipient.city + ', ' + this.recipient.state + ', ' + this.recipient.zipCode;
});

module.exports = mongoose.model('Order', orderSchema);