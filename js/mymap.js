mapboxgl.accessToken =
  "pk.eyJ1IjoiZXZnZXNoYWRyb3pkb3ZhIiwiYSI6ImNqOWRhbnk3MDI4MGIycW9ya2hibG9pNm8ifQ.8VxS8cKEypk08xfgUgbsHw";
// "pIRyhi5Ww2gupphkfRwc";
// "vXHfK9IIJZ2VRIjeYQi6";
// "pk.eyJ1IjoiZXZnZXNoYWRyb3pkb3ZhIiwiYSI6ImNsZGQyY2w5dDBjb2gzcG8xeXQ3c2EzczEifQ.lYkv8Hg7kFKNdNJF7wx4mg";

const MAP_SETTINGS = {
  container: "map",
  style: "./data/osm_liberty.json",
  center: [35.5, 47.1],
  zoom: 9,
  minZoom: 6,
  maxZoom: 16,
  pitch: 0,
  bearing: 0,
  antialias: true,
};

const map = new mapboxgl.Map(MAP_SETTINGS);
const scroller = scrollama();

map.addControl(
  new mapboxgl.ScaleControl({
    maxWidth: 200, // максимальна ширина відображення масштабу в пікселях
    unit: "metric", // 'imperial' для футів та миль
  }),
  "bottom-right"
);

let factor = 1;
let screenWidth = window.innerWidth;
let pulse = true;
let pulseSize = 5;

let pulseDirection = 1;
let minLineWidth = 0;
let maxLineWidth = 10;

let pulseDirectionP = 1;
let minFillOpacity = 0.4;
let maxFillOpacity = 0.8;

let steps = document.querySelectorAll(".step");
let totalSteps = steps.length;

let viewportWidth = window.innerWidth || document.documentElement.clientWidth;

let lineWidthAtZoom12, lineWidthAtZoom14, lineWidthAtZoom16;

window.addEventListener("resize", function () {
  screenWidth = window.innerWidth;
});

if (viewportWidth < 500) {
  lineWidthAtZoom12 = Math.round((1 / 100) * viewportWidth); // 1vw
  lineWidthAtZoom14 = Math.round((2 / 100) * viewportWidth); // 2vw
  lineWidthAtZoom16 = Math.round((3 / 100) * viewportWidth); // 2vw
} else if (viewportWidth < 1024) {
  lineWidthAtZoom12 = Math.round((3 / 100) * viewportWidth); // 2vw
  lineWidthAtZoom14 = Math.round((4 / 100) * viewportWidth); // 4vw
  lineWidthAtZoom16 = Math.round((5 / 100) * viewportWidth); // 2vw
} else {
  lineWidthAtZoom12 = Math.round((5 / 100) * viewportWidth); // 1vw
  lineWidthAtZoom14 = Math.round((6 / 100) * viewportWidth); // 2vw
  lineWidthAtZoom16 = Math.round((7 / 100) * viewportWidth); // 2vw
}

map.addControl(new mapboxgl.NavigationControl(), "top-right");

map.scrollZoom.disable();

map.on("style.load", setupTerrain);
map.on("load", setupLayers);
map.on("load", animateLayers);
map.on("click", logClick);
map.on("style.load", function () {
  window.addEventListener("resize", updateLineWidth);
});

if (totalSteps > 0) {
  let lastStep = steps[totalSteps - 1];
  lastStep.style.height = "50vh !important";
  lastStep.style.minHeight = "200px";
}

function setupTerrain() {
  map.addSource("custom-tiles", {
    type: "raster",
    tiles: [
      "https://thallium.texty.org.ua/maps/rus_tranches_2/tiles/{z}/{x}/{y}.webp",
    ],
    tileSize: 256,
    maxzoom: 18,
  });

  map.addLayer({
    id: "custom-tiles-layer",
    type: "raster",
    source: "custom-tiles",
  });
}

