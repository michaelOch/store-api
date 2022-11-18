import env from "dotenv";
env.config();
const nodemailer = require("nodemailer");
import generateToken from "../helpers/generateToken";

const sendMessage = async (user, subject, output) => {
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
        },
    });

    let mailOptions = {
        from: `"Cherry's Store" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: output,
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Didn't send")
            return console.log(error);
        }

        if (info) {
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
    });
}

export default sendMessage;