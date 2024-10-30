let allImgData = []
let allTimeStamps = [];

let savedCamId = null;
let savedDate = null;
let savedTime = null;
let savedConfidence = null;
let savedOverlap = null;
let savedTrackHistory = null;
let isTrackingEnabled = true;
let trackEndTime = 0;

var thumbnail_swiper = new Swiper(".thumbnail-swiper", {
    loop: false,
    spaceBetween: 10,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,
  });

var main_swiper = new Swiper(".main-swiper", {
    loop: false,
    spaceBetween: 10,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    thumbs: {
        swiper: thumbnail_swiper,
    },
  });

document.getElementById('inference-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission from reloading the page
    // clear previous data
    main_swiper.removeAllSlides();
    thumbnail_swiper.removeAllSlides();
    allImgData = []
    allTimeStamps = [];
    // Get form input values
    savedCamId = selectedCamId;
    savedDate = document.getElementById('date').value;
    savedTime = document.getElementById('time').value;
    savedConfidence = document.getElementById('confidence').value;
    savedOverlap = document.getElementById('overlap').value;
    savedTrackHistory = document.getElementById('track-history').value;
    savedTrackDuration = document.getElementById('track-duration').value;
    isTrackingEnabled = document.getElementById('live_tracking').checked;

    if (!savedCamId) {
        alert("Please select the camera from the Map...");
    }
    if (!savedConfidence) {
        savedConfidence = 0.5
    }
    if (savedConfidence > 1 || savedConfidence < 0) {
        alert("Invalid value for confidence");
    }

    if(!savedOverlap) {
        savedOverlap = 0.5
    }

    if (savedOverlap > 1 || savedOverlap < 0) {
        alert("Invalid value for overlap");
    }

    if(!savedTrackHistory) {
        savedTrackHistory = 5
    }


    (async () => {
        let imgUrlsGenerator  = fetchImageUrls(savedCamId, savedDate, savedTime, savedTrackHistory, 1);

        for await (const img of imgUrlsGenerator) {
            console.log("Img to be infered: ", img);
            if (!img) {
                continue;
            }
            const ts_in_milsecs = getUtcDate(img.ts.split('+')[0]).getTime();
            const slideIndex = findSlideInsertIndex(allTimeStamps, ts_in_milsecs);
            addImageLoader(slideIndex);
            const inferenceData = await fetchInferenceData(img, savedConfidence, savedOverlap);
            if (!inferenceData) {
                continue;
            }
            const vehicle_info = extractVehicleInfo(inferenceData);
            removeImageLoader(slideIndex);
            addImageToSlider(img, inferenceData, slideIndex, ts_in_milsecs, vehicle_info);
            allImgData.splice(allImgData.length - slideIndex, 0, {timestamp: img.ts, ts_in_milsecs: ts_in_milsecs, vehicle_info: vehicle_info} );
            updateSliderDisplay();
            createCharts();
        }

    })();
    if (isTrackingEnabled) {
        setInterval(liveTrackingCallback, 60000);
        trackEndTime = Date.now() + savedTrackDuration*60*1000;
    }   
    
});


