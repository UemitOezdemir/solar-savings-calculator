"use strict";

export default class MapPreviewInstance {
  constructor(previewContainer, startCoords, mapContainer) {
    this.previewContainer = previewContainer;
    this.startCoords = startCoords;
    this.mapContainer = mapContainer;
    this.mapPreview = null;
    this.boundGetMousePosition = this.movePreviewContainer.bind(this);

    this.createMapPreview();
    this.loadTiles();
  }

  createMapPreview() {
    this.mapPreview = L.map(this.previewContainer, {
      center: this.startCoords,
      zoom: 18,
      maxZoom: 25,
      zoomControl: false,
    });
  }

  loadTiles() {
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
      },
    ).addTo(this.mapPreview);
  }

  panMapPreviewToCenter(coords) {
    this.mapPreview.setView(coords);
  }

  showMapPreview() {
    this.previewContainer.dataset.disabled = false;
  }

  hideMapPreview() {
    this.previewContainer.dataset.disabled = true;
  }

  bindPointerMoveEvent() {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      document.addEventListener("pointermove", this.boundGetMousePosition);
    }
  }

  removePointerMoveEvent() {
    document.removeEventListener("pointermove", this.boundGetMousePosition);
    this.previewContainer.removeAttribute("style");
  }

  movePreviewContainer(e) {
    const [mouseX, mouseY] = this.getMousePosition(e);
    const { left, right, top } = this.mapContainer.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = this.previewContainer;

    if (mouseX > left + w / 2 && mouseX < right - w / 2) {
      this.previewContainer.style.left = `${mouseX - left}px`;
    }

    if (mouseY > top + h * 1.5) {
      this.previewContainer.style.top = `${mouseY - top - h / 2}px`;
    }
  }

  getMousePosition(event) {
    return [event.clientX, event.clientY];
  }
}
