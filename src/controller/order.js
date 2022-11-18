import env from "dotenv";
env.config();
import { Router } from "express";
import axios from 'axios';
import Order from "../model/order";
import User from "../model/user";
import { adminAuthorization, authentication } from "../middleware/adminAuth";
const https = require('https')
const stripe = require('stripe')(process.env.STRIPE_SK);

export default ({ config, db }) => {
    const api = Router(); // 'v1/order'
    
    //  Get all Orders
    api.get('/admin', adminAuthorization, (req, res) => {
		Order.find({}, null, {sort: { date: 'desc' }}, (err, order) => {
			if (err) {
				res.status(500).json({ status: false, msg: "A server error occured" });
				return;
			}
			
			res.status(200).send({ status: true, order: order });
		});
    });
    
    //  Get Specific Order
    api.get('/admin/:orderId', adminAuthorization, (req, res) => {

        Order.findById(req.params.orderId, (err, order) => {
            console.log('Finding order...')
            if (err) {
                res.status(500).json({ status: false, msg: "Can't find the order" });
                return;
            }

            if (order) {
                User.findOne({ _id: { $in: order.user}}, (err, user) => {
                    console.log('Finding user...')
                    if (err) {
                        res.status(500).json({ status: false, msg: "Can't find the user" });
                        return;
                    }

                    if (user) {
                        res.json({
                            order: {
                                user: user,
                                id: order._id,
                                transactionId: order.transactionId,
                                products: order.products,
                                amount: order.amount,
                                status: order.status,
                                recipient: order.recipient,
                                date: order.date
                            }
                        });
                    }
                })
            }
        })
    });


    //Post Payment
    api.post('/submit/:ref', async (req, res) => {
        
        try {

            const {userDetail, orderDetail, recipientDetail} = req.body

            const user = userDetail
            const order = orderDetail
            const recipient = recipientDetail
            const reference = req.params.ref

            let userID;
            if (!!user.isNewAccount && !user.userID) {
                console.log('Creating new User...')

                //create a user
                const user_ = await createNewUser(user)
                userID = user_.userID
            } else if (!user.isNewAccount && !user.userID) {
                console.log('Getting Anonymous ID...')

                const user_ = await getAnonymouseID()
                if(!user_.status) {
                    throw("No user user exists to serve as sender")
                }

                userID = user_.userID
            }

            const recipientData = !!order.isNewDelivery ? recipient : user

            console.log('Gotten a User ID... ', recipientData.email)


            const orderData = new Order({
                user: user.userID || userID,
                transactionId: reference,
                products: order.products,
                amount: order.amount / 100,
                recipient: {
                    street: recipientData.street,
                    city: recipientData.city,
                    state: recipientData.state,
                    zipCode: recipientData.zipCode,
                    email: recipientData.email,
                    firstName: recipientData.firstName,
                    lastName: recipientData.lastName,
                    mobile: recipientData.mobile,
                }
            });
            
            orderData.save()
                .then(order => {
                    res.status(200).send({ status: true, msg: "Order successful", order: order });
                })
                .catch(err => {
                    throw(err)
                });      
        } catch(e) {
			res.status(400).send({ status: false, msg: e.message });
        }  
    });

    //  Update Status Of Order
    api.put('/admin/:orderId', adminAuthorization, (req, res) => {

        Order.findOneAndUpdate({_id: req.params.orderId}, {$set: {
            status: req.body.status
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    const createNewUser = async (user) => {
        const {email, password, firstName, lastName, type, mobile, altMobile, city, street, zipCode, state} = user;

		await User.findOne({ username: email }, (err, user) => {
			if (err) {
				return { status: false, msg: err }
			}

			if (user) {
				return { status: false, msg: 'A user has already registered with this email'};
			} else {

                User.register(new User({
                    email,
                    username: email,
                    firstName,
                    lastName,
                    type,
                    mobile,
                    altMobile,
                    street,
                    city,
                    state,
                    zipCode,
                }),
                password,
                (err, user) => {
                    if (err) {
                        return { status: false, msg: err }
                    }

                    if (user) {
                        console.log('Sending mail...')
                        const token = generateToken(user);
                        const output = `
                            <div>
                                <h1>Welcome to Cherry's African Store</h1>
                                <p>Click the link below to confirm your account...</p>
                                <a href='${process.env.SERVER_URL}v1/user/verify/${token}'>Verify</a>
                            </div>
                        `;
                        const subject = 'Account Activation';
                        sendConfirmationMail(user, subject, output);

                        return {status: true, userID: user._id, msg: 'A message has been sent to your email; Confirm your account.'};

                    }
                })
			}
		});
    }

    const getAnonymouseID = async () => {

        const user = await User.findOne({ annonymous: true });

        console.log(user)

        // if (err) {
        //     return { status: false, msg: err }
        // }

        if (user) return { status: true, userID: user._id};
        else return {status: false, msg: 'No user has been registered for this purpose'}
    }

	return api;
}