function findSlideInsertIndex(sortedList, num) {
    let left = 0;
    let right = sortedList.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        // Compare mid element with num
        if (sortedList[mid] < num) {
            // We need to insert before mid
            right = mid - 1;
        } else {
            // We need to insert after mid
            left = mid + 1;
        }
    }
    
    // left is the index where num should be inserted
    return left;
}


 // Update the displayed value when the slider is moved

 document.getElementById('track-history').addEventListener('input', function() {
    const track_history_val = document.getElementById('track-history-val');
    track_history_val.textContent =  document.getElementById('track-history').value + ' minutes';
 });

 document.getElementById('track-duration').addEventListener('input', function() {
    const track_duration_val = document.getElementById('track-duration-val');
    track_duration_val.textContent =  document.getElementById('track-duration').value + ' minutes';
 });

  function addImageLoader(slide_index) {
    main_swiper.addSlide(slide_index, 
		`<div class="swiper-slide">
            <div class='loader'></div>
        </div>`,
	);
    thumbnail_swiper.addSlide(slide_index, 
		`<div class="swiper-slide">
            <div class='loader'></div>
        </div>`,
	);
  }

  function removeImageLoader(slide_index) {
    main_swiper.removeSlide(slide_index);
    thumbnail_swiper.removeSlide(slide_index);
  }
  function addImageToSlider(img, inference_data, slide_index, ts_in_milsecs, vehicle_info) {
    if (!img || !inference_data) {
        return;
    }

    // Extract the base64 image from the visualization key
    allTimeStamps.splice(slide_index, 0, ts_in_milsecs);
    const img_bas64 = inference_data.visualization;
    


    main_swiper.addSlide(slide_index, 
		`<div class="swiper-slide">
            <div class="overlay-banner">Total Vehicles: ${vehicle_info.total_count}, Cars: ${vehicle_info.cars}, Two-wheelers: ${vehicle_info.two_wheelers}, Trucks: ${vehicle_info.trucks}, Buses: ${vehicle_info.buses}, Timestamp: ${img.ts}</div>
            <img src="data:image/jpeg;base64,${img_bas64}" alt="Image at ${img.ts}"/>
        </div>`,
	);
    thumbnail_swiper.addSlide(slide_index, 
		`<div class="swiper-slide">
            <img src="data:image/jpeg;base64,${img_bas64}" alt="Image at ${img.ts}"/>
        </div>`,
	);
  }


// Format date and time into the correct API format (YYYY-MM-DDTHH:MM:SS)
function formatDate(date, time) {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}T${time}:00`;
}


function getCurrentSingaporeTime() {
    // Get the current date and time in Singapore's timezone
    const sgDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });

    // Create a new Date object from the locale string
    const date = new Date(sgDate);

    // Format the date into the desired format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Combine into the final string
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    return formattedDate;
}

function getUtcDate(dateTime) {
     // Parse the input date string as a UTC+8 date
     const [datePart, timePart] = dateTime.split("T");
     const [year, month, day] = datePart.split("-");
     const [hours, minutesPart, seconds] = timePart.split(":");
 
     // Create a Date object for UTC+8 by converting the hours to UTC
     const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 8, minutesPart, seconds || "00"));
     return utcDate;
 
}

function extractVehicleInfo(jsonData) {
    let trucks = 0;
    let cars  = 0;
    let buses = 0;
    let two_wheelers = 0;
    let total_count = jsonData.predictions.length;
    for (const pred of jsonData.predictions) {
        if (pred.class === 'car') {
            cars++;
        } else if (pred.class === 'bus'){
            buses++;
        } else if (pred.class === 'truck'){
            trucks++;
        } else if (pred.class === 'two-wheeler'){
            two_wheelers++;
        }
    }
    return {total_count: total_count, trucks: trucks, cars: cars, buses:buses, two_wheelers:two_wheelers };
}

function adjustTime(dateTime, minutes) {
    const utcDate = getUtcDate(dateTime);
    let epochTimeInMilSeconds = Math.floor(utcDate.getTime());
    epochTimeInMilSeconds -= minutes * 60 * 1000;
    const adjustedDate = new Date(epochTimeInMilSeconds + 8 * 3600 * 1000);
    let isoString = adjustedDate.toISOString().slice(0, 19); // Remove the "Z" part
    return isoString;
}


async function* fetchImageUrls(cameraId, date, time, history, interval) {
    const imageList = [];
    const seenTimestamps = new Set();
    let currentTimestamp = getCurrentSingaporeTime();
    let currentTimestampInMilSecs = Date.now();
    if (date && time) {
        currentTimestamp = formatDate(date, time).toString();
        currentTimestampInMilSecs = getUtcDate(currentTimestamp).getTime();
    }
    

    for (let i = 0; i <= history; i += interval) {
        try {
            const img = await fetchImageUrl(cameraId, currentTimestamp);
            if (!img) {
                currentTimestamp = adjustTime(currentTimestamp, interval);
                continue;
            }
            const imgTs = img.ts.split('+')[0];
            const imgTsInMilSecs = getUtcDate(imgTs).getTime();
            if (!currentTimestamp) {
                currentTimestamp = imgTs;
                currentTimestampInMilSecs = imgTsInMilSecs;
            }
            
            if (imgTsInMilSecs < currentTimestampInMilSecs - 60*1000*history) {
                break;
            }

            if (!seenTimestamps.has(img.ts)) {
                imageList.push(img);
                seenTimestamps.add(img.ts);
                yield img;
            }

            currentTimestamp = adjustTime(currentTimestamp, interval);
        } catch (error) {
            console.error('Error fetching traffic image:', error);
            return null;
        }
    }

    return imageList;
}


async function fetchImageUrl(cameraId, formattedDate) {
    const apiUrl = `https://api.data.gov.sg/v1/transport/traffic-images`;
    try {
        let req_url;
        if (formattedDate) {
            req_url = `${apiUrl}?date_time=${formattedDate}`;
        } else {
            req_url = apiUrl;
        }
        
        const response = await fetch(req_url);
        const data = await response.json();
        const cameras = data.items[0].cameras;
        const camera = cameras.find(cam => cam.camera_id === cameraId);

        if (camera) {
            return {url: camera.image, ts: camera.timestamp};
        } else {
            console.error('Camera not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching traffic image:', error);
        return null;
    }
}


