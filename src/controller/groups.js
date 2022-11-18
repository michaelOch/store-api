import { Router } from "express";

import Group from "../model/groups";
import Category from "../model/category";
import SubCategory from "../model/subCategory";
import { adminAuthorization, authentication } from "../middleware/adminAuth";

export default ({ config, db }) => {
    const api = Router(); // 'v1/group'
    
    //  Get all Group
    api.get('/', (req, res) => {
		Group.find({}, null, {sort: { date: 'desc' }}, (err, group) => {
			if (err) {
				return res.status(500).json({ status: false, msg: "A server error occured" });
			}
            
			res.status(200).send({ status: true, groups: group });
		});
    });

    //  Get group with sub categories
    api.get('/all', (req, res) => {
        
        Group.find({}, null, {sort: { date: 'desc' }}).limit(5)
        .exec(async (err, groups) => {
			if (err) {
				return res.status(500).json({ status: false, msg: "A server error occured" });
			}
            
            if (groups) {
                // const promises = groups.map(async (group) => {
                //     const category = await Category.find().where('group').equals(group._id).exec();
                //     const subCat = await SubCategory.find().where('category').equals(category._id).exec();
                //     return ({
                //         name: group.name,
                //         categories: category,
                //         subcategories: subCat
                //     })
                // })
                
                const promises = groups.map(async (group) => {
                    const category = await Category.find().where('group').equals(group._id).exec();
                    const cat = category.map(async (curCat) => {
                        const subCat = await SubCategory.find().where('category').equals(curCat._id).exec();
                        return ({
                            name: curCat.name,
                            subcategories: subCat
                        })
                    })

                    const catResult = await Promise.all(cat);
                    
                    return ({
                        name: group.name,
                        categories: catResult
                    })
                })

                const result = await Promise.all(promises);
                
                // const finalPromises = result.map(async (item) => {
                //     const itemResult = item.categories.map(async (category) => {
                //         const subCat = await SubCategory.find().where('category').equals(category._id).exec();
                //         return ({
                //             name: category.name,
                //             subcategories: subCat
                //         })
                //     })

                //     return itemResult;
                    
                // })

                // const finalResult = await Promise.all(finalPromises);
                // console.log(finalResult);

                res.status(200).send({ status: true, groups: result });
            }
			
		});
    });

    //  Get categories under a group
    api.get('/:groupId/category', authentication, (req, res) => {

        let category;

        Group.findById(req.params.groupId, async (err, group) => {
            if (err) {
                console.log("Can't find the group")
                return res.status(500).json({ status: false, msg: "Can't find the group" });
            }

            if (group) {
                console.log("Found group...")
                category = await Category.find().where('group').equals(group._id).exec();

                res.json({
                    category
                });
            }
        })
	});
    
    //  Get Specific Group
    api.get('/:groupId', adminAuthorization, (req, res) => {

        let category;

        Group.findById(req.params.groupId, async (err, group) => {
            if (err) {
                return res.status(500).json({ status: false, msg: "Can't find the group" });
            }

            if (group) {
                category = await Category.find().where('group').equals(group._id).exec();

                res.json({
                    group: {
                        id: group._id,
                        name: group.name,
                        date: group.date,
                        category: category
                    }
                });
            }
        })
    });

    //  Submit Group
	api.post('/admin', adminAuthorization, (req, res) => {

        console.log('Adding group')
        console.log(req.body.name)
        
        const group = new Group({
            name: req.body.name
        });

        Group.findOne({name: req.body.name}, (err, data) => {
            
            if (err) {
                console.log('There is an error')
				return res.status(400).send({ status: false, msg: err });
			}

            if (data) {
                console.log('This group is already on records')
                return res.json({msg: 'This group is already on records'});
            } else {
                console.log('Saving group...')
                group
                    .save()
                    .then(data => res.json(data))
                    .catch(err => res.json({msg: err}));
            }
        })
    });
    
    //  Delete Group
    api.delete('/admin/:groupId', adminAuthorization, (req, res) => {

        Group.deleteOne({_id: req.params.groupId})
            .then(data => res.json(data))
            .catch(err => res.json({msg: err}))
    });

    //  Update Group
    api.put('/admin/:groupId', adminAuthorization, (req, res) => {

        Group.findOneAndUpdate({_id: req.params.groupId}, {$set: {
            name: req.body.name
        }},{ new: true })
            .then(data => res.json(data))
            .catch(err => res.json({msg: err}))
    });

	return api;
}
