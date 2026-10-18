"use strict";

export default class PolygonInstance {
  constructor(mapInstance, roofInstance, coords, manager) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    this.manager = manager;
    this.coords = coords;
    this.instance = null;

    // Polygon design options
    this.borderOpacity = 0;
    this.fillOpacity = .25;

    this.addPolygon();
    this.bindClickEventHandler();
  }

  addPolygon() {
    this.instance = L.polygon(this.coords, {
      opacity: this.borderOpacity,
      pane: this.manager.steps[this.mapInstance.step].pane,
      fillColor: this.manager.steps[this.mapInstance.step].color,
      fillOpacity: this.fillOpacity,
      interactive: this.manager.steps[this.mapInstance.step].interactive,
    }).addTo(this.map);
  }

  bindClickEventHandler() {
    this.instance.on("click", () => {
      this.roofInstance.enableInstance();
    });
  }
}