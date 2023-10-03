var map = L.map("map", {
  scrollWheelZoom: false,
  zoomControl: false,
}).setView([47.1, 35.5], 10);

new L.Control.Zoom({ position: "topright" }).addTo(map);

("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
("https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}");
("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png");

L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
  {
    maxZoom: 17,
    minZoom: 10,
    attribution: "© OpenStreetMap",
  }
).addTo(map);

// https://raw.githubusercontent.com/HubashovD/project_mykolaiv_shelling_web/main/tiles/tileset/{z}/{x}/{y}.png

L.tileLayer(
  //   "https://texty.org.ua/d/2022/mykolaiv_shelling_tiles/tiles_webp/ts/{z}/{x}/{y}.webp",
  "https://raw.githubusercontent.com/texty/rus_tranches_2_web/main/tiles/{z}/{x}/{y}.png",
  {
    maxZoom: 17,
    minZoom: 10,
    attribution: "© Planet.com",
  }
).addTo(map);

var southWest = L.latLng(46.0, 34.0),
  northEast = L.latLng(48.0, 37.0);
var bounds = L.latLngBounds(southWest, northEast);

map.setMaxBounds(bounds);
map.on("drag", function () {
  map.panInsideBounds(bounds, { animate: true });
});

var tranchesStyles = {
  fillColor: "none",
  // "stroke-width": 5,
};

var frontLineStyles = {
  fillColor: "none",
  color: "#f3a6b2",
  "stroke-width": 5,
};

var pointsStyles = {
  fillColor: "none",
};

fetch("data/front_line.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    geoData = L.geoJSON(data, {
      style: frontLineStyles,
    });
    geoData.setStyle({ className: "frontline" });
    geoData.addTo(map);
  });

fetch("data/tranches.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    geoData = L.geoJSON(data, {
      style: tranchesStyles,
    });
    geoData.setStyle({ className: "tranches" });
    geoData.addTo(map);
  });

fetch("data/points.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    geoData = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 5, // Размер маркера
          fillColor: "red",
          color: "darkred",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          className: feature.properties.class + " point",
        });
      },
    });
    geoData.addTo(map);
  });

fetch("data/lines.geojson")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    geoData = L.geoJSON(data, {
      style: function (feature) {
        return {
          color: "darkred", // Цвет линии
          weight: 2, // Толщина линии
          opacity: 1, // Прозрачность линии
          className: feature.properties.class + " line", // Добавляем класс из свойств объекта и дополнительный класс "line"
        };
      },
    });
    geoData.addTo(map);
  });

map.on("click", function (event) {
  var lat = event.latlng.lat;
  var lng = event.latlng.lng;
  console.log("Вы кликнули на координатах: " + lat + ", " + lng);
});
