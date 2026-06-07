const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve your index.html static file
app.use(express.static(path.join(__dirname, 'public')));

// Secure route to exchange GitHub code for user data
app.post('/api/auth/github', async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, {
            headers: { Accept: 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;
        
        if (!accessToken) {
            throw new Error('GitHub token exchange failed');
        }

        // 2. Fetch the user's real GitHub profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // 3. Send the user data back to the frontend
        res.json({
            user: {
                name: userResponse.data.name || userResponse.data.login,
                username: userResponse.data.login,
                avatar: userResponse.data.avatar_url
            }
        });

    } catch (error) {
        console.error('Auth Error:', error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
