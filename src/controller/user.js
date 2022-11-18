import { Router } from "express";
import User from "../model/user";
import passport from "passport";
import env from "dotenv";
env.config();
import jwt from "jsonwebtoken";

import generateToken from "../helpers/generateToken";
import { adminAuthorization, authentication } from "../middleware/adminAuth";
import sendConfirmationMail from '../services/sendMail';

export default ({ config, db }) => {
    const api = Router(); // 'v1/user'
    
    

    api.get('/', adminAuthorization, (req, res) => {
		User.find({}, null, {sort: { date: 'desc' }}, (err, users) => {
			if (err) {
				res.status(500).json({ status: false, msg: "A server error occured" });
				return;
			}
			
			res.status(200).send({ status: true, users: users });
		});
    });

	api.post('/register', async (req, res) => {

        console.log('Welcome to register')


        const {email, password, firstName, lastName, type, mobile, altMobile, city, street, zipCode, state, next} = req.body;

		await User.findOne({ username: email }, (err, user) => {
			if (err) {
				res.status().send({ status: false, msg: err });
				return;
			}

			if (user) {
                console.log('A user has already registered with this email')
				return res.status(400).json({msg: 'A user has already registered with this email'});
			} else {

				console.log('Welcome to user registration')

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
                        console.log('User registration error: ', err);
                        res.send({ status: false, msg: err.message });
                        return;
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

                        return res.status(200).json({status: true, userID: user._id, msg: 'A message has been sent to your email; Confirm your account.'});

                    }

                })
			}
		});

	});

	api.post('/login', (req, res) => {
        console.log('Welcome to Login')

		passport.authenticate('local', async function (err, user) {
			// If Passport throws/catches an error
			if (err) {
                console.log('Login Passport error: ', err)                            
				res.status(404).json({ status: false, msg: 'User not found' });
				return;
            }

			if (user) {
                console.log('Found a user match...');
                // if (!user.verified) {
                //     // throw new Error('Please confirm your email to login');
                //     res.status(404).json({ status: false, msg: 'Please confirm your email to login' });
                //     return;
                // }
                const token = generateToken(user);
                res.status(200).json({
                    token,
                    user: {
                        _id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        type: user.type,
                        mobile: user.mobile,
                        altMobile: user.altMobile,
                        city: user.city,
                        street: user.street,
                        zipCode: user.zipCode,
                        state: user.state
                    }
                });

			} else {
				// If user is not found
				res.status(401).send({ status: false, msg: 'Email or password is incorrect' });
			}

			
		})(req, res)
    });

    api.post('/forgotpassword', (req, res) => {
        console.log('Forgot Password...')
        const { email } = req.body;

        User.findOne({email}, (err, user) => {
            if (err) {
                return res.status(404).json({ status: false, msg: "Can't find the user" });
            }

            if (user) {
                console.log('Found user')
                const token = generateToken(user);
                const output = `
                    <div>
                        <h2>Please click on the given link to reset your password</h2>
                        <p><a href='${process.env.CLIENT_URL}resetpassword/${token}'>Reset password...</a></p>
                    </div>
                `;
                const subject = 'Reset Password';
                sendConfirmationMail(user, subject, output);

                return res.status(200).json({msg: 'A message has been sent to your email'});
            }
            
        })
    });

    api.put('/resetpassword', (req, res) => {
        console.log('Resetting password')
        const { resetLink, newPassword } = req.body;
        if (resetLink) {
            jwt.verify(resetLink, process.env.SECRET, (err, data) => {
                if (err) {
                    console.log('Incorrect token or its expired!')
                    res.status(403).json({status: false, msg: 'Incorrect token or its expired!'})
                    return;
                }
    
                if (data) {
                    User.findById(data.id, (err, user) => {
                        if (err) {
                            console.log("Can't find user")
                            res.status(403).json({status: false, msg: "Can't find User"})
                            return;
                        }

                        if (user) {
                            console.log('Found user')
                            user.setPassword(newPassword, () => {
                                console.log('Saving password')
                                user.save();
                                res.status(200).json({msg: 'Password reset was successful'});
                            })
                        }
                    })
                } else {
                    console.log('You have no access to this resource')
                    res.status(403).json({status: false, msg: "Incorrect token or its expired!"})
                    return;
                }
            })
        } else {
            return res.status(401).json({ status: false, msg: "Authentication error!!!" });
        }
    })

    api.get('/:userId', authentication, (req, res) => {

        User.findById(req.params.userId, (err, user) => {
            if (err) {
                console.log("Can't find the user")
                res.status(500).json({ status: false, msg: "Can't find the user" });
				return;
            }

            if (user) {
                console.log("Found the user")
                res.json({
                    user: {
                        _id: user._id,
                        date: user.date,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        type: user.type,
                        mobile: user.mobile,
                        altMobile: user.altMobile,
                        city: user.city,
                        street: user.street,
                        zipCode: user.zipCode,
                        state: user.state
                    }
                });
            }
        })
    });

    //  Update Mobiles and Address
    api.put('/:userId', authentication, (req, res) => {

        User.findOneAndUpdate({_id: req.params.userId}, {$set: {
            mobile: req.body.mobile,
            altMobile: req.body.altMobile,
        }},{ new: true })
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

    //  Verify User Account
    api.get('/verify/:token', (req, res) => {
        console.log('Verifying Account...')
        jwt.verify(req.params.token, process.env.SECRET, (err, data) => {
            if (err) {
                console.log('an error occured in token verification!')
                res.status(403).json({status: false, msg: err.message})
                return;
            }

            if (data) {
                User.findOneAndUpdate({_id: data.id}, {$set: {
                    verified: true
                }},{ new: true })
                    .then(data => {
                        console.log(data)
                        res.redirect(`${process.env.CLIENT_URL}login`);
                    })
                    .catch(err => {
                        console.log(err)
                    })
            } else {
                console.log('You have no access to this resource')
                res.status(403).json({status: false, msg: "You have no access to this resource"})
                return;
            }
        });
    });
    
    api.get('/admin/:userId', adminAuthorization, (req, res) => {

        User.findById(req.params.userId, (err, user) => {
            if (err) {
                res.status(500).json({ status: false, msg: "Can't find the user" });
				return;
            }

            if (user) {

                res.json({
                    user: {
                        _id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        type: user.type,
                        mobile: user.mobile,
                        altMobile: user.altMobile,
                        city: user.city,
                        street: user.street,
                        zipCode: user.zipCode,
                        state: user.state,
                        date: user.date
                    }
                });
            }
        })
    });

    // api.post('/admin/register', async (req, res) => {

    //     console.log('Welcome to admin register')

	// 	const type = req.body.type;
	// 	const email = req.body.email;
    //     const name = req.body.name;
    //     const password = req.body.password;

	// 	await User.findOne({ username: email }, (err, user) => {
	// 		if (err) {
	// 			res.status().send({ status: false, msg: err });
	// 			return;
	// 		}

	// 		if (user) {

	// 			return res.status(400).json({email: 'A user has already registered with this email'});
	// 		} else {

	// 			console.log('Welcome to admin user registration')

    //             User.register(new User({
    //                 email,
    //                 username: email,
    //                 name,
    //                 type,
    //                 verified: true,
    //             }),
    //             password,
    //             (err, user) => {
    //                 if (err) {                            
    //                     if (err) {
    //                         res.send({ status: false, msg: err });
    //                         return;
    //                     }
    //                 }

    //                 if (user) {
    //                     res.json(user);
    //                 }

    //             })
	// 		}
	// 	});

    // });
    
    //  Delete User
    api.delete('/admin/:userId', adminAuthorization, (req, res) => {

        User.deleteOne({_id: req.params.userId})
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json({msg: err});
            })
    });

	return api;
}
