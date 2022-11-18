import { Router } from "express";

import Category from "../model/category";
import SubCategory from "../model/subCategory";
import Group from "../model/groups";
import Product from "../model/product";
import Sizing from "../model/sizing";
import { adminAuthorization, authentication } from "../middleware/adminAuth";

export default ({ config, db }) => {
    const api = Router(); // 'v1/category'
    
    //  Get all Category
    api.get('/', (req, res) => {
        console.log('Fetching categories...')
		Category.find({}, null, {sort: { date: 'desc' }}, (err, category) => {
			if (err) {
				return res.status(500).json({ status: false, msg: "A server error occured" });
			}
            
			res.status(200).send({ status: true, category: category });
		});
    });

    //  Get category with sub categories
    api.get('/groups', (req, res) => {
        
		Category.find({}, null, {sort: { date: 'desc' }}, async (err, category) => {
			if (err) {
				return res.status(500).json({ status: false, msg: "A server error occured" });
			}
            
            if (category) {
                const promises = category.map(async (cat) => {
                    const subCat = await SubCategory.find().where('category').equals(cat._id).exec();
                    return ({
                        name: cat.name,
                        subcategory: subCat
                    })
                })
                
                const result = await Promise.all(promises)
                
                res.status(200).send({ status: true, category: result });
            }
			
		});
    });

    //  Get subcategories under a category
    api.get('/:categoryId/subcategory', authentication, (req, res) => {

        let subcategory;

        Category.findById(req.params.categoryId)
        .populate('group')
        .exec(async (err, category) => {
            if (err) {
                console.log("Can't find the category")
                return res.status(500).json({ status: false, msg: "Can't find the category" });
            }

            if (category) {
                console.log("Found category...")
                subcategory = await SubCategory.find().where('category').equals(category._id).exec();

                res.json({
                    subcategory
                });
            }
        })
    });
    
    //  Get Specific Category with its products
    api.get('/:categoryId/products', (req, res) => {
        console.log('Fetching specific category products...')

        let subcategory;
        let products = [];

        Category.findById(req.params.categoryId, async (err, category) => {
            if (err) {
                return res.status(500).json({ status: false, msg: "Can't find the category group" });
            }

            if (category) {
                subcategory = await SubCategory.find().where('category').equals(category._id).exec();

                const promises = subcategory.map(async (subCat) => {
                    products = await Product
                                .find()
                                .where('subcategory')
                                .equals(subCat._id)
                                .populate({ path: 'subcategory', model: SubCategory})
                                .populate({ path: 'sizing', model: Sizing})
                                .exec();

                    return products
                });

                const result = await Promise.all(promises);

                // console.log(result.length);
                result.forEach(curResult => {
                    // console.log(products);
                    products.concat(curResult);
                })

                // console.log(products);

                res.json({
                    products
                });
            }
        })
    });
    
    //  Get Specific Category
    api.get('/:categoryId', adminAuthorization, (req, res) => {

        let subcategory;

        Category.findById(req.params.categoryId, async (err, category) => {
            if (err) {
                return res.status(500).json({ status: false, msg: "Can't find the category group" });
            }

            if (category) {
                subcategory = await SubCategory.find().where('category').equals(category._id).exec();

                res.json({
                    category: {
                        id: category._id,
                        name: category.name,
                        date: category.date,
                        subcategory: subcategory
                    }
                });
            }
        })
    });

    //  Submit Category
	api.post('/admin', adminAuthorization, async(req, res) => {

        console.log('Adding category')
        console.log(JSON.parse(req.body.groups))

        const groups = JSON.parse(req.body.groups);
        const group = await Group.find().where('_id').in(groups).exec();
        console.log(group)

        const category = new Category({
            name: req.body.name,
            group: group[0]._id,
        });

        Category.findOne({name: req.body.name}, (err, data) => {
            
            if (err) {
                console.log('There is an error')
				return res.status(400).send({ status: false, msg: err });
			}

            if (data) {
                console.log('This category is already on records')
                return res.json({msg: 'This category is already on records'});
            } else {
                console.log('Saving category...')
                category
                    .save()
                    .then(data => {
                        console.log(data)
                        res.json(data);
                    })
                    .catch(err => {
                        console.log(err)
                        res.json({msg: err});
                    });
            }
        })
    });
    
    //  Delete Category
    api.delete('/admin/:categoryId', adminAuthorization, (req, res) => {

        Category.deleteOne({_id: req.params.categoryId})
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    //  Update Category
    api.put('/admin/:categoryId', adminAuthorization, async (req, res) => {
        const groups = JSON.parse(req.body.groups);
        const group = await Group.find().where('_id').in(groups).exec();

        Category.findOneAndUpdate({_id: req.params.categoryId}, {$set: {
            name: req.body.name,
            group: group[0]._id
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
