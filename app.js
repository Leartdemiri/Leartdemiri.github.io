/*"use strict"*/

import { Geolocation } from '@capacitor/geolocation';

let div = document.getElementById("my-position");

const printCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();

  let str = "";
  str += 'Latitude:'+ coordinates.coords.latitude + '<br>';
  str += 'Longitude:'+ coordinates.coords.longitude + '<br>';
  div.innerHTML = str;

  alert("CA MARCHE");

};

document.getElementById("my-position-button").addEventListener("click", printCurrentPosition);

// printCurrentPosition();