"use strict";

import RoofTypeSelectionManager from "./roof-type-selection-manager.js";
import ProgressButtonManager from "./progress-button-manager.js";
import AddNewRoofBtnManager from "./add-new-roof-button-manager.js";
import RoofInstance from "./roof-instance.js";
import AngleSliderManager from "./angle-slider-manager.js";
import BatterySizeSelectionManager from "./battery-size-selection-manager.js";

export default class MapInstance {
  constructor(
    startCoords,
    mapContainer,
    mapPreview,
    headline,
    progressCounter,
    controlElementsContainer,
    mainContentContainer,
    progressBtncontainer,
  ) {
    // Starting Lat / Lng
    this.startCoords = startCoords;
    // Map Instance
    this.map = null;
    // Map container
    this.mapContainer = mapContainer;
    // Map preview for mobile
    this.mapPreview = mapPreview;
    this.mapPreviewInstance = mapPreview.instance;

    // All container
    this.headline = headline;
    this.progressCounter = progressCounter;
    this.controlElementsContainer = controlElementsContainer;
    this.mainContentContainer = mainContentContainer;
    this.progressBtnContainer = progressBtncontainer;

    // Roof instance
    this.roofInstances = [];
    this.activeRoofInstance = null;

    // Manager for control elements
    this.angleSliderManager = null;
    this.addNewRoofBtnManager = null;

    // Manager for selection elements
    this.roofTypeSelectionManager = null;
    this.batterySizeSelectionManager = null;

    // Manager for progress buttons (previous / next)
    this.progressBtnManager = null;

    // Selections
    this.selectedRoofType = null;
    this.selectedBatterySize = null;

    // State of Step
    this.step = null;

    this.boundCreateMarker = this.createMarker.bind(this);

    this.createMap();
    this.loadTiles();
    this.setLayerIndex();
    this.createProgressBtnManager();
    this.createRoofTypeSelectionManager();
    this.createAddNewRoofButtonManager();
    this.createAngleSliderManager();
    this.createBatterySizeSelectionManager();
  }

  createMap() {
    this.map = L.map(this.mapContainer, {
      center: this.startCoords,
      zoom: 18,
      maxZoom: 24,
      // gestureHandling: true
    });
  }

  loadTiles() {
    // L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}@2x?access_token=${this.mapboxToken}`, {
    //   attribution: '&copy; <a href="https://mapbox.com">Mapbox</a>',

    //   // Mapbox hat eigene Kacheln mit 512x512 Pixeln (statt standardmäßig 256)
    //   tileSize: 512,
    //   zoomOffset: -1,

    //   // Mapbox liefert extrem scharfe Satellitenbilder nativ bis Stufe 22
    //   maxNativeZoom: 22,

    //   // Erlaubt dem User das digitale Heranzoomen bis Stufe 24 für zentimetergenaue PV-Planung
    //   maxZoom: 24,
    // }).addTo(this.map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar",
        maxNativeZoom: 20, // Der Esri-Server liefert Kacheln bis maximal Zoom 21
        maxZoom: 23,
      },
    ).addTo(this.map);

    // L.tileLayer(
    //   "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //   {
    //     attribution: "Tiles © Esri",
    //   },
    // ).addTo(this.map);
  }

  setLayerIndex() {
    // Z-Index for map elements when roof is enabled
    this.map.createPane("marker-to-front");
    this.map.getPane("marker-to-front").style.zIndex = 660;

    this.map.createPane("polylines-to-front");
    this.map.getPane("polylines-to-front").style.zIndex = 650;

    this.map.createPane("modules-to-front");
    this.map.getPane("modules-to-front").style.zIndex = 640;

    this.map.createPane("polygon-to-front");
    this.map.getPane("polygon-to-front").style.zIndex = 630;

    // Z-Index for map elements when roof is disabled
    this.map.createPane("marker-to-back");
    this.map.getPane("marker-to-back").style.zIndex = 560;

    this.map.createPane("polylines-to-back");
    this.map.getPane("polylines-to-back").style.zIndex = 550;

    this.map.createPane("modules-to-back");
    this.map.getPane("modules-to-back").style.zIndex = 620;

    this.map.createPane("polygon-to-back");
    this.map.getPane("polygon-to-back").style.zIndex = 540;
  }

  createProgressBtnManager() {
    this.progressBtnManager = new ProgressButtonManager(this);
  }

  createRoofTypeSelectionManager() {
    this.roofTypeSelectionManager = new RoofTypeSelectionManager(this);
  }

  createAddNewRoofButtonManager() {
    this.addNewRoofBtnManager = new AddNewRoofBtnManager(this);
  }

  createAngleSliderManager() {
    this.angleSliderManager = new AngleSliderManager(this);
  }

  createBatterySizeSelectionManager() {
    this.batterySizeSelectionManager = new BatterySizeSelectionManager(this);
  }

  disablePrevRoofInstances() {
    const count = this.roofInstances.length;

    if (count > 0) {
      this.roofInstances.forEach((el) => {
        el.disableInstance();
      });
    }
  }

  createRoofInstance() {
    this.disablePrevRoofInstances();

    const roofInstance = new RoofInstance(`Roof ${this.roofInstances.length + 1}`, this.map, this);

    this.roofInstances.push(roofInstance);

    this.activeRoofInstance = roofInstance;
  }

  updateNameOfRoofInstance() {
    if (this.roofInstances.length === 0) return;

    this.roofInstances.forEach((instance, index) => {
      instance.name = `Roof ${index + 1}`;
      instance.roofCardManager.updateNameOnRoofCard();
    });
  }

  updateStateToCurrentStep() {
    if (this.roofInstances.length > 0) {
      this.roofInstances.forEach((roofInstance) => roofInstance.setColorOfMapElementsToCurrState());
    }

    this.progressBtnManager.updateProgressBtnsToCurrentState();
    this.roofTypeSelectionManager.updateRoofTypeSelectionToCurrentState();
    this.addNewRoofBtnManager.updateAddNewRoofBtnToCurrentState();
    this.angleSliderManager.updateSliderControlsToCurrentState();
    this.batterySizeSelectionManager.updateBatterySizeSelectionToCurrentState();
  }

  startMarkingMode() {
    this.map.on("click", this.boundCreateMarker);
    this.mapContainer.style.cursor = "crosshair";
    this.addNewRoofBtnManager.disableAddNewRoofBtn();
  }

  stopMarkingMode() {
    this.map.off("click", this.boundCreateMarker);
    this.mapContainer.style.cursor = "";
    this.addNewRoofBtnManager.enableAddNewRoofBtn();
  }

  setProgressBtnState(state) {
    if (state === "enable") {
      this.progressBtnManager.enableNextBtn();
    } else if (state === "disable") {
      this.progressBtnManager.disableNextBtn();
    }
  }

  restart() {
    if (this.roofInstances.length === 0) {
      this.progressBtnManager.restart();
      this.updateStateToCurrentStep();
    }
  }

  createMarker(e) {
    if (!this.activeRoofInstance) return;
    if (this.activeRoofInstance.markingFinished) return;

    const { lat, lng } = e.latlng;

    this.activeRoofInstance.markerManager.createMarker([lat, lng]);
    this.activeRoofInstance.polylineManager.createPolyline();

    if (!this.activeRoofInstance.roofCardManager.roofCard) {
      this.activeRoofInstance.roofCardManager.createRoofCard();
    }
  }
}
