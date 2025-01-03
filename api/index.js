const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');
const cors = require('cors');
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Define routes for each HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const apiKey = process.env.ROBOFLOW_API_KEY;

// POST API Endpoint: /infer
// Takes in image URL, confidence, and iou for inference
app.post('/infer', async (req, res) => {
    const { img_url, confidence = 0.5, iou = 0.5 } = req.body;

    if (!img_url) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        const response = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/vms-all/4",
            params: {
                api_key: apiKey,
                image: img_url,
                confidence: confidence,
                overlap: iou,
                format: "image_and_json",
                stroke: 2, 
                labels: true
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Roboflow:', error);
        res.status(500).json({ error: 'Error fetching data from Roboflow' });
    }
});


module.exports = app; // Export app for Vercel
