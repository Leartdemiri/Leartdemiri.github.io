// Variables
let mapVisible = false;
let mapInstance = null;
const DRAGON_BALL_COUNT = 7;

// Declare buttons
const mapButton = document.getElementById("ShowMapButton");
const searchButton = document.getElementById("SearchBallButton");

// Assign button functions
mapButton.addEventListener("click", toggleMap);
searchButton.addEventListener("click", scanForDragonBalls);

function toggleMap() {
    const mapElement = document.getElementById("map");

    // Toggle map visibility
    mapVisible = !mapVisible;
    mapElement.style.display = mapVisible ? 'block' : 'none';

    if (mapVisible) {
        initializeMap();
    }
}

function initializeMap() {
    if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = setupMap;
        document.body.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    } else {
        setupMap();
    }
}

function setupMap() {
    if (mapInstance) return; // Prevent multiple map instances

    mapInstance = L.map('map', { zoomControl: false }).setView([0, 0], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Center map on user
                mapInstance.setView([latitude, longitude], 18);

                // Add marker at user's location
                L.marker([latitude, longitude]).addTo(mapInstance)
                    .bindPopup("You are here!")
                    .openPopup();

                // Add a 50m radius circle
                const userCircle = L.circle([latitude, longitude], {
                    radius: 50, // 50 meters
                    color: 'yellow',
                    fillColor: 'yellow',
                    fillOpacity: 0.3
                }).addTo(mapInstance);

                // Restrict the view to the circle bounds
                const bounds = userCircle.getBounds();
                mapInstance.setMaxBounds(bounds);
                mapInstance.fitBounds(bounds);

                // Generate Dragon Balls inside the circle
                generateDragonBalls(latitude, longitude);
            },
            () => {
                console.warn("Location access denied. Using default coordinates.");
            }
        );
    }
}

function generateDragonBalls(centerLat, centerLng) {
    for (let i = 0; i < DRAGON_BALL_COUNT; i++) {
        const { lat, lng } = getRandomPointInCircle(centerLat, centerLng, 50);

        L.marker([lat, lng])
            .addTo(mapInstance)
            .bindPopup("🟠 A Dragon Ball is here!");
    }
}

// Generates a random point within a given radius (meters)
function getRandomPointInCircle(centerLat, centerLng, radius) {
    const earthRadius = 6371000; // Earth's radius in meters
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.sqrt(Math.random()) * radius; // Ensures uniform distribution

    const deltaLat = (randomDistance * Math.cos(randomAngle)) / earthRadius * (180 / Math.PI);
    const deltaLng = (randomDistance * Math.sin(randomAngle)) / (earthRadius * Math.cos(centerLat * Math.PI / 180)) * (180 / Math.PI);

    return {
        lat: centerLat + deltaLat,
        lng: centerLng + deltaLng
    };
}

function scanForDragonBalls() {
    alert('Scanning for Dragon Balls...');
}
