// middleware/auth.js
const { jwtDecrypt } = require('jose');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to decrypt and verify JWT, then extract MongoDB connection details
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Expecting header in the format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid.' });
    }

    try {
        const key = Buffer.from(JWT_SECRET, 'base64');
        // Decrypt and verify the JWT
        const { payload } = await jwtDecrypt(token, key);

        // Attach MongoDB connection details to the request object
        req.mongodbUrl = payload.hostname;
        req.mongodbUser = payload.username;
        req.mongodbPassword = payload.password;
        req.mongodbDatabase = payload.database;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

module.exports = authenticateToken;
