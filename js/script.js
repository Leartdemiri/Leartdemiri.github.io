// Variables
const DRAGON_BALL_COUNT = 7;
let mapVisible = false;
let mapInstance = null;
let userMarker = null;
let userCircle = null;
let dragonBallMarkers = [];
let partyStarted = false;



// Declare buttons
const mapButton = document.getElementById("ShowMapButton");
const searchButton = document.getElementById("SearchBallButton");

// Assign button functions
mapButton.addEventListener("click", toggleMap);
searchButton.addEventListener("click", scanForDragonBalls);

document.addEventListener("DOMContentLoaded", () => {
    checkIfGameStarted();
});

function checkIfGameStarted() {
    let gameInfo = localStorage.getItem("GameInformation");

    if (gameInfo) {
        gameInfo = JSON.parse(gameInfo);
        console.log("Game Information Loaded:", gameInfo);

        if (gameInfo.started) {
            searchButton.disabled = true; // Disable scanning
            alert("Game has already started. Using saved Dragon Ball locations.");

            // Ensure the map is initialized before loading markers 
            toggleMap(); // Show the map first
            setTimeout(() => {
                loadStoredDragonBalls(gameInfo.dragonBalls);
            }, 1000); // Small delay to ensure the map is ready
        } else {
            searchButton.disabled = false;
        }
    }
}


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
                userMarker = L.marker([latitude, longitude])
                    .addTo(mapInstance)
                    .bindPopup("You are here!")
                    .openPopup();

                // Add a 50m radius circle
                userCircle = L.circle([latitude, longitude], {
                    radius: 50, // 50 meters
                    color: 'yellow',
                    fillColor: 'yellow',
                    fillOpacity: 0.3
                }).addTo(mapInstance);

                // Set up movement tracking
                trackUserMovement();
            },
            () => {
                console.warn("Location access denied. Using default coordinates.");
            }
        );
    }
}

function scanForDragonBalls() {
    alert('Scanning for Dragon Balls...');

    if (!userMarker) {
        alert("Location not available yet. Please wait.");
        return;
    }

    // Clear existing markers
    dragonBallMarkers.forEach(marker => mapInstance.removeLayer(marker));
    dragonBallMarkers = [];

    const { lat, lng } = userMarker.getLatLng();
    let dragonBalls = [];

    for (let i = 0; i < DRAGON_BALL_COUNT; i++) {
        const { lat: ballLat, lng: ballLng } = getRandomPointInCircle(lat, lng, 50);
        
        const marker = L.marker([ballLat, ballLng])
            .addTo(mapInstance)
            .bindPopup("🟠 A Dragon Ball is here!");
        
        dragonBallMarkers.push(marker);
        dragonBalls.push({ lat: ballLat, lng: ballLng }); // Store coordinates
    }

    // Save new locations in localStorage
    localStorage.setItem("GameInformation", JSON.stringify({ started: true, dragonBalls }));
    searchButton.disabled = true; // Disable further scanning
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

// Track user movement inside the yellow circle
function trackUserMovement() {
    setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Calculate distance from original center
                    const center = userCircle.getLatLng();
                    const distance = getDistance(center.lat, center.lng, latitude, longitude);

                    // Allow movement inside the circle only
                    if (distance <= 50) {
                        userMarker.setLatLng([latitude, longitude]);
                        mapInstance.setView([latitude, longitude]);
                    }
                },
                () => {
                    console.warn("Failed to get updated location.");
                }
            );
        }
    }, 1000); // Update position every second
}

// Helper function to calculate distance between two coordinates in meters
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function loadStoredDragonBalls(dragonBalls) {
    dragonBalls.forEach(({ lat, lng }) => {
        const marker = L.marker([lat, lng])
            .addTo(mapInstance)
            .bindPopup("🟠 A Dragon Ball is here!");

        dragonBallMarkers.push(marker);
    });
}