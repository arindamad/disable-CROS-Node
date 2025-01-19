const express = require('express');
const axios = require('axios');
const router = express.Router();
const https = require('https');

// Create an HTTPS agent that skips SSL verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // Bypass SSL verification
});

router.all('/', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing "url" query parameter.' });
    }

    try {
        // Validate and parse the target URL
        const url = new URL(targetUrl);

        // Forward the request to the target URL
        const response = await axios({
            method: req.method, // Match the client's HTTP method (GET, POST, etc.)
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                'Referer': targetUrl,
            },
            withCredentials: true, 
            data: req.body,
            responseType: 'stream',
            httpsAgent
        });

        // Set response status and headers
        res.status(response.status);
        Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        // Stream the response data directly to the client
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying request:', error.message);

        if (error.response) {
            // Forward error response from target URL
            res.status(error.response.status);
            Object.entries(error.response.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
            error.response.data.pipe(res);
        } else {
            // Handle other errors (e.g., network issues)
            res.status(500).json({ error: 'Internal server error.', details: error.message });
        }
    }
});

module.exports = router;