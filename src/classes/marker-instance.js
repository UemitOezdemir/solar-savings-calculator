"use strict";

export default class MarkerInstance {
  constructor(map, mapInstance, roofInstance, manager, coords) {
    this.map = map;
    this.mapInstance = mapInstance;
    this.roofInstance = roofInstance;
    this.manager = manager;
    this.coords = coords;
    this.instance = null;

    // Radius of Marker
    this.radius = 6;

    // Marker Icon
    this.markerIcon = L.divIcon({
      html: `<svg viewBox="0 0 ${this.radius * 2} ${this.radius * 2}">
                <circle cx="${this.radius}" cy="${this.radius}" r="${this.radius}" fill=${this.manager.steps[this.mapInstance.step].color} />
            </svg>`,
      className: "",
      iconSize: [this.radius * 2, this.radius * 2],
      iconAnchor: [this.radius, this.radius],
    });

    this.addMarker();
    this.bindDragStartHandler();
    this.bindDragHandler();
    this.bindDragEndHandler();
    this.finishMarking();
  }

  addMarker() {
    if (this.roofInstance.markingFinished) return;
    this.instance = L.marker(this.coords, {
      icon: this.markerIcon,
      pane: this.manager.steps[this.mapInstance.step].pane,
      zIndexOffset: 1,
      draggable: true,
    }).addTo(this.map);
  }

  bindDragStartHandler() {
    this.instance.on("dragstart", () => {
      this.mapInstance.mapPreview.bindPointerMoveEvent();
      this.mapInstance.mapPreview.showMapPreview();
      this.panMapPreviewToRoofCenter();
    });
  }

  bindDragHandler() {
    this.instance.on("drag", () => {
      this.updatePolylinesOnDrag();
      this.roofInstance.polygonManager.updatePolygon();
      this.panMapPreviewToRoofCenter();
    });
  }

  bindDragEndHandler() {
    this.instance.on("dragend", () => {
      if (!this.roofInstance.isActive) return;

      this.mapInstance.mapPreview.hideMapPreview();
      this.mapInstance.mapPreview.removePointerMoveEvent();
    });
  }

  panMapPreviewToRoofCenter() {
    const lat = this.instance.getLatLng().lat;
    const lng = this.instance.getLatLng().lng;
    this.mapInstance.mapPreview.panMapPreviewToCenter([lat, lng]);
  }

  updatePolylinesOnDrag() {
    this.roofInstance.polylineManager.updatePolylines();

    if (this.roofInstance.markingFinished) {
      this.roofInstance.polylineManager.createClosingPolyline();
    }
  }

  finishMarking() {
    this.instance.on("click", () => {
      if (this.roofInstance.markingFinished) return;
      if (!this.roofInstance.isActive) return;
      if (this.manager.allMarkers[0].instance !== this.instance) return;
      if (this.manager.allMarkers.length < 3) return;

      this.manager.calcCenterOfRoof();
      this.roofInstance.finishMarking();
      this.manager.enableProgressBtn();
    });
  }
}