function addSource(id, type, sourceData) {
  let sourceConfig = { type };

  switch (type) {
    case "raster":
      sourceConfig.tiles = [sourceData];
      break;
    case "vector":
      sourceConfig.url = sourceData;
      break;
    default:
      sourceConfig.data = sourceData;
      break;
  }

  map.addSource(id, sourceConfig);
}

function updateLineWidth() {
  let screenWidth = window.innerWidth;
  if (screenWidth <= 480) {
    // Для мобильных устройств
    factor = 1;
  } else if (screenWidth <= 768) {
    // Для планшетов
    factor = 1.75;
  } else if (screenWidth <= 1024) {
    // Для меньших десктопов
    factor = 2;
  } else {
    // Для больших десктопов
    factor = 2.5;
  }

  // Обновляем толщину линии для слоя "front_line-layer"
  map.setLayoutProperty("points-layer", "circle-radius", 5 * factor);
  map.setLayoutProperty("lines-layer", "line-width", 2 * factor);
}

function addLayer(id, type, source, paint = {}, layout = {}) {
  map.addLayer({ id, type, source, paint, layout });
}

// Добавляем обработчик события resize, чтобы изменять толщину линии при изменении размера окна

map.on("load", function () {
  map.loadImage("pic/arrow_1.png", function (error, image) {
    if (error) throw error;
    map.addImage("arrow-icon", image);
    // тут можна додати шар
  });
});

function setupLayers() {
  const sources = [
    { id: "front_line", type: "geojson", data: "data/front_line.geojson" },
    { id: "points", type: "geojson", data: "data/points_merged.geojson" },
    { id: "lines", type: "geojson", data: "data/lines_merged.geojson" },
    { id: "polygons", type: "geojson", data: "data/poly_merged.geojson" },
    { id: "labels", type: "geojson", data: "data/labels.geojson" },
  ];
  sources.forEach(({ id, type, data }) => addSource(id, type, data));

  addLayer("front_line-layer", "fill", "front_line", {
    "fill-opacity": 0.16,
    "fill-color": "#FF0002",
    "fill-outline-color": "#FF0002",
  });

  addLayer("points-layer", "circle", "points", {
    "circle-radius": 5,
    "circle-color": "#eaff00",
    "circle-opacity": 0.8,
    "circle-stroke-color": "#eaff00",
    "circle-stroke-width": 0,
  });

  addLayer("lines-layer", "line", "lines", {
    "line-color": "#eaff00",
    "line-width": 5,
    "line-opacity": 0.8,
    "line-blur": 5,
  });

  addLayer("polygons-layer", "fill", "polygons", {
    "fill-color": "#eaff00",
    "fill-opacity": 0.6,
    "fill-outline-color": "#eaff00",
  });

  addLayer(
    "labels",
    "symbol",
    "labels",
    {
      "text-color": "#eaff00",
    },
    {
      "icon-image": "arrow-icon",
      "icon-allow-overlap": true,
      "icon-anchor": "top",
      "icon-offset": [0, 0],
      "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.05, 22, 0.05],

      "text-field": ["get", "name"],
      "text-font": ["literal", ["Arial Unicode MS Regular"]],
      // "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 10, 12, 22, 12],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "text-justify": "center",
      "text-anchor": "top",
      "text-transform": "uppercase",
      "text-letter-spacing": 0.05,
      "text-offset": [0, 2],
    }
  );

  map.setFilter("lines-layer", ["==", ["get", "id"], ""]);
  map.setFilter("points-layer", ["==", ["get", "id"], ""]);
  map.setFilter("polygons-layer", ["==", ["get", "id"], ""]);
  map.setFilter("labels", ["==", ["get", "id"], ""]);
}

function logClick(event) {
  console.log(
    `Ви клікнули по координатах: ${event.lngLat.lat}, ${event.lngLat.lng}`
  );
}

function animateLayers() {
  animateLine();
  animatePoint();
  animatePolygon();
}

function animatePoint() {
  if (pulse) {
    pulseSize += 0.1;
    if (pulseSize > 10) pulse = false;
  } else {
    pulseSize -= 0.1;
    if (pulseSize < 5) pulse = true;
  }

  map.setPaintProperty("points-layer", "circle-radius", pulseSize);

  requestAnimationFrame(animatePoint);
}

