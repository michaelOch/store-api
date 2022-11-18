const mongoose = require('mongoose');

var subCategorySchema =  mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        unique: true,
        required: true,
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    date:  { 
        type: Date, 
        default: Date.now
    }
});

module.exports = mongoose.model('SubCategory', subCategorySchema);