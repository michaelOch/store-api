import env from "dotenv";
env.config();
import jwt from "jsonwebtoken";


const TOKEN_TIME = '1d';

const generateToken = (user) => {
  
    const token = jwt.sign({
      id: user.id,
      type: user.type
    },
    process.env.SECRET, {
        expiresIn: TOKEN_TIME
    });

    return token;
};

export default generateToken;