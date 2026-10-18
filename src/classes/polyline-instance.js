"use strict";

export default class PolylineInstance {
  constructor(mapInstance, roofInstance, manager, latLng) {
    this.mapInstance = mapInstance;
    this.map = this.mapInstance.map;
    this.manager = manager;
    this.instance = null;
    this.coords = latLng;
    this.roofInstance = roofInstance;

    // Polyline weight in pixels
    this.weight = 2;

    this.isSelected = false;

    this.addPolyline();
    this.bindClickEventHandler();
  }

  addPolyline() {
    const currStep = this.manager.steps[this.mapInstance.step];

    this.instance = L.polyline(this.coords, {
      pane: this.manager.steps[this.mapInstance.step].pane,
      weight: this.weight,
      color: currStep.color,
      interactive: currStep.interactive,
    }).addTo(this.map);
  }

  bindClickEventHandler() {
    this.instance.on("click", () => {

      this.manager.allPolylines.forEach((line) => (line.isSelected = false));
      this.isSelected = true;
      this.manager.selectedRoofEdge = this.instance;
      this.instance.bringToFront();
      this.manager.enableProgressBtn();
      this.manager.calcAndSetAzimuthAngle();
      this.manager.setPolylineColorToCurrentState();
      this.roofInstance.moduleManager.createModules();
    });
  }
}
