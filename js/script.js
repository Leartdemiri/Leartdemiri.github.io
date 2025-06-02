// Variables
const DRAGON_BALL_COUNT = 7;
let mapVisible = false;
let mapInstance = null;
let userMarker = null;

let dragonBallMarkers = [];
let partyStarted = false;
let collectedBalls;
let initialPlayerPosition = null;
let questions = [
    {
        label: `How many hours in a day??`,
        choices: ["48/2", "12^2", "4*5"],
        correct: "48/2"
    },
    {
        label: `Who is the best CFPT teacher`,
        choices: ["Mr. Francois", "Mr. Wanner", "Mr. Burry"],
        correct: "Mr. Francois"
    },
    {
        label: `Who is the strongest?`,
        choices: ["Luffy", "Goku", "Naruto"],
        correct: "Goku"
    }
];




// Declare buttons
const mapButton = document.getElementById("ShowMapButton");
const searchButton = document.getElementById("SearchBallButton");

// Assign button functions
mapButton.addEventListener("click", toggleMap);
searchButton.addEventListener("click", scanForDragonBalls);

document.addEventListener("DOMContentLoaded", () => {
    checkIfGameStarted();
    restoreCollectedDragonBalls();
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

    const collected = localStorage.getItem("CollectedBalls");
    if (collected) {
        collectedBalls = new Set(JSON.parse(collected));
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
    let gameInfo = localStorage.getItem("GameInformation");

    // Set up map with desired zoom limits
    mapInstance = L.map('map', {
        zoomControl: true,
        minZoom: 17,
        maxZoom: 20 // Allow zooming in very close
    }).setView([0, 0], 16);

    // Add tile layer with matching maxZoom
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        className: 'green-map',
        maxZoom: 22,
        minZoom: 1,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
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

                    initialPlayerPosition = { lat: latitude, lng: longitude };

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

        const question = questions[Math.floor(Math.random() * questions.length)];

        // Define the icon
        const icon = L.icon({
            iconUrl: `assets/imgs/${i + 1}.png`,  // Adjust path if necessary
            iconSize: [32, 32],              // Adjust size as needed
            iconAnchor: [16, 32],            // Center bottom of icon
            popupAnchor: [0, -32]            // Popup above the icon
        });

        // Create marker with custom icon
        const marker = L.marker([ballLat, ballLng], { icon })
            .addTo(mapInstance)
            .bindPopup(`The dragon ball with ${i + 1} star(s)!!`)
            .on("click", () => {
                marker._question = question;
                displayQuestion(question, marker);
            });

        dragonBallMarkers.push(marker);
        dragonBalls.push({ lat: ballLat, lng: ballLng, question });
    }

    localStorage.setItem("GameInformation", JSON.stringify({
        started: true,
        dragonBalls,
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

function trackUserMovement() {
    if (!initialPlayerPosition) return;

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                const distance = getDistance(
                    initialPlayerPosition.lat,
                    initialPlayerPosition.lng,
                    latitude,
                    longitude
                );

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


function loadStoredDragonBalls(dragonBalls) {
    dragonBalls.forEach(({ lat, lng, question }, i) => {
        const icon = L.icon({
            iconUrl: `assets/imgs/${i + 1}.png`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const marker = L.marker([lat, lng], { icon })
            .addTo(mapInstance)
            .bindPopup(`The dragon ball with ${i + 1} star(s)!!`)
            .on("click", () => {
                const userLatLng = userMarker.getLatLng();
                const markerLatLng = marker.getLatLng();

                const distance = getDistance(
                    userLatLng.lat, userLatLng.lng,
                    markerLatLng.lat, markerLatLng.lng
                );

                if (distance <= 20) {
                    marker._question = question;
                    displayQuestion(question, marker);
                } else {
                    alert(`❌ You are too far away! Get closer to the Dragon Ball (within 20 meters).`);
                }
            });


        dragonBallMarkers.push(marker);
    });
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




function displayQuestion(question, marker) {
    const label = document.querySelector("label.form-label");
    const choices = document.querySelectorAll(".form-check");
    const form = document.getElementById("dragonForm");

    label.textContent = question.label;

    choices.forEach((choiceElem, index) => {
        const input = choiceElem.querySelector("input");
        const label = choiceElem.querySelector("label");

        if (question.choices[index]) {
            input.value = question.choices[index];
            label.textContent = question.choices[index];
            choiceElem.style.display = "block";
        } else {
            choiceElem.style.display = "none";
        }
    });

    form.style.display = "block";

    form.onsubmit = (e) => {
        e.preventDefault();
        const selected = document.querySelector('input[name="dragonball"]:checked');

        if (!selected) {
            alert("Please select an answer.");
            return;
        }

        const isCorrect = selected.value === question.correct;
        form.reset();
        form.style.display = "none";

        if (isCorrect) {
            alert("✅ Correct! You got the Dragon Ball!");

            // Remove the marker directly
            mapInstance.removeLayer(marker);
            dragonBallMarkers = dragonBallMarkers.filter(m => m !== marker);

            // Remove from localStorage
            let gameInfo = JSON.parse(localStorage.getItem("GameInformation"));
            gameInfo.dragonBalls = gameInfo.dragonBalls.filter(db =>
                db.lat !== marker.getLatLng().lat || db.lng !== marker.getLatLng().lng
            );
            localStorage.setItem("GameInformation", JSON.stringify(gameInfo));

            // Add collected Dragon Ball to UI
            const list = document.getElementById("dragonBallList");
            const img = document.createElement("img");
            img.src = img.src = marker.options.icon.options.iconUrl;
            img.style.width = "40px";
            img.style.height = "40px";
            img.title = `Collected Dragon Ball ${img.alt}`;
            list.appendChild(img);

            // Extract Dragon Ball number from image URL (e.g., "1.png")
            const match = img.src.match(/(\d+)\.png/);
            const dbNumber = match ? parseInt(match[1]) : null;

            if (dbNumber) {
                // Save collected DBs
                let collected = JSON.parse(localStorage.getItem("CollectedBalls")) || [];
                if (!collected.includes(dbNumber)) {
                    collected.push(dbNumber);
                    localStorage.setItem("CollectedBalls", JSON.stringify(collected));
                }
            }



        } else {
            alert(`❌ Incorrect! The correct answer was: ${question.correct}\nAll Dragon Balls have vanished and scattered again!`);

            // Remove all markers
            dragonBallMarkers.forEach(marker => mapInstance.removeLayer(marker));
            dragonBallMarkers = [];

            // Clear local storage
            localStorage.removeItem("GameInformation");
            localStorage.removeItem("CollectedBalls");

            // Clear in-memory Set
            if (collectedBalls) collectedBalls.clear();

            // Clear UI collected ball images
            const list = document.getElementById("dragonBallList");
            list.innerHTML = "";

            // Restart scanning
            scanForDragonBalls();

        }
    };
}


function restoreCollectedDragonBalls() {
    const list = document.getElementById("dragonBallList");
    const collected = JSON.parse(localStorage.getItem("CollectedBalls")) || [];

    collected.forEach(num => {
        const img = document.createElement("img");
        img.src = `assets/imgs/${num}.png`;
        img.alt = `Dragon Ball ${num}`;
        img.style.width = "40px";
        img.style.height = "40px";
        img.title = `Collected Dragon Ball ${num}`;
        list.appendChild(img);
    });
}
