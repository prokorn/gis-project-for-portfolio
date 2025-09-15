// Use window.onload to ensure the DOM is fully loaded before initializing the map.
window.onload = function() {
    // Step 1: Initialize the map and set its view.
    const map = L.map('map').setView([40.7128, -74.0060], 3);

    // Step 2: Add a tile layer. This is the base map.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Step 3: Define a custom SVG icon.
    const svgIcon = L.divIcon({
        html: `<svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        className: '', // We use a class for custom styling in the CSS.
        iconSize: [18, 18], // Smaller icon size
        iconAnchor: [9, 18], // Point of the icon which corresponds to marker's location
        popupAnchor: [0, -18] // Point from which the popup should open relative to the iconAnchor
    });

    // Step 4: Loop through the landmarks and add a marker for each one.
    landmarks.forEach(landmark => {
        const marker = L.marker([landmark.lat, landmark.lng], {icon: svgIcon}).addTo(map);

        // Create a custom HTML string for the popup, including the image and the new link.
        const popupContent = `
            <div class="popup-content">
                <img src="${landmark.imageUrl}" alt="${landmark.name} photo" onerror="this.onerror=null; this.src='https://placehold.co/200x150/FFC0CB/000000?text=Image+Unavailable';">
                <h3><a href="${landmark.wikipediaUrl}" target="_blank">${landmark.name}</a></h3>
                <p>${landmark.description}</p>
            </div>
        `;

        // Bind the custom popup to the marker.
        marker.bindPopup(popupContent);
    });

    // Variable to store the GeoJSON data globally after fetching
    let geojsonData = null;

    // Function to format numbers with commas
    function formatNumber(num) {
        return num.toLocaleString();
    }

    // Fetch the GeoJSON data for world countries
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            geojsonData = data; // Store the data globally

            // Function to style the GeoJSON layer
            const style = (feature) => {
                return {
                    fillColor: 'transparent',
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0
                };
            };

            // Function to handle interactions with each country feature
            const onEachFeature = (feature, layer) => {
                const countryName = feature.properties.name;
                const data = countryData[countryName];
                if (data) {
                    const popupContent = `
                        <div class="popup-content">
                            <h3>${countryName}</h3>
                            <p><strong>Population:</strong> ${formatNumber(data.population)}</p>
                            <p><strong>GDP:</strong> $${formatNumber(data.gdp)}</p>
                            <p><strong>GDP per Capita:</strong> $${formatNumber(data.gdpPerCapita)}</p>
                            <p><strong>Year:</strong> ${data.year}</p>
                        </div>
                    `;
                    layer.bindPopup(popupContent);
                } else {
                    layer.bindPopup(`<h3>${countryName}</h3><p>Data not available.</p>`);
                }
            };

            // Add the GeoJSON layer to the map
            L.geoJSON(geojsonData, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

            // Add a legend to the map
            const legend = L.control({position: 'bottomright'});
            legend.onAdd = function (map) {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = '<h4>Map Legend</h4>' +
                                '<i></i> Countries are clickable to view data.';
                return div;
            };
            legend.addTo(map);

        })
        .catch(error => {
            console.error('Error fetching GeoJSON data:', error);
        });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    // Event listener for search input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';

        if (query.length > 0 && geojsonData) {
            const filteredFeatures = geojsonData.features.filter(feature =>
                feature.properties.name.toLowerCase().includes(query)
            );

            if (filteredFeatures.length > 0) {
                searchResults.style.display = 'block';
                filteredFeatures.forEach(feature => {
                    const countryName = feature.properties.name;
                    const flagUrl = flags[countryName] || 'https://placehold.co/24x16/cccccc/000000?text=?';
                    const li = document.createElement('li');
                    li.className = 'search-item';
                    li.innerHTML = `<img src="${flagUrl}" alt="${countryName} flag"><span>${countryName}</span>`;
                    li.addEventListener('click', () => {
                        // Zoom to the selected country
                        const bounds = L.geoJSON(feature).getBounds();
                        map.fitBounds(bounds);
                        searchResults.style.display = 'none';
                        searchInput.value = '';
                    });
                    searchResults.appendChild(li);
                });
            } else {
                searchResults.style.display = 'none';
            }
        } else {
            searchResults.style.display = 'none';
        }
    });
};
