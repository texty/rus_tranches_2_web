// instantiate the scrollama
const scroller = scrollama();

// setup the instance, pass callback functions
scroller
  .setup({
    step: ".step",
  })
  .onStepEnter((response) => {
    console.log(response.element.attributes.datacoords.value);
    let coords = response.element.attributes.datacoords.value.split(",");
    let zoom = parseInt(response.element.attributes.datazoom.value);
    console.log(coords);
    console.log(zoom);

    map.once("moveend", function () {
      // используйте .once вместо .on, чтобы обработчик выполнился только один раз
      // Показываем объекты, указанные в objects_to_show
      let objectsToShow = response.element.attributes.objects_to_show
        ? response.element.attributes.objects_to_show.value.split(",")
        : [];
      console.log("add", objectsToShow);
      for (let i = 0; i < objectsToShow.length; i++) {
        let paths = document.getElementsByClassName(objectsToShow[i]);
        console.log(paths);
        for (let j = 0; j < paths.length; j++) {
          paths[j].style.opacity = "0.6";
        }
      }
    });

    // Изменяем способ перелета к точке
    map.flyTo({
      center: [parseFloat(coords[1]), parseFloat(coords[0])],
      zoom: zoom,
      duration: 1.0,
    });
  })
  .onStepExit((response) => {
    // Убираем объекты, указанные в objects_to_remove
    let objectsToRemove = response.element.attributes.objects_to_remove
      ? response.element.attributes.objects_to_remove.value.split(",")
      : [];
    console.log("remove", objectsToRemove);
    for (let i = 0; i < objectsToRemove.length; i++) {
      let paths = document.getElementsByClassName(objectsToRemove[i]);
      for (let j = 0; j < paths.length; j++) {
        paths[j].style.opacity = "0";
      }
    }
  });
