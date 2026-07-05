// import { JsonWebTokenError } from "jsonwebtoken";
import jwt from "jsonwebtoken";

const { JsonWebTokenError } = jwt;


// Function to generate a token for User

export const generateToken = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    return token;
}