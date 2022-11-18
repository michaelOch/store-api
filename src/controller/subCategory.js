import { Router } from "express";
import multer from 'multer';
import path from 'path';

import SubCategory from "../model/subCategory";
import Product from "../model/product";
import Category from '../model/category';
import Sizing from "../model/sizing";
import { adminAuthorization, authentication } from "../middleware/adminAuth";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname) {
        cb(null, true)
    } else {
        cb('Error: Images only');
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

export default ({ config, db }) => {
    const api = Router(); // 'v1/subcategory'
    
    //  Get all subcategories
    api.get('/', (req, res) => {
        SubCategory
            .find({}, null, {sort: { date: 'desc' }})
            .populate({ path: 'category', model: Category})
            .exec((err, subcategory) => {
                if (err) {
                    return res.status(500).json({ status: false, msg: "A server error occured" });
                }
                
                res.status(200).send({ status: true, subcategory: subcategory });
            });
    });

    //  Get Specific subcategory
    api.get('/:subcategoryId', (req, res) => {

        let products;
        let cat;

        SubCategory.findById(req.params.subcategoryId, async (err, subcategory) => {
            if (err) {
                return res.status(500).json({ status: false, msg: "Can't find the subcategory" });
            }

            if (subcategory) {
                products = await Product.find().where('subcategory').equals(subcategory._id).exec();
                cat = await Category.find().where('_id').equals(subcategory.category).exec();

                res.json({
                    subcategory: {
                        id: subcategory._id,
                        category: cat,
                        name: subcategory.name,
                        description: subcategory.description,
                        image: subcategory.image,
                        date: subcategory.date,
                        products: products
                    }
                });
            }
        })
    });

    //  Get subcategory Products
    api.get('/:subcategoryId/products', (req, res) => {

        let products;

        SubCategory.findById(req.params.subcategoryId, async (err, subcategory) => {
            if (err) {
                console.log("Can't find the subcategory")
                return res.status(500).json({ status: false, msg: "Can't find the subcategory" });
            }

            if (subcategory) {
                console.log("Found subcategory...")
                products = await Product
                                .find()
                                .where('subcategory')
                                .equals(subcategory._id)
                                .populate({ path: 'subcategory', model: SubCategory})
                                .populate({ path: 'sizing', model: Sizing})
                                .exec();

                res.json({
                    products
                });
            }
        })
	});

    //  Submit subcategory
	api.post('/admin', adminAuthorization, upload.single('subcategoryImage'), async (req, res) => {

        console.log('Adding subcategory')
        const category = JSON.parse(req.body.category);
        const cat = await Category.find().where('_id').in(category).exec();
        
        const subcategory = new SubCategory({
            category: cat[0]._id,
            name: req.body.name,
            description: req.body.description,
            image: req.file ? req.file.path : null
        });

        SubCategory.findOne({name: req.body.name}, (err, data) => {
            
            if (err) {
				return res.status(400).send({ status: false, msg: err });
			}

            if (data) {
                
                return res.json({msg: 'This subcategory is already on records'});
            } else {
                
                subcategory
                    .save()
                    .then(data => {
                        res.json(data);
                    })
                    .catch(err => {
                        res.json({msg: err});
                    });
            }
        })
    });
    
    //  Delete subcategory
    api.delete('/admin/:subcategoryId', adminAuthorization, (req, res) => {

        SubCategory.deleteOne({_id: req.params.subcategoryId})
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    //  Update subategory
    api.put('/admin/:subcategoryId', adminAuthorization, async (req, res) => {

        const category = req.body.category;
        const cat = await Category.find().where('_id').in(category).exec();

        SubCategory.findOneAndUpdate({_id: req.params.subcategoryId}, {$set: {
            name: req.body.name,
            description: req.body.description,
            category: cat[0]._id
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    // Update subcategory Image
    api.put('/admin/upload/:subcategoryId', adminAuthorization, upload.single('subcategoryImage'), (req, res) => {

        SubCategory.findOneAndUpdate({_id: req.params.subcategoryId}, {$set: {
            image: req.file.path
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

	return api;
}
