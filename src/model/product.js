const mongoose = require('mongoose');

var productSchema =  mongoose.Schema({
    subcategory: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'SubCategory',
        required: true
    },
    sizing: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Sizing'
    },
    name: {
        type: String,
        unique: true,
        required: true,
    },
    sku: {
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: Array,
        required: true
    },
    trending: {
        type: Boolean
    },
    status: {
        type: String,
        enum: ['new', 'sold out'],
        default: 'new',
        required: true
    },
    date:  { 
        type: Date, 
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);