require('dotenv').config();
const express = require("express");
const api_token_middleware = express.Router();


if (!process.env.API_TOKEN) {
    throw new Error("Missing API_TOKEN in .env");
}


// Middleware to check for API token in headers
api_token_middleware.use((req, res, next) => {
    const apiToken = req.headers['x-api-token'];
    if (!apiToken) {
        const err = new Error();
        err.statusCode = 400;
        err.msg = 'Missing API Token';
        return next(err);
    }

    if (apiToken !== process.env.API_TOKEN) {
       const err = new Error();
        err.statusCode = 401;
        err.msg = 'Unauthorized: Invalid API Token';
        return next(err);
    }
    next();
});

module.exports = api_token_middleware;