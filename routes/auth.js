// routes/auth.js
const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { EncryptJWT } = require('jose'); 

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Login Route with Encrypted JWT
router.post('/login', async (req, res) => {
    const { hostname, username, password } = req.body;

    if (!hostname || !username || !password ) {
        return res.status(400).json({ message: 'MongoDB Hostname, database, username, and password are required.' });
    }

    try {

        const url = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${hostname}/`;
        // Attempt to connect to MongoDB with provided credentials
        const client = new MongoClient(url);

        await client.connect();

        // Connection successful, close the connection
        await client.close();

        // Create JWT payload with MongoDB connection details
        const payload = {
            hostname,
            username,
            password,
        };

        // Ensure JWT_SECRET is base64 encoded and decode it correctly
        const key = Buffer.from(JWT_SECRET, 'base64');

        // Check if the key length is 32 bytes (256 bits)
        if (key.length !== 32) {
            return res.status(500).json({ message: 'Invalid JWT_SECRET length. It must be 32 bytes (256 bits) when decoded from base64.' });
        }

        // Encrypt the JWT
        const encryptedJWT = await new EncryptJWT(payload)
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .encrypt(key);

        res.status(200).json({ token: encryptedJWT });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Invalid MongoDB credentials or unable to connect.' });
    }
});

module.exports = router;
