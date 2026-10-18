"use strict";

import MarkerInstance from "./marker-instance.js";

export default class MarkerManager {
  constructor(map, mapInstance, roofInstance) {
    this.map = map;
    this.mapInstance = mapInstance;
    this.roofInstance = roofInstance;
    // Markers Array
    this.allMarkers = [];

    // Marker Color when disabled
    this.disabled = {
      color: "#a0a0a0",
      pane: "marker-to-back",
      interactive: false,
    };

    // Polyline colors & options for steps
    this.steps = {
      "roof-setup": {
        color: "red",
        pane: "marker-to-front",
        interactive: true,
      },
      "roof-edge-selection": {
        color: "orange",
        pane: "marker-to-front",
        interactive: false,
      },
    };
  }

  createMarker(markerCoords) {
    const marker = new MarkerInstance(
      this.map,
      this.mapInstance,
      this.roofInstance,
      this,
      markerCoords,
    );

    this.allMarkers.push(marker);
  }

  deleteMarkers() {
    this.hideMarkers();
    this.allMarkers = [];
  }

  hideMarkers() {
    this.allMarkers.forEach((marker) => marker.instance.remove());
  }

  showMarkers() {
    this.allMarkers.forEach((marker) => marker.instance.addTo(this.map));
  }

  disableMarkers() {
    this.allMarkers.forEach((marker) => {
      marker.instance.options.interactive = this.disabled.interactive;
      marker.instance.options.pane = this.disabled.pane;

      marker.instance.remove();
      marker.instance.addTo(this.map);

      const divTag = marker.instance.getElement();
      const circle = divTag.querySelector("circle");
      circle.setAttribute("fill", this.disabled.color);
    });
  }

  enableMarkers() {
    const currStep = this.steps[this.mapInstance.step];

    this.allMarkers.forEach((marker) => {
      marker.instance.options.interactive = currStep.interactive;
      marker.instance.options.pane = currStep.pane;

      marker.instance.remove();
      marker.instance.addTo(this.map);

      const divTag = marker.instance.getElement();
      const circle = divTag.querySelector("circle");
      circle.setAttribute("fill", currStep.color);
    });
  }

  setMarkerColorToCurrentState() {
    if (this.allMarkers.length === 0) return;

    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideMarkers();
      return;
    }

    if (this.roofInstance.isHidden) {
      this.hideMarkers();
      return;
    }

    if (!this.roofInstance.isActive) {
      this.disableMarkers();
    } else {
      this.enableMarkers();
    }
  }

  enableProgressBtn() {
    let allMarkingsFinished = true;

    this.mapInstance.roofInstances.forEach((roofInstance) => {
      if (!roofInstance.markingFinished) {
        allMarkingsFinished = false;
        return;
      }
    });

    allMarkingsFinished
      ? this.mapInstance.setProgressBtnState("enable")
      : this.mapInstance.setProgressBtnState("disable");
  }

  calcCenterOfRoof() {
    let lat =
      this.allMarkers.reduce((acc, currVal) => acc + currVal.instance.getLatLng().lat, 0) /
      this.allMarkers.length;
    let lng =
      this.allMarkers.reduce((acc, currVal) => acc + currVal.instance.getLatLng().lng, 0) /
      this.allMarkers.length;

    this.roofInstance.roofCenterCoords = [lat, lng];
  }
}
