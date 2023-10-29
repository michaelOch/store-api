import { Router } from "express";
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import env from "dotenv";
env.config();

import Product, { serializeUser } from "../model/product";
import SubCategory from "../model/subCategory";
import Sizing from "../model/sizing";
import { adminAuthorization, userAuthentication } from "../middleware/adminAuth";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true 
  });

const storage = multer.diskStorage({
    // destination: function(req, file, cb) {
    //     cb(null, './uploads/');
    // },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    },
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
    const api = Router(); // 'v1/product'
    
    //  Get all Products
    api.get('/', (req, res) => {
        const sortBy = req.query.sort;
        const orderBy = req.query.order;
        console.log("Na here")

        if(sortBy && orderBy) {
            Product.find({}, null, {sort: {[`${sortBy}`]: `${orderBy}`}})
                .populate({ path: 'subcategory', model: SubCategory})
                .populate({ path: 'sizing', model: Sizing})
                .exec((err, product) => {
                    if (err) {
                        return res.status(500).json({ status: false, msg: "A server error occured" });
                    }
                    
                    if (product) {
                        console.log("Products: ", product)
                        
                        return res.status(200).send({ status: true, product: product });
                    }
                });
        } else {
            Product.find({}, null, {sort: { date: 'desc' }})
                .populate({ path: 'subcategory', model: SubCategory})
                .populate({ path: 'sizing', model: Sizing})
                .exec((err, product) => {
                    if (err) {
                        return res.status(500).json({ status: false, msg: "A server error occured" });
                    }
                    
                    if (product) {
                        // console.log("Products: ", product[0].sizing)
                        return res.status(200).send({ status: true, product: product });
                    }
                });
        }
    });
    
    //  Get Specific Product
    api.get('/:productId', (req, res) => {

        // Product.findById(req.params.productId, (err, product) => {
        //     if (err) {
        //         console.log("Can't find the product")
        //         return res.status(500).json({ status: false, msg: "Can't find the product" });
        //     }

        //     if (product) {
        //         console.log('Found product...')
        //         SubCategory.find({ _id: { $in: product.subcategory}}, (err, subcategory) => {
        //             if (err) {
        //                 return res.status(500).json({ status: false, msg: "Can't find the subcategory" });
        //             }

        //             if (subcategory) {
        //                 res.json({
        //                     product: product,
        //                     subcategory: subcategory
        //                 });
        //             }
        //         })
        //     }
        // })

        Product.findById(req.params.productId)
                .populate({ path: 'subcategory', model: SubCategory})
                .populate({ path: 'sizing', model: Sizing})
                .exec((err, product) => {
                    if (err) {
                        return res.status(500).json({ status: false, msg: "A server error occured" });
                    }
                    
                    if (product) {
                        // console.log("Products: ", product[0].sizing)
                        return res.status(200).send({ status: true, product: product });
                    }
                });
	});

    //  Submit Product
	api.post('/admin', adminAuthorization, upload.array('productImage', 3), async (req, res) => {
        // console.log('Sending...', req.body, req.files);
        const sizings = JSON.parse(req.body.sizing);
        const subcategories = JSON.parse(req.body.subcategory);

        if (
            subcategories.length == 0 ||
            !req.body.name ||
            sizings.length == 0
        ) {
				return res.status(400).send({ status: false, msg: "Kindly add all required fields" });
        }

        const multiplePicturePromise = req.files.map((picture) =>
            cloudinary.uploader.upload(picture.path)
        );

        const imageResponses = await Promise.all(multiplePicturePromise);
            
        const product = new Product({
            subcategory: subcategories,
            name: req.body.name,
            sku: req.body.sku,
            description: req.body.description,
            // image: req.files.map(file => file.path),
            image: imageResponses,
            trending: req.body.trending,
            status: 'new'
        });


        Product.findOne({name: req.body.name}, (err, data) => {
            if (err) {
				return res.status(400).send({ status: false, msg: err });
			}

            if (data) {
                return res.json({msg: 'This Product is already in the records'});
            } else {
                const sizingArr = []
                product.save()
                    .then(async data => {
                        await sizings.forEach(sizing => {
                            sizingArr.push({
                                size: sizing.size,
                                price: sizing.price,
                                quantity: sizing.quantity,
                                weight: sizing.weight,
                                weightValue: sizing.weightValue,
                                product: data._id
                            })
                            
                        });

                        Sizing.insertMany(sizingArr)
                            .then( resp_ => {
                                const newArr = resp_.map(res_ => res_._id)

                                Product.updateOne({_id: data._id}, {$set: {sizing: newArr}})
                                .then(_ => res.json(data))
                                .catch(e => console.log("Error everywhere 1: ", e))
                                
                            })
                            .catch(e => console.log("Error everywhere 2: ", e))

                    })
                    .catch(err => res.json({msg: err}));
            }
        })
    });
    
    //  Delete Product
    api.delete('/admin/:productId', adminAuthorization, (req, res) => {

        Product.deleteOne({_id: req.params.productId})
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    //  Update Product
    api.put('/admin/:productId', adminAuthorization, (req, res) => {

        Product.findOneAndUpdate({_id: req.params.productId}, {$set: {
            name: req.body.name,
            brand: req.body.brand,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            subcategory: req.body.subcategory,
            trending: req.body.trending
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    //  Upload Product Image
    api.put('/admin/upload/:productId', adminAuthorization, upload.array('productImage', 3), async (req, res) => {

        const multiplePicturePromise = req.files.map((picture) =>
            cloudinary.uploader.upload(picture.path)
        );

        const imageResponses = await Promise.all(multiplePicturePromise);

        Product.findOneAndUpdate({_id: req.params.productId}, {$set: {
            image: imageResponses
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    api.post('/shipping/cost', (req, res) => {
        const {kg, zone, shippingDay} = req.body

        let cost = 0.00;
        switch (zone) {
            case "zoneA":
                cost = getZoneABPricing(shippingDay, kg)
                break;
            case "zoneB":
                cost = getZoneABPricing(shippingDay, kg)
                break;
            case "zoneC":
                cost = getZoneCPricing(shippingDay, kg)
                break;
            case "zoneD":
                cost = getZoneDPricing(shippingDay, kg)
                break;
        }

        //return cost

        res.send({status: true, cost: cost})

    })

    api.post('/payment/cost', (req, res) => {
        const {processor, cost} = req.body

        const stripePercent = 2.90
        const stripeExtra = 0.20
        const flutterPercent = 3.50
        const flutterExtra = 0.00
        const paypalPercent = 3.40 //%
        const paypalExtra = 0.20

        let paymentCost = 0

        switch (processor) {
            case "stripe":
                paymentCost = ((cost * stripePercent)/100) + stripeExtra
                break;
            case "flutterwave":
                paymentCost = ((cost * flutterPercent)/100) + flutterExtra
                break;
            case "paypal":
                paymentCost = ((cost * paypalPercent)/100) + paypalExtra
                break;
            default:
                paymentCost = ((cost * stripePercent)/100) + stripeExtra
                break;
        }
      
        res.send({status: true, cost: paymentCost})

    })

    const getZoneABPricing = (shippingDay, kg) => {
        let basePrice = 5.51
        let saturdayPrice = 7.00
        let baseKilo = 10.00
        let perExtraKilo = 0.25
        let price = 0.00

        if (shippingDay == "saturday") {
            basePrice = basePrice + saturdayPrice
        }

        price = basePrice

        if (kg > baseKilo) {
            kg = kg - baseKilo
            price += kg * perExtraKilo
        }

        return price
        
    }

    const getZoneCPricing = (shippingDay, kg) => {
        let basePrice = 12.51
        let saturdayPrice = 7.00
        let baseKilo = 10.00
        let perExtraKilo = 0.75
        let price = 0.00

        if (shippingDay == "saturday") {
            basePrice = basePrice + saturdayPrice
        }

        price = basePrice

        if (kg > baseKilo) {
            kg = kg - baseKilo
            price += kg * perExtraKilo
        }

        return price
        
    }

    const getZoneDPricing = (shippingDay, kg) => {
        let basePrice = 14.51
        let saturdayPrice = 7.00
        let baseKilo = 10.00
        let perExtraKilo = 0.90
        let price = 0.00

        if (shippingDay == "saturday") {
            basePrice = basePrice + saturdayPrice
        }

        price = basePrice

        if (kg > baseKilo) {
            kg = kg - baseKilo
            price += kg * perExtraKilo
        }

        return price
        
    }



	return api;
}
