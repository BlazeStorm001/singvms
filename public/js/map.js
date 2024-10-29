const geoJSONData = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"coordinates":[[[103.59234607374128,1.2366063158341802],[103.60217832528218,1.2071162685050751],[103.63891989683168,1.201942542793205],[103.67359152068752,1.212289984373811],[103.70671115905856,1.237641367781734],[103.7356914851768,1.25419779533091],[103.76777414071614,1.2578182529970974],[103.80037581688015,1.2412626093466628],[103.81952283877763,1.2288458975958747],[103.85264112102294,1.243851778512905],[103.87126875641928,1.258856489585341],[103.90127916793745,1.2816198992287298],[103.94216489447672,1.298172573564628],[103.97890059352255,1.3043811217537211],[104.02599865532534,1.297654980057331],[104.041524723105,1.3323173296779771],[104.04359467079689,1.361805932169304],[104.02600011540699,1.3752567543075855],[103.99546526594844,1.4031912589828721],[103.95406561446299,1.3907746609460077],[103.93129857478186,1.4150901118017316],[103.88834460406548,1.4326732623223961],[103.86195354874667,1.4611206836692787],[103.8050341336704,1.4792318440311902],[103.75432034749502,1.4487159726973289],[103.71344650026714,1.4595705011513331],[103.65398738105262,1.398508205110474],[103.60787068143742,1.3188662704948086],[103.59234607374128,1.2366063158341802]]],"type":"Polygon"}}]};

let selectedCamId = null;

async function setupMap() {

    const map = L.map('map', {
        zoomSnap: 0.001
    }).setView([0, 0], 2);

    // Disable interactions after initialization
    map.scrollWheelZoom.disable(); // Disable scroll zoom
    map.doubleClickZoom.disable(); // Disable double-click zoom
    map.boxZoom.disable();         // Disable box zoom
    map.keyboard.disable();        // Disable keyboard controls
    // map.dragging.disable();   

	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

    
    const countryLayer = L.geoJSON(geoJSONData, {
    style: {
        weight: 3,
        fillOpacity: 0
    }
    }).addTo(map);
    

    map.fitBounds(countryLayer.getBounds()); 
     // Adjust map to fit the country's bounds

    try {
        const cameraDataFile = await fetch('data/img_metadata.json');
        const cameraDataJson = await cameraDataFile.json();
        for (const location in cameraDataJson) {
            // Get the first camera's latitude and longitude
            const firstCamera = cameraDataJson[location][0];
            const firstCameraData = firstCamera[Object.keys(firstCamera)[0]]; // Get the camera details
            const latitude = firstCameraData.latitude;
            const longitude = firstCameraData.longitude;

            // Create a marker for the first camera
            const marker = L.marker([latitude, longitude]).addTo(map);

            let popupContent = `<strong>${location}</strong><br><ul class="popup-list">`;
            cameraDataJson[location].forEach(camera => {
                const cameraDetails = camera[Object.keys(camera)[0]];
                popupContent += `<li data-camera-id="${cameraDetails.cam_id}">${Object.keys(camera)}</li>`;
            });
            popupContent += `</ul>`;

            // Bind the popup to the marker
            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
            const popupListItems = document.querySelectorAll('.popup-list li');
            popupListItems.forEach(item => {
            item.addEventListener('click', () => {
                const selectedCameraId = item.dataset.cameraId;
                selectedCamId = selectedCameraId;
                const selectedCameraView = item.textContent;
                displaySelectedCamera(selectedCameraId, selectedCameraView);
                    });
                });
            });
    }
    } catch (error) {
        console.error("Error fetching the camera json file");
    }
    
}

function displaySelectedCamera(cameraId, cameraView) {
        const infoDiv = document.getElementById('camera-info'); // Ensure you have a div with this ID
        infoDiv.innerHTML = `<strong>Selected Camera:</strong> ${cameraView} (ID: ${cameraId})`;
}

setupMap();
