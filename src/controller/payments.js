import env from "dotenv";
env.config();
import { Router } from "express";

const stripe = require('stripe')(process.env.STRIPE_SK);


export default ({ config, db }) => {
    const api = Router(); // 'v1/payment'
    
    api.post('/create-checkout-session', async (req, res) => {

        console.log("Session: ", req.body)

    const session = await stripe.checkout.sessions.create({

        payment_method_types: ['card'],

        line_items: req.body.stripeOrder,

        mode: 'payment',

        customer_email: req.body.user.email,

        // metadata: {
        //     userData: JSON.stringify(req.body.user),
        //     recipientData: JSON.stringify(req.body.recipient),
        //     orderData: JSON.stringify(req.body.order)
        // },

        success_url: `${process.env.CLIENT_URL}checkout?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${process.env.CLIENT_URL}checkout?canceled=true`,

    });

    res.json({ id: session.id });

    });

    api.post('/create-payment-intent', async (req, res) => {

        const paymentIntent = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: 'gbp',
            receipt_email: req.body.email,
            // Verify your integration in this guide by including this parameter
            metadata: {integration_check: 'accept_a_payment'},
        }); 
    
        res.json({client_secret: paymentIntent.client_secret});

    });


    return api;
}
