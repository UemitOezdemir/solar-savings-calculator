"use strict";

export default class ModuleInstance {
  constructor(mapInstance, roofInstance, manager, latLng) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    this.manager = manager;
    this.coords = latLng;
    this.instance = null;
    this.isDeselected = false;

    // Polygon design options
    this.borderOpacity = 1;
    this.borderWeight = 1;
    this.borderColor = "white";
    this.fillOpacity = 0.65;

    this.addModuleToMap();
    this.bindClickEventHandler();
  }

  addModuleToMap() {
    this.instance = L.polygon(this.coords, {
      color: this.borderColor,
      opacity: this.borderOpacity,
      weight: this.borderWeight,
      fillOpacity: this.fillOpacity,
    })

    if (Object.hasOwn(this.manager.steps, this.mapInstance.step)) {
      const currStep = this.manager.steps[this.mapInstance.step];
      
      this.instance.options.pane = currStep.pane,
      this.instance.setStyle({ fillColor: currStep.colorActive });
      this.instance.addTo(this.map);
    }
  }

  bindClickEventHandler() {
    this.instance.on("click", () => {
      this.isDeselected ? this.selectModule() : this.deselectModule();
    });
  }

  deselectModule() {
    this.isDeselected = true;

    const index = this.manager.allModules.indexOf(this);
    if (index !== -1) this.manager.allModules.splice(index, 1);

    this.manager.deselectedModules.push(this);

    this.roofInstance.roofCardManager.updateRoofCardValues()

    const currStep = this.manager.steps[this.mapInstance.step];

    this.instance.setStyle({ fillColor: currStep.colorInactive });
  }

  selectModule() {
    this.isDeselected = false;

    const index = this.manager.deselectedModules.indexOf(this);
    if (index !== -1) this.manager.deselectedModules.splice(index, 1);

    this.manager.allModules.push(this);

    this.roofInstance.roofCardManager.updateRoofCardValues()

    const currStep = this.manager.steps[this.mapInstance.step];

    this.instance.setStyle({ fillColor: currStep.colorActive });
  }

  setColorToDeselectedMode() {
    this.instance.setStyle({ fillColor: "transparent" });
  }
}
