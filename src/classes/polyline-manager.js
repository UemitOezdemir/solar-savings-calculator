"use strict";

import PolylineInstance from "./polyline-instance.js";
import { bearingDeg, setCheckCoords, pointInPolygon } from "./helper-functions.js";

export default class PolylineManager {
  constructor(mapInstance, roofInstance) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    // Markers Array
    this.allPolylines = [];
    // Roof Edge Selected
    this.selectedRoofEdge = null;

    // Polyline Color when disabled
    this.disabled = {
      color: "#a0a0a0",
      pane: "polylines-to-back",
      interactive: false,
    };

    // Polyline Color when selected as roof edge
    this.selected = {
      color: "green",
    };

    // Polyline colors & options for steps
    this.steps = {
      "roof-setup": {
        color: "red",
        pane: "polylines-to-front",
        interactive: false,
      },
      "roof-edge-selection": {
        color: "orange",
        pane: "polylines-to-front",
        interactive: true,
      },
    };
  }

  createPolyline() {
    const markerArr = this.roofInstance.markerManager.allMarkers;
    const n = markerArr.length;
    if (n < 2) return;

    const last = markerArr[n - 1].instance.getLatLng();
    const prev = markerArr[n - 2].instance.getLatLng();

    const polyline = new PolylineInstance(this.mapInstance, this.roofInstance, this, [prev, last]);

    this.allPolylines.push(polyline);
  }

  createClosingPolyline() {
    const markerArr = this.roofInstance.markerManager.allMarkers;

    const first = markerArr[0].instance.getLatLng();
    const last = markerArr[markerArr.length - 1].instance.getLatLng();

    const polyline = new PolylineInstance(this.mapInstance, this.roofInstance, this, [first, last]);

    this.allPolylines.push(polyline);
  }

  deletePolylines() {
    this.hidePolylines();
    this.allPolylines = [];
    this.selectedRoofEdge = null;
  }

  hidePolylines() {
    this.allPolylines.forEach((line) => line.instance.remove());
  }

  showPolylines() {
    this.allPolylines.forEach((line) => line.instance.addTo(this.map));
  }

  disablePolylines() {
    this.allPolylines.forEach((polyline) => {
      const line = polyline.instance;

      line.options.interactive = this.disabled.interactive;
      line.options.pane = this.disabled.pane;

      line.setStyle({ color: this.disabled.color });

      line.remove();
      line.addTo(this.map);
    });
  }

  enablePolylines() {
    const currStep = this.steps[this.mapInstance.step];

    this.allPolylines.forEach((polyline) => {
      const line = polyline.instance;

      line.options.interactive = currStep.interactive;
      line.options.pane = currStep.pane;

      line.setStyle({ color: currStep.color });

      line.remove();
      line.addTo(this.map);
    });
  }

  updatePolylines() {
    const markerArr = this.roofInstance.markerManager.allMarkers;
    const n = markerArr.length;
    if (n < 2) return;

    this.deletePolylines();

    for (let i = 0; i < n - 1; i++) {
      const curr = markerArr[i].instance.getLatLng();
      const next = markerArr[i + 1].instance.getLatLng();

      const polyline = new PolylineInstance(this.mapInstance, this.roofInstance, this, [
        curr,
        next,
      ]);

      this.allPolylines.push(polyline);
    }
  }

  setPolylineColorToCurrentState() {
    if (this.allPolylines.length === 0) return;

    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hidePolylines();
      return;
    }

    if (this.roofInstance.isHidden) {
      this.hidePolylines();
      return;
    } else {
      this.showPolylines();
    }

    if (!this.roofInstance.isActive) {
      this.disablePolylines();
    } else {
      this.enablePolylines();
    }

    const currStep = this.steps[this.mapInstance.step];

    if (currStep.interactive) {
      this.enableProgressBtn();

      if (this.selectedRoofEdge) {
        this.selectedRoofEdge.setStyle({
          color: this.selected.color,
        });
      }
    }
  }

  enableProgressBtn() {
    let roofEdgesSelected = true;

    this.mapInstance.roofInstances.forEach((roofInstance) => {
      if (!roofInstance.polylineManager.selectedRoofEdge) {
        roofEdgesSelected = false;
        return;
      }
    });

    roofEdgesSelected
      ? this.mapInstance.setProgressBtnState("enable")
      : this.mapInstance.setProgressBtnState("disable");
  }

  getPolylineCoords(polyline) {
    const latlngs = polyline.getLatLngs();
    const from = latlngs[0];
    const to = latlngs[latlngs.length - 1];

    return { from, to };
  }

  identifyTopAndBottom(from, to) {
    let start, end;

    from.lat <= to.lat ? ((end = from), (start = to)) : ((end = to), (start = from));

    return { start, end };
  }

  calculateAzimuthAngle(alignmentAngleToNorth, coordsInPolygon) {
    const azimuth = coordsInPolygon.some((point) => point === true)
      ? alignmentAngleToNorth - 180
      : alignmentAngleToNorth;

    return azimuth;
  }

  calcAndSetAzimuthAngle() {
    const { from, to } = this.getPolylineCoords(this.selectedRoofEdge);
    const { start, end } = this.identifyTopAndBottom(from, to);
    const alignmentAngleToNorth = bearingDeg(start, end);
    const checkCoords = setCheckCoords(start, end, alignmentAngleToNorth);
    const coordsInPolygon = checkCoords.map((point) =>
      pointInPolygon(point, this.roofInstance.polygonManager.polygon.instance),
    );

    this.roofInstance.angles["azimuth"] = this.calculateAzimuthAngle(alignmentAngleToNorth, coordsInPolygon);
  }
}
