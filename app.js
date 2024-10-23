document.getElementById('inference-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission from reloading the page

    // Get form input values
    const cameraId = document.getElementById('camera_id').value;
    let date = document.getElementById('date').value;
    let time = document.getElementById('time').value;

    // Show the loader
    document.getElementById('loader').style.display = 'block';
    document.getElementById('result-image').style.display = 'none';

    // If date or time is empty, get current date and time in Singapore Timezone
    if (!date || !time) {
        const singaporeTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
        const currentDate = new Date(singaporeTime);

        // Format date and time: DD-MM-YY and HH:MM
        date = currentDate.toLocaleDateString('en-GB').split('/').join('-'); // Convert to DD-MM-YY
        time = currentDate.toTimeString().split(':').slice(0, 2).join(':'); // Convert to HH:MM
    }

    // Fetch the traffic image
    const imageUrl = await fetchImageUrl(cameraId, date, time);
    if (!imageUrl) {
        alert("Error fetching image");
        document.getElementById('loader').style.display = 'none';
        return;
    }

    // Run inference on the fetched image using Axios
    const annotatedImage = await runInference(imageUrl);

    if (annotatedImage) {
        document.getElementById('result-image').src = annotatedImage;
        document.getElementById('result-image').style.display = 'block';
    } else {
        alert("Error running inference");
    }

    // Hide the loader
    document.getElementById('loader').style.display = 'none';
});

// Fetch image from the traffic camera API
async function fetchImageUrl(cameraId, date, time) {
    const apiUrl = `https://api.data.gov.sg/v1/transport/traffic-images`;
    let formattedDate = formatDate(date, time);

    try {
        const response = await fetch(`${apiUrl}?date_time=${formattedDate}`);
        const data = await response.json();

        const cameras = data.items[0].cameras;
        const camera = cameras.find(cam => cam.camera_id === cameraId);

        if (camera) {
            return camera.image;
        } else {
            console.error('Camera not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching traffic image:', error);
        return null;
    }
}

// Format date and time into the correct API format (YYYY-MM-DDTHH:MM:SS)
function formatDate(date, time) {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}T${time}:00`;
}

// Run inference using Axios and Roboflow API
async function runInference(imageUrl) {
    const apiKey = 'V0cj9WqFoCPdo8MDcijB';  // Replace with your Roboflow API key
    const modelId = 'vms-all/4';  // Replace with your Roboflow model ID
    const roboflowUrl = `https://detect.roboflow.com/${modelId}`;

    try {
        const response = await axios({
            method: "POST",
            url: roboflowUrl,
            params: {
                api_key: apiKey,
                image: imageUrl
            }
        });

        return response.data.image_url; // Roboflow returns a URL to the annotated image
    } catch (error) {
        console.error('Error running inference:', error);
        return null;
    }
}
