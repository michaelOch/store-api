import env from "dotenv";
env.config();
import jwt from "jsonwebtoken";

const adminAuthorization = (req, res, next) => {

    const header = req.headers['authorization'];

    if (header) {

        const token = header.split(' ')[1];

        jwt.verify(token, process.env.SECRET, (err, authorizedData) => {
            if (err) {
                console.log('an error occured in token verification!')
                res.status(403).json({status: false, msg: err.message})
                return;
            }

            if (authorizedData.type.includes('admin')) {
                
                next();
            } else {
                console.log('You have no access to this resource')
                res.status(403).json({status: false, msg: "You have no access to this resource"})
                return;
            }
        });

    } else {
        console.log('Authorization-Token is required')
        res.status(403).json({status: false, msg: "Authorization-Token is required"})
        return;
    }

}

const authentication = (req, res, next) => {

    const header = req.headers['authorization'];

    if (header) {

        const token = header.split(' ')[1];

        jwt.verify(token, process.env.SECRET, (err, authorizedData) => {
            if (err) {
                console.log('an error occured in token verification!')
                res.status(403).json({status: false, msg: err.message})
                return;
            }

            if (authorizedData) {
                req.user = authorizedData;
                next();
            } else {
                console.log('You have no access to this resource')
                res.status(403).json({status: false, msg: "You have no access to this resource"})
                return;
            }
        });

    } else {
        console.log('Authorization-Token is required')
        res.status(403).json({status: false, msg: "Authorization-Token is required"})
        return;
    }

}

module.exports = {
  adminAuthorization,
  authentication
};