const liveTrackingCheckbox = document.getElementById('live_tracking');
    const dateTimeContainer = document.getElementById('date-time-container');
    const trackDurationContainer = document.getElementById('track-duration-container');

    function toggleFields() {
        const shouldHide = liveTrackingCheckbox.checked;
        dateTimeContainer.style.display = shouldHide ? 'none' : 'block';
        trackDurationContainer.style.display = shouldHide ? 'block' : 'none';
    }

    // Initial check on page load
    toggleFields();

    // Listen for changes on the live tracking checkbox
    liveTrackingCheckbox.addEventListener('change', toggleFields);


async function liveTrackingCallback() {
    if (!isTrackingEnabled || !savedCamId || Date.now() > trackEndTime) {
        return;
    }
    const img = await fetchImageUrl(savedCamId, null);
    if (!img) {
        return;
    }
    const imgTs = img.ts.split('+')[0];
    const imgTsInMilSecs = getUtcDate(imgTs).getTime();
    if (allTimeStamps.includes(imgTsInMilSecs)) {
        return;
        
    }
    const inferenceData = await fetchInferenceData(img, savedConfidence, savedOverlap);
    console.log("Adding new Image..");
    const ts_in_milsecs = getUtcDate(img.ts.split('+')[0]).getTime();
    const slideIndex = findSlideInsertIndex(allTimeStamps, ts_in_milsecs);
    const vehicle_info = extractVehicleInfo(inferenceData);
    addImageToSlider(img, inferenceData, slideIndex, ts_in_milsecs, vehicle_info);
    allImgData.splice(allImgData.length - slideIndex, 0, {timestamp: img.ts, ts_in_milsecs: ts_in_milsecs, vehicle_info: vehicle_info} );
    createCharts();
    updateSliderDisplay();
}


async function fetchInferenceData(img, confidence, overlap) {
    if (!img || !confidence || !overlap) {
        console.warn("Invalid parameter values for inference..");
    }
    const cloudRunApiUrl = '/infer';
    try {
        const response = await fetch(cloudRunApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                img_url: img.url, // Use the fetched image URL here
                confidence: confidence,
                iou: overlap,
            }),
        });
        const jsonResponse =  await response.json();
        return jsonResponse;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function toggleInstructions() {
    const content = document.getElementById('instructions-content');
    const icon = document.getElementById('icon');
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

function updateSliderDisplay() {
    const mainSwiperWrapper = document.getElementById('main-swiper-wrapper');
    const noImagesMessage = document.getElementById('no-images-message');

    if (mainSwiperWrapper.children.length === 0) {
        noImagesMessage.classList.remove('hidden'); // Show message
    } else {
        noImagesMessage.classList.add('hidden'); // Hide message
    }
}

// Call this function whenever you update the slides
updateSliderDisplay();
