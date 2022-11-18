const mongoose = require('mongoose');

var sizeSchema =  mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    size: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        enum: ['kg', 'l', 'g'],
        required: true,
        default: 'kg'
    },
    weightValue: {
        type: Number,
        required: true,
        defualt: 1
    },
    date:  { 
        type: Date, 
        default: Date.now
    }
});

module.exports = mongoose.model('Sizing', sizeSchema);