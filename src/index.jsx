// src/index.jsx
import './scenes/mainScene.js';
import '../styles.css';
import html2canvas from 'html2canvas';

const loadGoogleMapsScript = () => {
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; // Vercel environment variable
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&v=weekly`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
};
loadGoogleMapsScript();

window.initMap = function() {
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 20,
        center: { lat: 12.9254, lng: 77.55005 },
    });

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    updateTrafficDisplayPlaceholder("Calculating traffic density...");

    // Set a 10-second fallback in case `tilesloaded` doesn't fire
    const fallbackTimeout = setTimeout(() => {
        console.log("Fallback: Starting capture after 10 seconds.");
        captureAndAnalyzeMap();
    }, 10000);

    google.maps.event.addListenerOnce(trafficLayer, 'tilesloaded', () => {
        console.log("Traffic layer tiles loaded.");
        clearTimeout(fallbackTimeout);  // Clear fallback if event fires
        captureAndAnalyzeMap();
    });
}

function captureAndAnalyzeMap() {
    const mapElement = document.getElementById("map");

    html2canvas(mapElement).then((canvas) => {
        console.log("Canvas captured.");
        const trafficDensity = analyzeTrafficColors(canvas);
        updateTrafficDisplay(trafficDensity);
    }).catch((error) => {
        console.error("Error capturing canvas:", error);
        updateTrafficDisplayPlaceholder("Error capturing traffic data.");
    });
}

function analyzeTrafficColors(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let redPixels = 0;
    let orangePixels = 0;
    let yellowPixels = 0;
    let greenPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (isRed(r, g, b)) {
            redPixels++;
        } else if (isOrange(r, g, b)) {
            orangePixels++;
        } else if (isYellow(r, g, b)) {
            yellowPixels++;
        } else if (isGreen(r, g, b)) {
            greenPixels++;
        }
    }

    const totalPixels = redPixels + orangePixels + yellowPixels + greenPixels;
    const redDensity = (redPixels / totalPixels) * 100;
    const orangeDensity = (orangePixels / totalPixels) * 100;
    const yellowDensity = (yellowPixels / totalPixels) * 100;
    const greenDensity = (greenPixels / totalPixels) * 100;

    console.log(`Pixel Counts - Red: ${redPixels}, Orange: ${orangePixels}, Yellow: ${yellowPixels}, Green: ${greenPixels}`);
    return { redDensity, orangeDensity, yellowDensity, greenDensity };
}

function updateTrafficDisplay({ redDensity, orangeDensity, yellowDensity, greenDensity }) {
    const baseCarCount = 100;
    const dynamicCarCount = Math.floor(baseCarCount * (redDensity + orangeDensity + yellowDensity + greenDensity) / 100);

    const carsToRemoveRed = Math.round((redDensity / 100) * dynamicCarCount * 0.6);
    const carsToRemoveOrange = Math.round((orangeDensity / 100) * dynamicCarCount * 0.4);
    const carsToRemoveYellow = Math.round((yellowDensity / 100) * dynamicCarCount * 0.2);
    const carsToRemoveGreen = Math.round((greenDensity / 100) * dynamicCarCount * 0.05);

    const carsRemoved = carsToRemoveRed + carsToRemoveOrange + carsToRemoveYellow + carsToRemoveGreen;

    const trafficInfo = document.getElementById("traffic-info");
    if (trafficInfo) {
        trafficInfo.innerHTML = `
            <p><strong>Traffic Density Analysis:</strong></p>
            <p>High (Red): ${redDensity.toFixed(2)}%</p>
            <p>Moderate (Orange): ${orangeDensity.toFixed(2)}%</p>
            <p>Light (Yellow): ${yellowDensity.toFixed(2)}%</p>
            <p>No Traffic (Green): ${greenDensity.toFixed(2)}%</p>
            <p>Total Cars Removed: ${carsRemoved}</p>
        `;
    }
}

// Updated color classification thresholds
function isRed(r, g, b) {
    return r > 180 && g < 80 && b < 80;  // High traffic red
}

function isOrange(r, g, b) {
    return r > 180 && g > 100 && g < 160 && b < 80;  // Moderate traffic orange
}

function isYellow(r, g, b) {
    return r > 200 && g > 160 && g < 220 && b < 80;  // Light traffic yellow
}

function isGreen(r, g, b) {
    return g > 180 && r < 100 && b < 100;  // No traffic green
}


function updateTrafficDisplayPlaceholder(message) {
    const trafficInfo = document.getElementById("traffic-info");
    if (trafficInfo) {
        trafficInfo.innerHTML = `<p>${message}</p>`;
    }
}

// Insert a container in the HTML to display traffic density information
document.body.insertAdjacentHTML('beforeend', `
    <div id="traffic-info" style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); font-size: 14px;">
        <p>Initializing traffic density analysis...</p>
    </div>
`);