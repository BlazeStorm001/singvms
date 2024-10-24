const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS

app.get('/proxy', async (req, res) => {
    const imageUrl = req.query.image_url;
    let confidence = req.query.confidence;
    let iou = req.query.iou;
    if (!confidence) {
        confidence = 0.5;
    }
    if (!iou) {
        iou = 0.5;
    }
    try {
        const response = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/vms-all/4",
            params: {
                api_key: "V0cj9WqFoCPdo8MDcijB",
                image: imageUrl,
                confidence: confidence,
                overlap: iou,
                format: "image_and_json",
                stroke: 2, 
                labels: true
            },
            
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching data from Roboflow');``
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
