"use strict";

import PolygonInstance from "./polygon-instance.js";

export default class PolygonManager {
  constructor(mapInstance, roofInstance) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    this.polygon = null;

    // Polygon Color when disabled
    this.disabled = {
      color: "#a0a0a0",
      pane: "polygon-to-back",
      interactive: true,
    };

    // Polygon colors & options for steps
    this.steps = {
      "roof-setup": {
        color: "red",
        pane: "polygon-to-front",
        interactive: false,
      },
      "roof-edge-selection": {
        color: "orange",
        pane: "polygon-to-front",
        interactive: false,
      },
      "module-setup": {
        color: "transparent",
        pane: "polygon-to-front",
        interactive: false,
      },
    };
  }

  createPolygon() {
    const markerArr = this.roofInstance.markerManager.allMarkers;
    const markerCoords = markerArr.map((marker) => marker.instance.getLatLng());

    this.polygon = new PolygonInstance(this.mapInstance, this.roofInstance, markerCoords, this);
  }

  deletePolygon() {
    if(!this.polygon) return;
    this.hidePolygon();
    this.polygon = null;
  }

  updatePolygon() {
    if (!this.polygon) return;

    this.deletePolygon();
    this.createPolygon();
  }

  hidePolygon() {
    this.polygon.instance.remove();
  }

  showPolygon() {
    this.polygon.instance.addTo(this.map);
  }

  disablePolygon() {
    this.polygon.instance.options.interactive = this.disabled.interactive;
    this.polygon.instance.options.pane = this.disabled.pane;

    this.polygon.instance.setStyle({ fillColor: this.disabled.color });
    this.hidePolygon();
    this.showPolygon();
  }

  enablePolygon() {
    const currStep = this.steps[this.mapInstance.step];

    this.polygon.instance.options.interactive = currStep.interactive;
    this.polygon.instance.options.pane = currStep.pane;

    this.polygon.instance.setStyle({ fillColor: currStep.color });
    this.hidePolygon();
    this.showPolygon();
  }

  setPolygonColorToCurrentState() {
    if (!this.polygon) return;

    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hidePolygon();
      return;
    }

    if (this.roofInstance.isHidden) {
      this.hidePolygon();
      return;
    }

    if (!this.roofInstance.isActive) {
      this.disablePolygon();
    } else {
      this.enablePolygon();
    }
  }
}
