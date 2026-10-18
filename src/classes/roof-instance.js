"use strict";

import MarkerManager from "./marker-manager.js";
import PolylineManager from "./polyline-manager.js";
import PolygonManager from "./polygon-manager.js";
import ModuleManager from "./module-manager.js";
import RoofCardManager from "./roofcard-manager.js";

export default class RoofInstance {
  constructor(name, map, mapInstance) {
    // Instances
    this.mapInstance = mapInstance;
    this.name = name;
    this.map = map;
    // States
    this.isActive = true;
    this.isHidden = false;
    this.markingFinished = false;
    // Manager for Map Elements
    this.markerManager = null;
    this.polylineManager = null;
    this.polygonManager = null;
    this.moduleManager = null;
    // Manager for control elements
    this.roofCardManager = null;

    // Angles
    this.angles = {
      "azimuth": null,
      "roof-angle": null,
      "distortion-angle": null
    }

    // Coordinates for the center of the roof
    this.roofCenterCoords = null;

    this.createManagerInstances();
    this.setStartingAngles();
  }

  createManagerInstances() {
    this.markerManager = new MarkerManager(this.map, this.mapInstance, this);
    this.polylineManager = new PolylineManager(this.mapInstance, this);
    this.polygonManager = new PolygonManager(this.mapInstance, this);
    this.moduleManager = new ModuleManager(this.mapInstance, this);
    this.roofCardManager = new RoofCardManager(this, this.mapInstance);
  }

  setStartingAngles() {
    const sliderArr = this.mapInstance.angleSliderManager.allAngleSlider;

    sliderArr.forEach((slider) => {
      this.angles[slider.angleType] = slider.startValue;
    })
  }

  disableInstance() {
    if (!this.isActive) return;
    if (!this.markingFinished) this.mapInstance.stopMarkingMode();

    this.isActive = false;
    this.mapInstance.activeRoofInstance = null;

    this.roofCardManager.disableCardInstances();

    this.setColorOfMapElementsToCurrState();

    this.disableSliderControls();
  }

  enableInstance() {
    if (this.isActive) return;
    if (!this.markingFinished) this.mapInstance.startMarkingMode();

    this.mapInstance.roofInstances.forEach((roofInstance) => roofInstance.disableInstance());

    this.isActive = true;
    this.mapInstance.activeRoofInstance = this;

    this.roofCardManager.enableCardInstances();

    this.setColorOfMapElementsToCurrState();

    this.enableSliderControls();
    this.setCurrValuesToAngleSlider();
    this.panMapToRoofCenter();
  }

  hideInstance() {
    this.isHidden = true;

    this.roofCardManager.updateCtrlBtnState();

    this.setColorOfMapElementsToCurrState();
  }

  showInstance() {
    this.isHidden = false;

    this.roofCardManager.updateCtrlBtnState();

    this.setColorOfMapElementsToCurrState();
  }

  deleteInstance() {
    if (!this.markingFinished) this.mapInstance.stopMarkingMode();

    this.polylineManager.deletePolylines();
    this.markerManager.deleteMarkers();
    this.polygonManager.deletePolygon();
    this.moduleManager.deleteModules();
    this.roofCardManager.deleteRoofCardInstance();

    this.removeInstanceFromArr();
    this.mapInstance.updateNameOfRoofInstance();
    this.mapInstance.restart();
  }

  disableSliderControls() {
    this.mapInstance.angleSliderManager.disableSliderControls();
  }

  enableSliderControls() {
    this.mapInstance.angleSliderManager.enableSliderControls();
  }

  setColorOfMapElementsToCurrState() {
    this.polylineManager.setPolylineColorToCurrentState();
    this.markerManager.setMarkerColorToCurrentState();
    this.polygonManager.setPolygonColorToCurrentState();
    this.moduleManager.setModuleColorToCurrentState();
    this.roofCardManager.updateRoofCardInstanceToCurrentState();
  }

  setCurrValuesToAngleSlider() {
    this.mapInstance.angleSliderManager.setRoofInstanceValuesToAngleSlider();
  }

  finishMarking() {
    this.markingFinished = true;
    this.polylineManager.createClosingPolyline();
    this.polygonManager.createPolygon();
    this.mapInstance.stopMarkingMode();
    this.panMapToRoofCenter();
  }

  removeInstanceFromArr() {
    const currRoofIndex = this.mapInstance.roofInstances.indexOf(this);

    if (currRoofIndex > -1) {
      this.mapInstance.roofInstances.splice(currRoofIndex, 1);
    }
  }

  panMapToRoofCenter() {
    if (!this.markingFinished) return;
    const currZoomLvl = this.map.getZoom();
    this.map.flyTo(this.roofCenterCoords, currZoomLvl, { duration: 0.5 });
  }
}
