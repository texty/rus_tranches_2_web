mapboxgl.accessToken =
  "pk.eyJ1IjoiZXZnZXNoYWRyb3pkb3ZhIiwiYSI6ImNsZGQyY2w5dDBjb2gzcG8xeXQ3c2EzczEifQ.lYkv8Hg7kFKNdNJF7wx4mg";

const MAP_SETTINGS = {
  container: "map",
  style: "./data/osm_liberty.json",
  center: [35.5, 47.1],
  zoom: 9,
  minZoom: 8,
  maxZoom: 16,
  pitch: 0,
  bearing: 0,
  antialias: true,
};

const map = new mapboxgl.Map(MAP_SETTINGS);

let factor = 1;

// Глобальная переменная для хранения текущей ширины экрана
let screenWidth = window.innerWidth;

// Обновление ширины экрана при изменении размера окна
window.addEventListener("resize", function () {
  screenWidth = window.innerWidth;
});

let pulse = true;
let pulseSize = 5;

let pulseDirection = 1; // 1 для увеличения, -1 для уменьшения
let minLineWidth = 2;
let maxLineWidth = 5;

let pulseDirectionP = 1;
let minFillOpacity = 0.4;
let maxFillOpacity = 0.8;

// instantiate the scrollama
const scroller = scrollama();

let steps = document.querySelectorAll(".step");
let totalSteps = steps.length;

map.addControl(new mapboxgl.NavigationControl(), "top-right");

map.scrollZoom.disable();
map.dragPan.disable();

map.on("load", setupLayers, animateLayers);
map.on("click", logClick);
map.on("style.load", setupTerrain, function () {
  window.addEventListener("resize", updateLineWidth);
});

if (totalSteps > 0) {
  let lastStep = steps[totalSteps - 1];

  // Устанавливаем высоту последнего шага в 50vh
  lastStep.style.height = "50vh !important";
  lastStep.style.minHeight = "200px";
}