function animateLine() {
  let currentLineWidth = map.getPaintProperty("lines-layer", "line-width");

  if (pulseDirection === 1) {
    currentLineWidth += 0.08;
    if (currentLineWidth > maxLineWidth) {
      currentLineWidth = maxLineWidth;
      pulseDirection = -1;
    }
  } else {
    currentLineWidth -= 0.08;
    if (currentLineWidth < minLineWidth) {
      currentLineWidth = minLineWidth;
      pulseDirection = 1;
    }
  }

  map.setPaintProperty("lines-layer", "line-width", currentLineWidth);

  requestAnimationFrame(animateLine);
}

function animatePolygon() {
  let currentFillOpacity = map.getPaintProperty(
    "polygons-layer",
    "fill-opacity"
  );

  if (pulseDirectionP === 1) {
    currentFillOpacity += 0.01;
    if (currentFillOpacity >= maxFillOpacity) {
      currentFillOpacity = maxFillOpacity;
      pulseDirectionP = -1;
    }
  } else {
    currentFillOpacity -= 0.01;
    if (currentFillOpacity <= minFillOpacity) {
      currentFillOpacity = minFillOpacity;
      pulseDirectionP = 1;
    }
  }

  map.setPaintProperty("polygons-layer", "fill-opacity", currentFillOpacity);

  requestAnimationFrame(animatePolygon);
}

function createFilter(idList) {
  if (!idList || idList.length === 0) {
    return ["==", ["get", "id"], "nonexistent_value"];
  }

  const matchFilter = ["match", ["get", "id"]];

  idList.forEach((id) => {
    matchFilter.push(id);
    matchFilter.push(true);
  });

  matchFilter.push(false);

  return matchFilter;
}

window.onload = function () {
  scroller
    .setup({
      step: ".step",
    })
    .onStepEnter((response) => {
      const isMobile = window.innerWidth < 1024;
      let coordsAttribute = isMobile ? "coords_mobile" : "datacoords";
      let zoomAttribute = isMobile ? "zoom_mobile" : "datazoom";

      let coords = response.element.attributes[coordsAttribute].value
        .split(",")
        .map((item) => item.trim());

      let zoom = parseInt(response.element.attributes[zoomAttribute].value);

      let polygons = response.element.attributes.datapoly
        ? response.element.attributes.datapoly.value
            .split(",")
            .map((item) => item.trim())
        : [];

      let lines = response.element.attributes.datalines
        ? response.element.attributes.datalines.value
            .split(",")
            .map((item) => item.trim())
        : [];

      let points = response.element.attributes.datapoints
        ? response.element.attributes.datapoints.value
            .split(",")
            .map((item) => item.trim())
        : [];

      let labels = response.element.attributes.datalabels
        ? response.element.attributes.datalabels.value
            .split(",")
            .map((item) => item.trim())
        : [];

      map.setLayoutProperty("labels", "visibility", "visible");

      map.setFilter("lines-layer", createFilter(lines));
      map.setFilter("points-layer", createFilter(points));
      map.setFilter("polygons-layer", createFilter(polygons));
      map.setFilter("labels", createFilter(labels));

      // setTimeout(0.5);

      map.flyTo({
        essential: true,
        center: [coords[1], coords[0]],
        zoom: zoom,
        duration: 2000,
        speed: 0.2,
        curve: 1,
      });

      if (response.index === totalSteps - 1 && response.direction === "up") {
        map.setFilter("lines-layer", null);
      }
      if (zoom > 10) {
        map.setLayoutProperty("lines-layer", "line-width", 10 * factor);
        map.setLayoutProperty("lines-layer", "line-opacity", 0.3);
      }
    })

    .onStepExit((response) => {
      if (response.index === totalSteps - 1 && response.direction === "down") {
        map.setFilter("lines-layer", null);
        map.setMaxZoom(16);
        map.setMinZoom(10);
      }
    });
};
