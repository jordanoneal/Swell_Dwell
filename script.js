const STORM_GLASS_TEST_KEY = '4470429a-793b-11ea-98e7-0242ac130002-4470434e-793b-11ea-98e7-0242ac130002';
const GOOGLE_MAPS_TEST_KEY = 'AIzaSyDxwSS__U2ALQTIhAh29c7F9wTjzaKd9vY';
const MAP_DEFAULT_CENTER = { lat: -4.740360, lng: 55.517000 };
const MAP_DEFAULT_ZOOM = 10;

let map;

// Load the Google Maps API script with a callback
function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_TEST_KEY}&callback=initMap`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
}

// This function will be called when the Google Maps script is loaded
function initMap() {
    const MAP_CONTROL_POSITION = google.maps.ControlPosition.TOP_CENTER;

    map = new google.maps.Map(document.getElementById("map"), {
        center: MAP_DEFAULT_CENTER,
        zoom: MAP_DEFAULT_ZOOM,
    });

    const locationButton = createLocationButton();
    map.controls[MAP_CONTROL_POSITION].push(locationButton);

    locationButton.addEventListener("click", handleLocationButtonClick);

    map.addListener("click", handleMapClick);
}

function createLocationButton() {
    const locationButton = document.createElement('button');
    locationButton.textContent = "Pan to Current Location";
    locationButton.classList.add("custom-map-control-button");
    return locationButton;
}

function handleLocationButtonClick() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setCenter(pos);
            },
            () => {
                handleLocationError(true, map.getCenter());
            }
        );
    } else {
        handleLocationError(false, map.getCenter());
    }
}

async function handleMapClick(mapsMouseEvent) {
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.innerHTML = ''; //Clear the results of the previous weather data

    const latLng = {
        lat: mapsMouseEvent.latLng.toJSON().lat,
        lng: mapsMouseEvent.latLng.toJSON().lng
    };

    const marker = createMarker(latLng);
    marker.setMap(map);

    const weatherData = await retrieveWeatherData(latLng.lat, latLng.lng);
    await buildResultsTable(weatherData, marker);
}

function createMarker(latLng) {
    return new google.maps.Marker({
        position: latLng,
    });
}

async function retrieveWeatherData(lat, lng) {
    try {
        const params = ['waterTemperature', 'windSpeed', 'windDirection', 'waveHeight', 'wavePeriod', 'waveDirection', 'swellHeight', 'swellPeriod', 'swellDirection'];
        const response = await fetch(`https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`, {
            headers: { 'Authorization': STORM_GLASS_TEST_KEY }
        });
        const data = await response.json();
        return data.hours.slice(0, 24);
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

async function buildResultsTable(weatherData, marker) {
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.innerHTML = weatherData.map(data => createResultsEntry(data)).join('');

    marker.addListener('click', async () => {
        const markerLat = marker.getPosition().lat();
        const markerLng = marker.getPosition().lng();

        const weatherData = await retrieveWeatherData(markerLat, markerLng);
        await buildResultsTable(weatherData, marker);
    });
}

function createResultsEntry(data) {
    const [date, time] = data.time.split('T');
    const hour = time.toString().substring(0, 5);
    const ampm = getAmPm(hour);

    const { waterTemperature, windSpeed, windDirection, waveHeight, wavePeriod, waveDirection, swellHeight, swellPeriod, swellDirection } = data;

    return `<div class='results-container'>
        <ul class='results-list'>
            <div class='results-header'>
                <li>${date}</li>
                <li>${convertTo12HourFormat(hour)} ${ampm}</li>                
            </div>
            <div class='results-body'>
                <li class='results-item'>Water Temp: ${waterTemperature.noaa} °C</li>
                <li class='results-item'>Wind Speed: ${windSpeed.noaa} m/s</li>
                <li class='results-item'>Wind Direction: ${windDirection.noaa}°</li>
                <li class='results-item'>Wave Height: ${waveHeight.noaa}m</li>
                <li class='results-item'>Wave Period: ${wavePeriod.noaa}s</li>
                <li class='results-item'>Wave Direction: ${waveDirection.noaa}°</li>
                <li class='results-item'>Primary Swell Height: ${swellHeight.noaa}m</li>
                <li class='results-item'>Primary Swell Period: ${swellPeriod.noaa}s</li>
                <li class='results-item'>Primary Swell direction: ${swellDirection.noaa}°</li>
            </div>
        </ul>
    </div>`;
}

function convertTo12HourFormat(hour) {
    const [hourPart, minutePart] = hour.split(':');
    const parsedHour = parseInt(hourPart);
    const formattedHour = parsedHour % 12 || 12; // Convert 0 to 12
    return `${formattedHour}:${minutePart}`;
}

function getAmPm(hour) {
    const [hourPart] = hour.split(':');
    const parsedHour = parseInt(hourPart);
    return parsedHour >= 12 ? 'PM' : 'AM';
}

loadGoogleMapsScript();
