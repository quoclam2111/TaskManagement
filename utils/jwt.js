// require("dotenv").config();
// const SECRET_KEY = process.env.JWT_SECRET;
// const jwt = require('jsonwebtoken');

// function generateToken(payload) {
//     return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
// }

// function verifyToken(token) {
//     try {
//         const decoded = jwt.verify(token, SECRET_KEY);
//         return { valid: true, decoded };
//     } catch (err) {
//         return { valid: false, error: err };
//     }
// }

// module.exports = { generateToken, verifyToken };



require("dotenv").config();
const SECRET_KEY = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');

// ⚠️ Kiểm tra SECRET_KEY
if (!SECRET_KEY) {
    console.error('❌ CRITICAL: JWT_SECRET not found in .env file!');
    process.exit(1);
}

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration time (default: 7d)
 * @returns {String} JWT token
 */
function generateToken(payload, expiresIn = '7d') {
    try {
        return jwt.sign(payload, SECRET_KEY, { expiresIn });
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Failed to generate token');
    }
}

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} {valid: boolean, decoded?: Object, error?: String}
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return { valid: true, decoded };
    } catch (err) {
        let errorMessage = 'Invalid token';
        
        if (err.name === 'TokenExpiredError') {
            errorMessage = 'Token expired';
        } else if (err.name === 'JsonWebTokenError') {
            errorMessage = 'Malformed token';
        }
        
        return { 
            valid: false, 
            error: errorMessage
        };
    }
}

module.exports = { generateToken, verifyToken };