function setupTerrain() {
  map.addSource("custom-tiles", {
    type: "raster", // Используем тип "raster" для растровых тайлов
    tiles: [
      "https://thallium.texty.org.ua/maps/rus_tranches_2/tiles/{z}/{x}/{y}.png",
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

function addLayer(id, type, source, paint = {}) {
  map.addLayer({ id, type, source, paint });
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

// Добавляем обработчик события resize, чтобы изменять толщину линии при изменении размера окна

function setupLayers() {
  const sources = [
    { id: "front_line", type: "geojson", data: "data/front_line.geojson" },
    { id: "points", type: "geojson", data: "data/points.geojson" },
    { id: "lines", type: "geojson", data: "data/lines.geojson" },
    { id: "polygons", type: "geojson", data: "data/poly.geojson" },
  ];
  sources.forEach(({ id, type, data }) => addSource(id, type, data));

  addLayer("front_line-layer", "fill", "front_line", {
    "fill-opacity": 0.3, // Устанавливаем прозрачность в 10%
    "fill-color": "black", // Устанавливаем красный цвет для заливки полигона
    "fill-outline-color": "black", // Устанавливаем красный цвет для контура полигона
  });

  addLayer("points-layer", "circle", "points", {
    "circle-radius": 5,
    "circle-color": "#ffeb3b",
    "circle-opacity": 0.8,
    "circle-stroke-color": "#ffeb3b",
    "circle-stroke-width": 0,
  });

  addLayer("lines-layer", "line", "lines", {
    "line-color": "#ffeb3b",
    "line-width": 2,
    "line-opacity": 0.8,
  });

  addLayer("polygons-layer", "fill", "polygons", {
    "fill-color": "#ffeb3b",
    "fill-opacity": 0.6,
    "fill-outline-color": "#ffeb3b",
  });

  map.setFilter("lines-layer", ["==", ["get", "id"], ""]);
  map.setFilter("points-layer", ["==", ["get", "id"], ""]);
  map.setFilter("polygons-layer", ["==", ["get", "id"], ""]);
}

function logClick(event) {
  console.log(
    `Вы кликнули на координатах: ${event.lngLat.lat}, ${event.lngLat.lng}`
  );
}

// Анимационные функции (animatePoint и animateLine) остаются без изменений.

function animateLayers() {
  animateLine();
  animatePoint();
  animatePolygon();
}

// Оставляем Scrollama код без изменений, так как он уже достаточно чист и аккуратен.

function animatePoint() {
  // Обновите размер и прозрачность точки в зависимости от текущего значения pulse
  if (pulse) {
    pulseSize += 0.1;
    if (pulseSize > 10) pulse = false; // Максимальный размер пульсации
  } else {
    pulseSize -= 0.1;
    if (pulseSize < 5) pulse = true; // Минимальный размер пульсации
  }

  // Примените обновленный размер к слою
  map.setPaintProperty("points-layer", "circle-radius", pulseSize);

  // Запланировать следующую итерацию
  requestAnimationFrame(animatePoint);
}

function animateLine() {
  // Текущая ширина линии
  let currentLineWidth = map.getPaintProperty("lines-layer", "line-width");

  // Изменение ширины линии
  if (pulseDirection === 1) {
    currentLineWidth += 0.1;
    if (currentLineWidth > maxLineWidth) {
      currentLineWidth = maxLineWidth; // Устанавливаем в максимальное значение
      pulseDirection = -1;
    }
  } else {
    currentLineWidth -= 0.1;
    if (currentLineWidth < minLineWidth) {
      currentLineWidth = minLineWidth; // Устанавливаем в минимальное значение
      pulseDirection = 1;
    }
  }

  // Примените обновленную ширину к слою
  map.setPaintProperty("lines-layer", "line-width", currentLineWidth);

  // Запланировать следующую итерацию
  requestAnimationFrame(animateLine);
}

function animatePolygon() {
  // Текущая прозрачность заливки
  let currentFillOpacity = map.getPaintProperty(
    "polygons-layer",
    "fill-opacity"
  );

  // Изменение прозрачности заливки
  if (pulseDirectionP === 1) {
    currentFillOpacity += 0.01;
    if (currentFillOpacity >= maxFillOpacity) {
      currentFillOpacity = maxFillOpacity; // Здесь установите в максимальное значение
      pulseDirectionP = -1;
    }
  } else {
    currentFillOpacity -= 0.01;
    if (currentFillOpacity <= minFillOpacity) {
      currentFillOpacity = minFillOpacity; // Здесь установите в минимальное значение
      pulseDirectionP = 1;
    }
  }

  // Примените обновленную прозрачность к слою
  map.setPaintProperty("polygons-layer", "fill-opacity", currentFillOpacity);

  // Запланировать следующую итерацию
  requestAnimationFrame(animatePolygon);
}

function createFilter(idList) {
  if (!idList || idList.length === 0) {
    // Вернуть фильтр, который не отображает ни одного объекта
    return ["==", ["get", "id"], "nonexistent_value"];
  }

  const matchFilter = ["match", ["get", "id"]];

  idList.forEach((id) => {
    matchFilter.push(id);
    matchFilter.push(true);
  });

  matchFilter.push(false); // Это наш fallback output

  return matchFilter;
}

console.log(totalSteps);
window.onload = function () {
  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
    })
    .onStepEnter((response) => {
      // document.getElementById("menu").style.display = "none";
      document.getElementById("textBlocks").style.display = "block";

      let coords = response.element.attributes.datacoords.value.split(",");

      let zoom = parseInt(response.element.attributes.datazoom.value);

      let polygons = response.element.attributes.datapoly
        ? response.element.attributes.datapoly.value.split(",")
        : [];

      let lines = response.element.attributes.datalines
        ? response.element.attributes.datalines.value.split(",")
        : [];

      let points = response.element.attributes.datapoints
        ? response.element.attributes.datapoints.value.split(",")
        : [];

      console.log("enter", response.index, map.scrollZoom.isEnabled());
      console.log(response.element.attributes.datacoords.value);

      console.log("poly", polygons);
      console.log("lines", lines);
      console.log("points", points);
      console.log("zoom", zoom);

      // map.setFilter("lines-layer", createMatchFilter(lines));
      // map.setFilter("points-layer", createMatchFilter(points));

      map.setFilter("lines-layer", createFilter(lines));
      map.setFilter("points-layer", createFilter(points));
      map.setFilter("polygons-layer", createFilter(polygons));
      // Изменяем способ перелета к точке
      // map.flyTo({
      //   center: [parseFloat(coords[1]), parseFloat(coords[0])],
      //   zoom: zoom,
      //   duration: 2.0,
      // });

      // Рассчитать смещение
      const offsetRatio = 0.66; // 66%
      const offsetX = screenWidth * offsetRatio;

      // Центральна точка карти
      const centerPoint = map.project([
        parseFloat(coords[1]),
        parseFloat(coords[0]),
      ]);

      // Точка з зміщенням на 66% від лівого краю
      const offsetPoint = [
        centerPoint.x - (screenWidth - offsetX),
        centerPoint.y,
      ];
      let offsetCoordinates = map.unproject(offsetPoint);

      let offsetCoordinatesRounded = {
        lat: parseFloat(offsetCoordinates.lat).toFixed(10),
        lng: parseFloat(offsetCoordinates.lng).toFixed(10),
      };
      console.log("offsetX", offsetX);
      console.log("screenWidth", screenWidth);
      console.log("coords", coords);
      console.log("transpose-coords", offsetCoordinates);
      console.log("transpose-coords", offsetCoordinatesRounded);

      map.flyTo({
        center: [offsetCoordinatesRounded.lng, offsetCoordinatesRounded.lat],
        zoom: zoom,
        duration: 2.0,
      });

      if (response.index === totalSteps - 1 && response.direction === "up") {
        map.scrollZoom.disable();
        map.dragPan.disable();
      }
      if (zoom > 10) {
        map.setLayoutProperty("lines-layer", "line-width", 10 * factor);
        map.setLayoutProperty("lines-layer", "line-opacity", 0.3);
      }
      // map.setLayoutProperty("points-layer", "circle-radius", 5 * factor);
    })
    .onStepExit((response) => {
      let polygons = response.element.attributes.datapoly
        ? response.element.attributes.datapoly.value.split(",")
        : [];

      let lines = response.element.attributes.datalines
        ? response.element.attributes.datalines.value.split(",")
        : [];

      let points = response.element.attributes.datapoints
        ? response.element.attributes.datapoints.value.split(",")
        : [];

      console.log(response.element.attributes.datacoords.value);
      console.log("poly", polygons);
      console.log("lines", lines);
      console.log("points", points);

      var lng1 = 35.171262526303224;
      var lat2 = 47.58161211716504;
      var lng2 = 36.3887629158782;
      var lat1 = 47.01655306475578;

      map.setFilter("lines-layer", createFilter(lines));
      map.setFilter("points-layer", createFilter(points));
      map.setFilter("polygons-layer", createFilter(polygons));
      console.log("exit", response.index, map.scrollZoom.isEnabled());
      if (response.index === totalSteps - 1 && response.direction === "down") {
        document.getElementById("textBlocks").style.display = "none";
        document.getElementById("menu").style.display = "block";
        map.scrollZoom.enable();
        map.dragPan.enable();
        map.setMaxZoom(16);
        map.setMinZoom(11);
        map.setMaxBounds([
          [lng1, lat1],
          [lng2, lat2],
        ]);
      }
    });
};

// document
//   .getElementById("points-toggle")
//   .addEventListener("change", function (e) {
//     if (e.target.checked) {
//       map.setLayoutProperty("points-layer", "visibility", "visible");
//       map.setFilter("points-layer", null); // сброс фильтра
//     } else {
//       map.setLayoutProperty("points-layer", "visibility", "none");
//     }
//   });

// document
//   .getElementById("lines-toggle")
//   .addEventListener("change", function (e) {
//     if (e.target.checked) {
//       map.setLayoutProperty("lines-layer", "visibility", "visible");
//       map.setFilter("lines-layer", null); // сброс фильтра
//     } else {
//       map.setLayoutProperty("lines-layer", "visibility", "none");
//     }
//   });

// document
//   .getElementById("polygons-toggle")
//   .addEventListener("change", function (e) {
//     if (e.target.checked) {
//       map.setLayoutProperty("polygons-layer", "visibility", "visible");
//       map.setFilter("polygons-layer", null); // сброс фильтра
//     } else {
//       map.setLayoutProperty("polygons-layer", "visibility", "none");
//     }
//   });

document
  .getElementById("scrollUpButton")
  .addEventListener("click", function () {
    window.scrollBy(0, -window.innerHeight); // прокрутка на высоту экрана вверх
  });

document
  .getElementById("scrollDownButton")
  .addEventListener("click", function () {
    window.scrollBy(0, window.innerHeight); // прокрутка на высоту экрана вниз
  });
