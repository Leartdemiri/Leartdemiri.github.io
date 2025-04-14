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
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        className: 'green-map'
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
                    color: 'green', 
                    fillColor: 'green',
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

    dragonBallMarkers.forEach(marker => mapInstance.removeLayer(marker));
    dragonBallMarkers = [];

    const { lat, lng } = userMarker.getLatLng();
    let dragonBalls = [];

    for (let i = 0; i < DRAGON_BALL_COUNT; i++) {
        const { lat: ballLat, lng: ballLng } = getRandomPointInCircle(lat, lng, 50);

        // Generate a unique question
        const question = {
            label: `What star is this Dragon Ball #${i + 1}?`,
            choices: ["1-star", "4-star", "7-star"],
            correct: ["1-star", "4-star", "7-star"][Math.floor(Math.random() * 3)]
        };

        // Store marker with click event
        const marker = L.marker([ballLat, ballLng])
            .addTo(mapInstance)
            .bindPopup("🟠 A Dragon Ball is here!")
            .on("click", () => displayQuestion(question));

        dragonBallMarkers.push(marker);
        dragonBalls.push({ lat: ballLat, lng: ballLng, question });
    }

    // Save everything to localStorage
    localStorage.setItem("GameInformation", JSON.stringify({
        started: true,
        dragonBalls
    }));

    searchButton.disabled = true;
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
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
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
            (error) => {
                console.warn("Failed to get updated location.", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
    } else {
        console.warn("Geolocation is not supported by this browser.");
    }
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
    dragonBalls.forEach(({ lat, lng, question }) => {
        const marker = L.marker([lat, lng])
            .addTo(mapInstance)
            .bindPopup("🟠 A Dragon Ball is here!")
            .on("click", () => displayQuestion(question));

        dragonBallMarkers.push(marker);
    });
}

function displayQuestion(question) {
    const label = document.querySelector("label.form-label");
    const choices = document.querySelectorAll(".form-check");

    label.textContent = question.label;

    choices.forEach((choiceDiv, index) => {
        const input = choiceDiv.querySelector("input");
        const label = choiceDiv.querySelector("label");

        input.value = question.choices[index];
        input.checked = false;
        label.textContent = question.choices[index];
    });

    // Optional: Store the currently displayed question (for validation later)
    localStorage.setItem("CurrentQuestion", JSON.stringify(question));
}
