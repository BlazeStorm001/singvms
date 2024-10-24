document.getElementById('inference-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission from reloading the page

    // Get form input values
    const cameraId = document.getElementById('camera_id').value;
    let date = document.getElementById('date').value;
    let time = document.getElementById('time').value;

    // Show the loader
    document.getElementById('loader').style.display = 'block';
    // document.getElementById('result-image').style.display = 'none';

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

    fetch(`http://localhost:3000/proxy?image_url=${imageUrl}`)
        .then(response => response.json())
        .then(data => {
            // Extract the base64 image from the visualization key
            const annotatedImageBase64 = data.visualization;

            // Set the src attribute of the result image
            const resultImage = document.getElementById('result-image');
            resultImage.src = `data:image/jpeg;base64,${annotatedImageBase64}`;
            resultImage.alt = "Annotated Image";

            // Hide loader after fetching the image
            document.getElementById('loader').style.display = 'none';
            document.getElementById('result-img').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('loader').style.display = 'none'; // Hide loader
        });
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


