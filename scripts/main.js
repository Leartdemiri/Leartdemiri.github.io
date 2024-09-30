"use strict";

const DATA_KEY = "Data";
const DATA_LINK = "https://restcountries.com/v3.1/all";
let countryData;

async function fetchCountryData() {
    if (localStorage.getItem(DATA_KEY) !== null) {
        countryData = JSON.parse(localStorage.getItem(DATA_KEY));
    } else {
        const response = await fetch(DATA_LINK);
        countryData = await response.json();
        localStorage.setItem(DATA_KEY, JSON.stringify(countryData));
    }
    displayCountryList(countryData);
}

function displayCountryList(countries) {
    const countryListElement = document.getElementById("country-list");
    countryListElement.innerHTML = '';

    countries.forEach(country => {
        const listItem = document.createElement("li");

        const flagImg = document.createElement("img");
        flagImg.src = country.flags.svg;
        flagImg.alt = `Drapeau de ${country.name.common}`;
        flagImg.style.width = "50px";
        flagImg.style.marginRight = "10px";

        listItem.appendChild(flagImg);

        listItem.appendChild(document.createTextNode(country.name.common));

        countryListElement.appendChild(listItem);
    });
}

fetchCountryData();