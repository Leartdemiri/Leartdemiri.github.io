// Variables
let mapVisible = false;
let mapInstance = null;

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
            },
            () => {
                console.warn("Location access denied. Using default coordinates.");
            }
        );
    }
}

function scanForDragonBalls() {
    alert('Scanning for Dragon Balls...');
}
