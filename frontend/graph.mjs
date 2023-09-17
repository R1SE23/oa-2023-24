import * as d3 from "https://cdn.skypack.dev/d3@6";

const mapDiv = document.getElementById("map");

let map;

// Create a marker cluster group
const markers = L.markerClusterGroup();

fetch("http://localhost:3000/data")
  .then((response) => response.json())
  .then((data) => {
    const validData = data.filter((row) => row.latitude && row.longitude);
    const avgLat = d3.mean(validData, (d) => +d.latitude);
    const avgLon = d3.mean(validData, (d) => +d.longitude);

    // Initialize the map once the averages are computed
    map = L.map("map").setView([avgLat, avgLon], 12);

    // Add a tile layer to the map (base map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    document
      .getElementById("roomTypeFilter")
      .addEventListener("change", function () {
        const selectedRoomType = this.value;
        markers.clearLayers();
        // Filter and plot data based on selected room type
        const filteredData = validData.filter(
          (row) =>
            selectedRoomType === "all" || row.room_type === selectedRoomType
        );
        plotData(filteredData);
      });

    // Normalization function to determine the marker radius
    function normalizedRadius(value) {
      const minListings = 1; // Minimum value of calculated_host_listings_count
      const maxListings = 398; // Maximum value of calculated_host_listings_count
      const minRadius = 6;
      const maxRadius = 20;
      const normalized = (value - minListings) / (maxListings - minListings);
      return minRadius + (maxRadius - minRadius) * normalized;
    }

    function plotData(data) {
      data.forEach((row) => {
        const lat = +row.latitude;
        const lon = +row.longitude;
        const markerSize = normalizedRadius(row.calculated_host_listings_count);

        const marker = L.circleMarker([lat, lon], {
          // color: getColor(row.price),
          fillColor: "#f03",
          fillOpacity: 0.5,
          radius: markerSize,
        });
        // Create hover tooltip for the marker
        let tooltipContent = "";
        for (const [key, value] of Object.entries(row)) {
          tooltipContent += `<strong>${key}:</strong> ${value}<br>`;
        }
        marker
          .bindTooltip(tooltipContent, {
            direction: "top",
            permanent: false,
            sticky: true,
            interactive: true,
            opacity: 0.8,
          })
          .openTooltip();

        marker.on("mouseout", function () {
          map.closeTooltip();
        });

        marker.bindPopup(
          Object.entries(row)
            .map(([key, value]) => `<b>${key}</b>: ${value}`)
            .join("<br>")
        );

        markers.addLayer(marker);
      });

      map.addLayer(markers);
      const heatmapData = validData.map((row) => [
        row.latitude,
        row.longitude,
        10,
      ]);

      // Create the heatmap layer
      const heatmapLayer = L.heatLayer(heatmapData, {
        radius: 4,
        blur: 4,
        maxZoom: 17,
      });

      // Toggle heatmap visibility
      document
        .getElementById("heatmapToggle")
        .addEventListener("click", function () {
          if (map.hasLayer(heatmapLayer)) {
            map.removeLayer(heatmapLayer);
          } else {
            heatmapLayer.addTo(map);
          }
        });

      heatmapLayer.addTo(map);
    }

    plotData(validData);
  })
  .catch((error) => {
    console.error("Error fetching and parsing CSV data:", error);
  });
