const STORM_GLASS_API_KEY = '4470429a-793b-11ea-98e7-0242ac130002-4470434e-793b-11ea-98e7-0242ac130002';

let map;

function initMap() {
    const myLatLng = { lat: -4.740360, lng: 55.517000 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: myLatLng,
        zoom: 10,
    });

    const locationButton = document.createElement('button');
    locationButton.textContent = "Pan to Current Location";
    locationButton.classList.add("custom-map-control-button");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

    locationButton.addEventListener("click", () => {
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
    });

    map.addListener("click", async (mapsMouseEvent) => {
        const weatherContainer = document.querySelector('.weather-container');
        weatherContainer.innerHTML = '';

        const latLng = {
            lat: mapsMouseEvent.latLng.toJSON().lat,
            lng: mapsMouseEvent.latLng.toJSON().lng
        }

        const marker = new google.maps.Marker({
            position: latLng,
        })
        marker.setMap(map);

        const weatherData = await retrieveWeatherData(latLng.lat, latLng.lng);
        await buildResultsTable(weatherData);

        marker.addListener('click', async () => {
            const markerLat = marker.getPosition().lat();
            const markerLng = marker.getPosition().lng();

            const weatherData = await retrieveWeatherData(markerLat, markerLng);
            await buildResultsTable(weatherData);
        })
    });
}

async function retrieveWeatherData(lat, lng) {
    try {
        const params = ['waterTemperature', 'windSpeed', 'windDirection', 'waveHeight', 'wavePeriod', 'waveDirection', 'swellHeight', 'swellPeriod', 'swellDirection']
        const response = await fetch(`https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`, {
            headers: { 'Authorization': STORM_GLASS_API_KEY }
        });
        const data = await response.json();
        const first24Hours = data.hours.slice(0, 24);

        return first24Hours;
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

async function buildResultsTable(weatherData) {
    const weather = document.querySelector('.weather-container');
    weather.innerHTML = weatherData.map((data) => {
        const [date, time] = data.time.split('T');
        const hour = time.toString().substring(0, 5);

        const { waterTemperature, windSpeed, windDirection, waveHeight, wavePeriod, waveDirection, swellHeight, swellPeriod, swellDirection } = data;

        return `<div class='results-container'>
            <ul class='results-list'>
                <div class='results-header'>
                    <li>${date}</li>
                    <li>${hour}</li>                
                </div>
                <div class='results-body'>
                    <li class='results-item'>Water Temp: ${waterTemperature.noaa} ??C</li>
                    <li class='results-item'>Wind Speed: ${windSpeed.noaa} m/s</li>
                    <li class='results-item'>Wind Direction: ${windDirection.noaa}??</li>
                    <li class='results-item'>Wave Height: ${waveHeight.noaa}m</li>
                    <li class='results-item'>Wave Period: ${wavePeriod.noaa}s</li>
                    <li class='results-item'>Wave Direction: ${waveDirection.noaa}??</li>
                    <li class='results-item'>Primary Swell Height: ${swellHeight.noaa}m</li>
                    <li class='results-item'>Primary Swell Period: ${swellPeriod.noaa}s</li>
                    <li class='results-item'>Primary Swell direction: ${swellDirection.noaa}??</li>
                </div>
            </ul>
        </div>`
    }).join('');
}

window.initMap = initMap;