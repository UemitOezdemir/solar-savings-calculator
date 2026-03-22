"use strict";

function bearingDeg(from, to) {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return ((θ + 360) % 360) - 90;
}

function setCheckCoords(start, end, angle) {
  const dist = 0.25;

  const firstCheck = L.latLng((end.lat + start.lat) / 2, (end.lng + start.lng) / 2);

  const secondCheck = L.latLng((end.lat + firstCheck.lat) / 2, (end.lng + firstCheck.lng) / 2);

  const thirdCheck = L.latLng((firstCheck.lat + start.lat) / 2, (firstCheck.lng + start.lng) / 2);

  const firstCheckCoord = computeOffset(firstCheck, dist, angle);
  const secondCheckCoord = computeOffset(secondCheck, dist, angle);
  const thirdCheckCoord = computeOffset(thirdCheck, dist, angle);

  return [firstCheckCoord, secondCheckCoord, thirdCheckCoord];
}

function toLatLng(p) {
  return p instanceof L.LatLng ? p : L.latLng(p.lat, p.lng);
}

function computeHeading(from, to) {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = (Math.atan2(y, x) * 180) / Math.PI;

  if (θ > 180) θ -= 360;
  if (θ <= -180) θ += 360;
  return θ;
}

function computeOffset(latlng, distanceMeters, bearingDeg) {
  const R = 6378137;
  const δ = distanceMeters / R;
  const θ = (bearingDeg * Math.PI) / 180;

  const φ1 = (latlng.lat * Math.PI) / 180;
  const λ1 = (latlng.lng * Math.PI) / 180;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));

  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return L.latLng((φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI);
}

function pointInPolygon(point, polygon) {
  const vs = polygon.getLatLngs().flat();
  const x = point.lng,
    y = point.lat;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng,
      yi = vs[i].lat;
    const xj = vs[j].lng,
      yj = vs[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function getRotatedPolygonCoords(bottom, top, path) {
  const angleClicked = computeHeading(bottom, top);
  const rotatedPath = [];

  path.forEach((coord) => {
    const angleCoord = computeHeading(bottom, coord);
    const distance = bottom.distanceTo(coord);
    const newBearing = angleCoord - angleClicked;

    rotatedPath.push(computeOffset(bottom, distance, newBearing));
  });

  return rotatedPath;
}

function getBounding(start, end, path) {
  const rotatedPath = getRotatedPolygonCoords(start, end, path);

  let n = start,
    e = start,
    s = start,
    w = start;

  for (let i = 0; i < rotatedPath.length; i++) {
    const p = rotatedPath[i];

    if (p.lat > n.lat && p.lat > start.lat) n = p;
    if (p.lat < s.lat && p.lat < start.lat) s = p;
    if (p.lng > e.lng && p.lng > start.lng) e = p;
    if (p.lng < w.lng && p.lng < start.lng) w = p;
  }

  n = L.latLng(n.lat, start.lng);
  e = L.latLng(start.lat, e.lng);
  s = L.latLng(s.lat, start.lng);
  w = L.latLng(start.lat, w.lng);

  const distanceNorth = +start.distanceTo(n).toFixed(2);
  const distanceEast = +start.distanceTo(e).toFixed(2);
  const distanceSouth = +start.distanceTo(s).toFixed(2);
  const distanceWest = +start.distanceTo(w).toFixed(2);

  return { distanceNorth, distanceEast, distanceSouth, distanceWest };
}

function getOffsetY(
  distanceEast,
  distanceWest,
  moduleHeight,
  offsetX,
  tiltedPerpendicularAngle,
  polygon,
) {
  const roofHeight = Math.max(distanceEast, distanceWest);
  let offsetY = +((roofHeight - Math.floor(roofHeight / moduleHeight) * moduleHeight) / 2).toFixed(
    2,
  );

  const offsetCoordY = computeOffset(offsetX, offsetY, tiltedPerpendicularAngle);

  if (!pointInPolygon(offsetCoordY, polygon)) {
    offsetY = -offsetY;
  }

  return offsetY;
}

function getOffsetCoordsX(distance, moduleWidth, start, heading) {
  const offset = +((distance - Math.floor(distance / moduleWidth) * moduleWidth) / 2).toFixed(2);
  const offsetCoord = computeOffset(start, offset, heading);

  return offsetCoord;
}

function calculateAndDisplayModules(
  polygon,
  start,
  end,
  heading,
  tiltAngle,
  moduleWidth,
  moduleHeight,
) {
  const perpendicularAngle = heading + 90;
  const tiltedPerpendicularAngle = perpendicularAngle + tiltAngle;
  const distance = start.distanceTo(end);
  const modules = [];

  let path = polygon.getLatLngs().flat();

  const { distanceNorth, distanceEast, distanceSouth, distanceWest } = getBounding(
    start,
    end,
    path,
  );

  const negativeCols = Math.floor(distanceSouth / moduleWidth);
  const positiveCols = Math.floor(distanceNorth / moduleWidth);
  const negativeRows = Math.floor(distanceWest / moduleHeight);
  const positiveRows = Math.floor(distanceEast / moduleHeight);

  const offsetXLatLng = getOffsetCoordsX(distance, moduleWidth, start, heading);
  const offsetY = getOffsetY(
    distanceEast,
    distanceWest,
    moduleHeight,
    offsetXLatLng,
    tiltedPerpendicularAngle,
    polygon,
  );

  for (let i = -negativeRows; i < positiveRows; i++) {
    for (let j = -negativeCols; j < positiveCols; j++) {
      const offsetYLatLng = computeOffset(
        offsetXLatLng,
        i * moduleHeight + offsetY,
        tiltedPerpendicularAngle,
      );

      const moduleSW = computeOffset(offsetYLatLng, j * moduleWidth, heading);
      const moduleSE = computeOffset(moduleSW, moduleWidth, heading);
      const moduleNE = computeOffset(moduleSE, moduleHeight, tiltedPerpendicularAngle);
      const moduleNW = computeOffset(moduleSW, moduleHeight, tiltedPerpendicularAngle);

      const moduleCorners = [moduleSW, moduleSE, moduleNE, moduleNW];

      const insideCount = moduleCorners.reduce(
        (acc, p) => acc + (pointInPolygon(p, polygon) ? 1 : 0),
        0,
      );

      if (insideCount !== 4) continue;

      modules.push(moduleCorners);
    }
  }

  return modules;
}

function calculateModuleHeight(angle, height) {
  const rad = angle * (Math.PI / 180);
  const cosValue = Math.cos(rad);
  const newHeight = (cosValue * height).toFixed(2);

  return newHeight;
}

class MapInstance {
  constructor(
    roofCardContainerArr,
    mapContainer,
    roofCardTemplate,
    addNewRoofBtn,
    progressBtnArr,
    roofTypeSelectionObj,
    selectionContainerArr,
    roofAngleSliderObj,
    distortionAngleSliderObj,
  ) {
    this.map = null;
    this.mapContainer = mapContainer;
    this.roofCardContainerArr = roofCardContainerArr;
    this.roofCardTemplate = roofCardTemplate;
    this.addNewRoofBtnInstance = null;
    this.selectionContainerArr = selectionContainerArr;
    this.roofInstances = [];
    this.progressBtnArr = [];
    this.roofAngleSliderInstance = null;
    this.distortionAngleSliderInstance = null;
    // State of Step
    this.state = "roof-type-selection";
    this.activeRoofInstance = null;
    this.boundCreateMarker = this.createMarker.bind(this);

    try {
      this.createMap();
      this.loadTiles();
      this.setLayerIndex();
      this.createRoofAngleSliderInstance(roofAngleSliderObj);
      this.createDistortionAngleSliderInstance(distortionAngleSliderObj);
      this.createRoofTypeSelectionInstance(roofTypeSelectionObj);
      this.createProgressBtnInstance(progressBtnArr);
      this.createAddNewRoofBtnInstance(addNewRoofBtn);
    } catch (error) {
      console.error(error.message);
    }
  }

  createMap() {
    this.map = L.map(this.mapContainer, {
      center: [47.650654145124975, 9.470023180118131],
      zoom: 18,
      maxZoom: 25,
      // gestureHandling: true
    });
  }

  loadTiles() {
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
      },
    ).addTo(this.map);
  }

  setLayerIndex() {
    this.map.createPane("marker");
    this.map.getPane("marker").style.zIndex = 460;

    this.map.createPane("polylines");
    this.map.getPane("polylines").style.zIndex = 450;

    this.map.createPane("polygon");
    this.map.getPane("polygon").style.zIndex = 440;
  }

  createRoofAngleSliderInstance(roofAngleSliderObj) {
    this.roofAngleSliderInstance = new AngleSliderInstance(this, roofAngleSliderObj);
  }

  createDistortionAngleSliderInstance(distortionAngleSliderObj) {
    this.distortionAngleSliderInstance = new AngleSliderInstance(this, distortionAngleSliderObj);
  }

  createRoofTypeSelectionInstance(roofTypeSelectionObj) {
    const obj = roofTypeSelectionObj;

    obj.roofTypeSelection.forEach((input) => {
      new RoofTypeSelectionInstance(this, obj.selectionContainer, input, obj.dialogArr);
    });
  }

  createProgressBtnInstance(progressBtnArr) {
    progressBtnArr.forEach((btn) => {
      const progressBtn = new ProgressButtonInstance(btn, this);
      this.progressBtnArr.push(progressBtn);
    });
  }

  createAddNewRoofBtnInstance(addNewRoofBtn) {
    this.addNewRoofBtnInstance = new AddNewRoofBtnInstance(this, addNewRoofBtn);
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

  startMarkingMode() {
    this.map.on("click", this.boundCreateMarker);
    this.mapContainer.style.cursor = "crosshair";
    this.addNewRoofBtnInstance.setStateToActive();
  }

  stopMarkingMode() {
    this.map.off("click", this.boundCreateMarker);
    this.mapContainer.style.cursor = "";
    this.addNewRoofBtnInstance.setStateToInactive();
  }

  setProgressBtnState(state) {
    const progressBtn = this.progressBtnArr.find((btnInstance) => {
      const current = btnInstance.btn.dataset.current;
      const direction = btnInstance.btn.dataset.direction;
      return current === this.state && direction === "next";
    });

    if (state === "enable") {
      progressBtn.enableButton();
    } else if (state === "disable") {
      progressBtn.disableButton();
    }
  }

  createMarker(e) {
    if (!this.activeRoofInstance) return;
    if (this.activeRoofInstance.markingFinished) return;

    const { lat, lng } = e.latlng;

    this.activeRoofInstance.createMarker([lat, lng]);

    if (this.activeRoofInstance.roofCardArr.length === 0) {
      this.activeRoofInstance.createRoofCard();
    }
  }
}

class RoofInstance {
  constructor(name, map, mapInstance) {
    // Instances
    this.mapInstance = mapInstance;
    this.name = name;
    this.map = map;
    // States
    this.isActive = true;
    this.isHidden = false;
    this.markingFinished = false;
    // Map elements
    this.allMarker = [];
    this.allPolylines = [];
    this.polygon = null;
    this.allModules = [];
    this.deselectedModules = [];
    // Roof Edge Selected
    this.polylineSelected = false;
    // Roof Instance as Card
    this.roofCardArr = [];
    // Module Spec.
    this.moduleWidth = 1.13;
    this.moduleHeight = 1.76;
    this.modulePower = 440;
    this.moduleLoss = 14;
    // Angles
    this.azimuth;
    this.roofAngle = +this.mapInstance.roofAngleSliderInstance.value;
    this.distortionAngle = +this.mapInstance.distortionAngleSliderInstance.value;
  }

  createMarker(markerCoords) {
    const marker = new MarkerInstance(this.map, markerCoords, this, this.mapInstance);

    this.allMarker.push(marker);

    this.addPolyline();
  }

  deletePolylines() {
    this.allPolylines.forEach((line) => line.deletePolyline());

    this.allPolylines = [];
  }

  addPolyline() {
    const n = this.allMarker.length;
    if (n < 2) return;

    const last = this.allMarker[n - 1].instance.getLatLng();
    const prev = this.allMarker[n - 2].instance.getLatLng();

    const polyline = new PolylineInstance(this.mapInstance, this, [prev, last]);

    this.allPolylines.push(polyline);
  }

  addClosingPolyline() {
    const first = this.allMarker[0].instance.getLatLng();
    const last = this.allMarker[this.allMarker.length - 1].instance.getLatLng();

    const polyline = new PolylineInstance(this.mapInstance, this, [first, last]);

    this.allPolylines.push(polyline);
  }

  updatePolylines() {
    const n = this.allMarker.length;
    if (n < 2) return;

    this.deletePolylines();

    for (let i = 0; i < n - 1; i++) {
      const curr = this.allMarker[i].instance.getLatLng();
      const next = this.allMarker[i + 1].instance.getLatLng();

      const polyline = new PolylineInstance(this.mapInstance, this, [curr, next]);

      this.allPolylines.push(polyline);
    }
  }

  disableInstance() {
    if (!this.isActive) return;

    this.isActive = false;
    this.mapInstance.activeRoofInstance = null;

    this.roofCardArr.forEach((card) => {
      card.disableCardInstance();
    });

    this.allPolylines.forEach((line) => {
      line.disablePolyline();
    });

    this.allMarker.forEach((marker) => {
      marker.setToDisabledMode();
    });

    if (this.polygon) this.polygon.disablePolygon();

    this.allModules.forEach((module) => {
      module.setColorToDisabledMode();
    });

    this.deselectedModules.forEach((module) => {
      module.setColorToDisabledMode();
    });

    this.disableSliderControls();
  }

  enableInstance() {
    if (this.isActive) return;

    this.isActive = true;
    this.mapInstance.activeRoofInstance = this;

    this.roofCardArr.forEach((card) => {
      card.enableCardInstance();
    });

    this.allPolylines.forEach((line) => {
      line.enablePolyline();
    });

    this.allMarker.forEach((marker) => {
      marker.setToEnabledMode();
    });

    if (this.polygon) this.polygon.enablePolygon();

    this.allModules.forEach((module) => {
      module.setColorToEnabledMode();
    });

    this.deselectedModules.forEach((module) => {
      module.setColorToEnabledMode();
    });

    this.enableSliderControls();
    this.setCurrValuesToAngleSlider();
  }

  hideInstance() {
    this.allPolylines.forEach((line) => {
      line.hidePolyline();
    });

    this.allMarker.forEach((marker) => {
      marker.hideMarker();
    });

    if (this.polygon) this.polygon.hidePolygon();

    this.allModules.forEach((module) => {
      module.hideModule();
    });

    this.deselectedModules.forEach((module) => {
      module.hideModule();
    });
  }

  showInstance() {
    this.allPolylines.forEach((line) => {
      line.showPolyline();
    });

    this.allMarker.forEach((marker) => {
      marker.showMarker();
    });

    if (this.polygon) this.polygon.showPolygon();

    this.allModules.forEach((module) => {
      module.showModule();
    });

    this.deselectedModules.forEach((module) => {
      module.showModule();
    });
  }

  deleteInstance() {
    this.hideInstance();
    this.allPolylines = [];
    this.allMarker = [];
    this.allModules = [];
    this.deselectedModules = [];
    this.removeInstanceFromArr();
    this.updateName();
  }

  disableSliderControls() {
    this.mapInstance.roofAngleSliderInstance.disableSliderControls();
    this.mapInstance.distortionAngleSliderInstance.disableSliderControls();
  }

  enableSliderControls() {
    this.mapInstance.roofAngleSliderInstance.enableSliderControls();
    this.mapInstance.distortionAngleSliderInstance.enableSliderControls();
  }

  setCurrValuesToAngleSlider() {
    this.mapInstance.roofAngleSliderInstance.value = +this.roofAngle;
    this.mapInstance.roofAngleSliderInstance.setNewValueToSlider();

    this.mapInstance.distortionAngleSliderInstance.value = +this.distortionAngle;
    this.mapInstance.distortionAngleSliderInstance.setNewValueToSlider();
  }

  setToMarkOutMode() {
    this.allPolylines.forEach((line) => {
      line.setColorToCurrentState();
    });

    this.allMarker.forEach((marker) => {
      marker.showMarker();
    });

    if (this.polygon) this.polygon.deletePolygon();
  }

  setToRoofEdgeSelectionMode() {
    this.allPolylines.forEach((line) => line.setColorToCurrentState());

    this.allMarker.forEach((marker) => marker.hideMarker());

    this.addPolygon();

    this.deleteModules();
  }

  setToModuleSetupMode() {
    this.allPolylines.forEach((line) => line.setColorToCurrentState());

    this.polygon.hidePolygon();

    this.createModuleCoords();

    this.allModules.forEach((module) => module.setColorToCurrentState());
  }

  removeInstanceFromArr() {
    const currRoofIndex = this.mapInstance.roofInstances.indexOf(this);

    if (currRoofIndex > -1) {
      this.mapInstance.roofInstances.splice(currRoofIndex, 1);
    }
  }

  updateName() {
    this.mapInstance.roofInstances.forEach((instance, index) => {
      instance.name = `Roof ${index + 1}`;
      instance.roofCardArr.forEach((card) => {
        card.updateNameOfRoofInstance();
      });
    });
  }

  addPolygon() {
    const markerCoords = this.allMarker.map((marker) => marker.instance.getLatLng());

    this.polygon = new PolygonInstance(this.mapInstance, this, markerCoords);
  }

  checkModuleLayoutDirection() {
    const line = this.allPolylines.find((line) => this.polylineSelected === line.instance);
    const { from, to } = line.getPolylineCoords();
    const { start, end } = line.identifyTopAndBottom(from, to);
    const headingToNorth = bearingDeg(start, end);
    const checkCoords = setCheckCoords(start, end, headingToNorth);
    const coordsInPolygon = checkCoords.map((point) => pointInPolygon(point, this.polygon.polygon));

    const heading = coordsInPolygon.some((point) => point === true)
      ? this.azimuth - 90
      : this.azimuth + 90;

    return { heading, start, end };
  }

  addModules(modulesLatLngs) {
    modulesLatLngs.forEach((latLngs) => {
      const module = new ModuleInstance(this.mapInstance, this, latLngs);

      this.allModules.push(module);
    });
  }

  createModuleCoords() {
    if (!this.polylineSelected) return;

    this.deleteModules();

    const { heading, start, end } = this.checkModuleLayoutDirection();
    const newModuleHeight = +calculateModuleHeight(this.roofAngle, this.moduleHeight);

    const modulesLatLngs = calculateAndDisplayModules(
      this.polygon.polygon,
      start,
      end,
      heading,
      this.distortionAngle,
      this.moduleWidth,
      newModuleHeight,
    );

    this.addModules(modulesLatLngs);
    this.updateRoofCardValues();
  }

  updateRoofCardValues() {
    this.roofCardArr.forEach((roofCard) => {
      roofCard.updateRoofCardValue();
    });
  }

  createRoofCard() {
    this.mapInstance.roofCardContainerArr.forEach((container) => {
      const roofCard = new RoofCardInstance(this, this.mapInstance, container);

      this.roofCardArr.push(roofCard);
    });
  }

  deleteModules() {
    if (this.allModules.length === 0 && this.deselectedModules.length === 0) return;

    this.allModules.forEach((module) => module.deleteModule());
    this.deselectedModules.forEach((module) => {
      module.deleteModule();
    });

    this.allModules = [];
    this.deselectedModules = [];
  }
}

class MarkerInstance {
  // Marker Icon
  static markerIcon = L.divIcon({
    html: `<svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="6" fill="red" />
            </svg>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  constructor(map, coords, roofInstance, mapInstance) {
    this.mapInstance = mapInstance;
    this.map = map;
    this.coords = coords;
    this.instance = null;
    this.roofInstance = roofInstance;

    try {
      this.addMarkerToMap();
      this.updatePolylinesOnDrag();
      this.finishMarking();
    } catch (error) {
      console.error(error.message);
    }
  }

  addMarkerToMap() {
    if (this.roofInstance.markingFinished) return;
    this.instance = L.marker(this.coords, {
      icon: MarkerInstance.markerIcon,
      pane: "marker",
      zIndexOffset: 1,
      draggable: true,
    }).addTo(this.map);
  }

  updatePolylinesOnDrag() {
    this.instance.on("drag", () => {
      if (!this.roofInstance.isActive) return;
      this.roofInstance.updatePolylines();
      this.roofInstance.polylineSelected = false;

      if (this.roofInstance.markingFinished) this.roofInstance.addClosingPolyline();
    });
  }

  finishMarking() {
    this.instance.on("click", () => {
      if (!this.roofInstance.isActive) return;
      if (this.roofInstance.markingFinished) return;
      if (this.roofInstance.allMarker[0].instance !== this.instance) return;
      if (this.roofInstance.allMarker.length < 3) return;

      this.roofInstance.markingFinished = true;
      this.roofInstance.addClosingPolyline();
      this.mapInstance.stopMarkingMode();
      this.mapInstance.setProgressBtnState("enable");
    });
  }

  setToMarkOutMode() {
    const svgTag = this.instance.getElement();
    const circle = svgTag.querySelector("circle");
    circle.setAttribute("fill", "red");

    this.instance.dragging.enable();
  }

  setToSelectionMode() {
    const svgTag = this.instance.getElement();
    const circle = svgTag.querySelector("circle");
    circle.setAttribute("fill", "orange");
  }

  setToModuleMode() {
    const svgTag = this.instance.getElement();
    const circle = svgTag.querySelector("circle");
    circle.setAttribute("fill", "#15803d");
  }

  setToDisabledMode() {
    if (this.mapInstance.state !== "roof-setup") return;

    const svgTag = this.instance.getElement();
    const circle = svgTag.querySelector("circle");
    circle.setAttribute("fill", "#a0a0a0");
    this.instance.dragging.disable();
    this.hasDisabledMode = true;
  }

  setToEnabledMode() {
    if (this.mapInstance.state !== "roof-setup") return;

    this.hasDisabledMode = false;
    this.showMarker();
  }

  setColorToCurrentState() {
    if (this.mapInstance.state !== "roof-setup") return;

    if (!this.roofInstance.isActive) {
      this.setToDisabledMode();
      return;
    }

    this.setToMarkOutMode();
  }

  hideMarker() {
    this.instance.remove();
  }

  showMarker() {
    if (this.mapInstance.state !== "roof-setup") return;

    this.instance.addTo(this.map);
    this.setColorToCurrentState();
  }
}

class PolylineInstance {
  constructor(mapInstance, roofInstance, latLng) {
    this.mapInstance = mapInstance;
    this.map = this.mapInstance.map;
    this.instance = null;
    this.coords = latLng;
    this.roofInstance = roofInstance;
    this.hasDisabledMode = false;

    this.isSelected = false;

    try {
      this.addPolylineToMap();
      this.bindClickEventHandler();
    } catch (error) {
      console.error(error.message);
    }
  }

  addPolylineToMap() {
    this.instance = L.polyline(this.coords, {
      opacity: 1,
      pane: "polylines",
      weight: 3,
      color: "red",
    }).addTo(this.map);
  }

  bindClickEventHandler() {
    this.instance.on("click", () => {
      if (!this.roofInstance.isActive) return;
      if (!this.roofInstance.polygon) return;
      this.roofInstance.allPolylines.forEach((line) => {
        line.isSelected = false;
        line.setColorToCurrentState();
      });
      this.setToSelected();
      this.setAzimuthAngle();
    });
  }

  setToMarkOutMode() {
    this.instance.setStyle({
      color: "red",
    });
  }

  setToSelectionMode() {
    this.instance.setStyle({
      color: "orange",
    });
  }

  setToSelected() {
    this.instance.setStyle({
      color: "green",
    });
    this.isSelected = true;
    this.roofInstance.polylineSelected = this.instance;
    this.instance.bringToFront();

    this.updateProgressBtnState();
  }

  updateProgressBtnState() {
    const selectedCount = this.mapInstance.roofInstances.reduce((acc, currVal) => {
      if (currVal.polylineSelected) return acc + 1;
      return acc;
    }, 0);

    if (this.mapInstance.roofInstances.length === selectedCount) {
      this.mapInstance.setProgressBtnState("enable");
    } else {
      this.mapInstance.setProgressBtnState("disable");
    }
  }

  setToModuleMode() {
    this.instance.setStyle({
      color: "#15803d",
    });
  }

  disablePolyline() {
    if (this.isSelected && this.mapInstance.state === "roof-edge-selection") return;

    this.instance.setStyle({
      color: "#a0a0a0",
    });
  }

  enablePolyline() {
    this.hasDisabledMode = false;
    this.setColorToCurrentState();
  }

  setColorToCurrentState() {
    if (!this.isSelected && this.mapInstance.state === "roof-edge-selection") {
      this.updateProgressBtnState();
    }

    if (this.isSelected && this.mapInstance.state === "roof-edge-selection") {
      this.setToSelected();
      return;
    }

    if (!this.roofInstance.isActive) {
      this.disablePolyline();
      return;
    }

    switch (this.mapInstance.state) {
      case "roof-setup":
        this.setToMarkOutMode();
        break;
      case "roof-edge-selection":
        this.setToSelectionMode();
        break;
      case "module-setup":
        this.setToModuleMode();
        break;
      default:
        console.log(`Expression ${this.state} not found.`);
    }
  }

  hidePolyline() {
    this.instance.remove();
  }

  deletePolyline() {
    this.instance.remove();
  }

  showPolyline() {
    this.instance.addTo(this.map);
  }

  identifyTopAndBottom(from, to) {
    let start, end;

    from.lat <= to.lat ? ((end = from), (start = to)) : ((end = to), (start = from));

    return { start, end };
  }

  getPolylineCoords() {
    const latlngs = this.instance.getLatLngs();
    const from = latlngs[0];
    const to = latlngs[latlngs.length - 1];

    return { from, to };
  }

  calculateAzimuthAngle(alignmentAngleToNorth, coordsInPolygon) {
    const azimuth = coordsInPolygon.some((point) => point === true)
      ? alignmentAngleToNorth - 180
      : alignmentAngleToNorth;

    return azimuth;
  }

  setAzimuthAngle() {
    const { from, to } = this.getPolylineCoords();
    const { start, end } = this.identifyTopAndBottom(from, to);
    const alignmentAngleToNorth = bearingDeg(start, end);
    const checkCoords = setCheckCoords(start, end, alignmentAngleToNorth);
    const coordsInPolygon = checkCoords.map((point) =>
      pointInPolygon(point, this.roofInstance.polygon.polygon),
    );

    this.roofInstance.azimuth = this.calculateAzimuthAngle(alignmentAngleToNorth, coordsInPolygon);
  }
}

class PolygonInstance {
  constructor(mapInstance, roofInstance, coords) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    this.coords = coords;
    this.polygon = null;

    this.createPolygon();
  }

  createPolygon() {
    const fillColor = this.roofInstance.isActive ? "orange" : "#a0a0a0";

    this.polygon = L.polygon(this.coords, {
      opacity: 0,
      pane: "polygon",
      fillColor: fillColor,
      fillOpacity: 0.4,
    }).addTo(this.map);

    if (this.roofInstance.isHidden) this.hidePolygon();
  }

  disablePolygon() {
    if (this.mapInstance.state === "roof-edge-selection") {
      this.polygon.setStyle({
        fillColor: "#a0a0a0",
      });
    }
  }

  enablePolygon() {
    if (this.mapInstance.state === "roof-edge-selection") {
      this.polygon.setStyle({
        fillColor: "orange",
      });
    }
  }

  hidePolygon() {
    this.polygon.remove();
  }

  showPolygon() {
    if (this.mapInstance.state !== "roof-edge-selection") return;
    this.polygon.addTo(this.map);
  }

  deletePolygon() {
    this.polygon.remove();
    this.roofInstance.polygon = null;
  }
}

class ModuleInstance {
  constructor(mapInstance, roofInstance, latLng) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.instance;
    this.roofInstance = roofInstance;
    this.coords = latLng;
    this.moduleIsDeselected = false;

    try {
      this.addModuleToMap();
      this.bindClickEventHandler();
    } catch (error) {
      console.error(error.message);
    }
  }

  addModuleToMap() {
    this.instance = L.polygon(this.coords, {
      color: "white",
      opacity: 1,
      weight: 1,
      fillColor: "#122B4E",
      fillOpacity: 0.65,
    }).addTo(this.map);

    if (this.roofInstance.isHidden) this.hideModule();
  }

  bindClickEventHandler() {
    this.instance.on("click", () => {
      if (!this.roofInstance.isActive) return;
      this.moduleIsDeselected ? this.selectModule() : this.deselectModule();
    });
  }

  deselectModule() {
    this.instance.setStyle({ fillColor: "transparent" });
    this.moduleIsDeselected = true;

    const index = this.roofInstance.allModules.indexOf(this);
    if (index !== -1) this.roofInstance.allModules.splice(index, 1);

    this.roofInstance.deselectedModules.push(this);

    this.roofInstance.roofCardArr.forEach((card) => {
      card.updateRoofCardValue();
    });
  }

  selectModule() {
    this.instance.setStyle({ fillColor: "#122B4E" });
    this.moduleIsDeselected = false;

    const index = this.roofInstance.deselectedModules.indexOf(this);
    if (index !== -1) this.roofInstance.deselectedModules.splice(index, 1);

    this.roofInstance.allModules.push(this);

    this.roofInstance.roofCardArr.forEach((card) => {
      card.updateRoofCardValue();
    });
  }

  hideModule() {
    this.instance.remove();
  }

  showModule() {
    this.instance.addTo(this.map);
    this.setColorToCurrentState();
  }

  deleteModule() {
    this.instance.remove();
  }

  setColorToDisabledMode() {
    if (this.moduleIsDeselected) {
      this.setColorToDeselectedMode();
      return;
    }

    this.instance.setStyle({ fillColor: "#a0a0a0" });
  }

  setColorToEnabledMode() {
    if (this.moduleIsDeselected) {
      this.setColorToDeselectedMode();
      return;
    }

    this.instance.setStyle({ fillColor: "#122B4E" });
  }

  setColorToDeselectedMode() {
    this.instance.setStyle({ fillColor: "transparent" });
  }

  setColorToCurrentState() {
    const roofState = this.mapInstance.state;

    if (this.moduleIsDeselected) {
      this.setColorToDeselectedMode();
      return;
    }

    if (!this.roofInstance.isActive) {
      this.setColorToDisabledMode();
      return;
    }

    switch (roofState) {
      case "module-setup":
        // this.setToModuleMode();
        break;
      default:
        console.log(`Expression ${this.state} not found.`);
    }
  }
}

class AngleSliderInstance {
  constructor(mapInstance, angleSliderObj) {
    this.mapInstance = mapInstance;
    this.slider = angleSliderObj.input;
    this.increaseBtn = angleSliderObj.increase;
    this.decreaseBtn = angleSliderObj.decrease;
    this.display = angleSliderObj.display;
    this.type = angleSliderObj.type;
    this.value = +this.slider.value;
    this.step = +this.slider.step;
    this.min = +this.slider.min;
    this.max = +this.slider.max;

    try {
      this.setIncreaseHandler();
      this.setDecreaseHandler();
      this.setInputHandler();
    } catch (error) {
      console.error(error.message);
    }
  }

  setIncreaseHandler() {
    this.increaseBtn.addEventListener("click", () => {
      if (!this.mapInstance.activeRoofInstance) return;
      if (this.mapInstance.state !== "module-setup") return;
      if (this.value === this.max) return;

      this.value += +this.step;
      this.updateAllValues();
      this.updateModules();
    });
  }

  setDecreaseHandler() {
    this.decreaseBtn.addEventListener("click", () => {
      if (!this.mapInstance.activeRoofInstance) return;
      if (this.mapInstance.state !== "module-setup") return;
      if (this.value === this.min) return;

      this.value -= +this.step;
      this.updateAllValues();
      this.updateModules();
    });
  }

  setInputHandler() {
    this.slider.addEventListener("input", () => {
      if (!this.mapInstance.activeRoofInstance) return;
      if (this.mapInstance.state !== "module-setup") return;

      this.value = +this.slider.value;
      this.updateAllValues();
      this.updateModules();
    });
  }

  updateAllValues() {
    this.setNewValueToSlider();
    this.setNewValuesToRoofInstance();
    this.setNewValuesToRoofCard();
  }

  updateModules() {
    this.mapInstance.activeRoofInstance.createModuleCoords();
  }

  setNewValueToSlider() {
    this.slider.value = this.value;
    this.display.textContent = this.value;
  }

  setNewValuesToRoofCard() {
    this.mapInstance.activeRoofInstance.roofCardArr.forEach((roofCard) => {
      roofCard.updateRoofCardValue();
    });
  }

  setNewValuesToRoofInstance() {
    if (this.type === "roof-angle") {
      this.mapInstance.activeRoofInstance.roofAngle = this.value;
    } else if (this.type === "distortion") {
      this.mapInstance.activeRoofInstance.distortionAngle = this.value;
    }
  }

  disableSliderControls() {
    this.slider.disabled = true;
    this.increaseBtn.disabled = true;
    this.decreaseBtn.disabled = true;
  }

  enableSliderControls() {
    this.slider.disabled = false;
    this.increaseBtn.disabled = false;
    this.decreaseBtn.disabled = false;
  }
}

class RoofCardInstance {
  constructor(roofInstance, mapInstance, container) {
    this.map = mapInstance.map;
    this.mapInstance = mapInstance;
    this.roofInstance = roofInstance;
    this.container = container;
    this.cardTemplate = this.mapInstance.roofCardTemplate;
    this.card = null;
    this.headline = null;
    this.roofAngle = null;
    this.moduleCount = null;
    this.editBtn = null;
    this.hideBtn = null;
    this.deleteBtn = null;

    this.editBtnIsDisabled = false;

    try {
      this.createRoofCard();
    } catch (error) {
      console.error(error.message);
    }
  }

  createRoofCard() {
    this.assignCardElements();
    this.getControlBtnState();
    this.appendRoofCard();
    this.bindEditClickHandler();
    this.bindHideClickHandler();
    this.bindDeleteClickHandler();
  }

  assignCardElements() {
    const qs = (sel, par) => (par ? par.querySelector(sel) : document.querySelector(sel));
    const clone = this.cardTemplate.content.cloneNode(true);
    const card = qs("[data-element='card']", clone);
    const headline = qs("[data-element='headline']", card);
    const roofAngle = qs("[data-element='angle']", card);
    const moduleCount = qs("[data-element='module-count']", card);
    const editBtn = qs("[data-element='edit']", card);
    const hideBtn = qs("[data-element='hide']", card);
    const deleteBtn = qs("[data-element='delete']", card);

    if (!card || !headline || !roofAngle || !moduleCount || !editBtn || !hideBtn || !deleteBtn)
      return;

    Object.assign(this, {
      card,
      headline,
      roofAngle,
      moduleCount,
      editBtn,
      hideBtn,
      deleteBtn,
    });
  }

  getControlBtnState() {
    const editBtnIsActive = Boolean(this.editBtn.dataset.active == "true");
    const hideBtnIsActive = Boolean(this.hideBtn.dataset.active == "true");
    const deleteBtnIsActive = Boolean(this.deleteBtn.dataset.active == "true");

    Object.assign(this, {
      editBtnIsActive,
      hideBtnIsActive,
      deleteBtnIsActive,
    });
  }

  appendRoofCard() {
    this.updateRoofCardValue();

    this.container.append(this.card);
  }

  updateRoofCardValue() {
    const roof = this.roofInstance;
    this.headline.textContent = roof.name;
    this.roofAngle.textContent = roof.roofAngle;
    this.moduleCount.textContent = roof.allModules.length;
  }

  disableCardInstance() {
    if (this.roofInstance.isActive) return;

    this.card.dataset.active = "false";
    this.editBtn.dataset.active = "false";
  }

  enableCardInstance() {
    if (!this.roofInstance.isActive) return;

    this.card.dataset.active = "true";
    this.editBtn.dataset.active = "true";
  }

  bindEditClickHandler() {
    this.editBtn.addEventListener("click", () => {
      if (this.roofInstance.isHidden) return;

      if (this.roofInstance.isActive) {
        this.roofInstance.disableInstance();
        this.mapInstance.stopMarkingMode();
      } else if (!this.roofInstance.isActive) {
        if (this.mapInstance.activeRoofInstance) {
          this.mapInstance.activeRoofInstance.disableInstance();
        }

        this.roofInstance.markingFinished
          ? this.mapInstance.stopMarkingMode()
          : this.mapInstance.startMarkingMode();

        this.mapInstance.activeRoofInstance = this.roofInstance;
        this.roofInstance.enableInstance();
      }
    });
  }

  bindHideClickHandler() {
    this.hideBtn.addEventListener("click", () => {
      const isHidden = !this.roofInstance.isHidden;
      this.roofInstance.isHidden = isHidden;

      this.roofInstance.roofCardArr.forEach((card) => {
        card.hideBtn.dataset.active = isHidden;
        card.editBtn.disabled = isHidden;
      });

      if (isHidden) {
        this.roofInstance.disableInstance();
        this.roofInstance.hideInstance();
      } else {
        this.roofInstance.showInstance();
      }
    });
  }

  bindDeleteClickHandler() {
    this.deleteBtn.addEventListener("click", () => {
      if (!this.roofInstance.markingFinished) this.mapInstance.stopMarkingMode();

      this.deleteAllRoofCards();
      this.roofInstance.deleteInstance();

      if (this.mapInstance.roofInstances.length === 0) {
        this.restartMarkOutStep();
        this.mapInstance.setProgressBtnState("disable");
      }
    });
  }

  deleteAllRoofCards() {
    this.roofInstance.roofCardArr.forEach((card) => {
      card.container.removeChild(card.card);
    });

    this.roofInstance.roofCardArr = [];
  }

  restartMarkOutStep() {
    const containerArr = Array.from(this.mapInstance.selectionContainerArr);
    containerArr.forEach((container) => {
      container.hidden = true;
    });

    const startContainer = containerArr.find((container) => {
      return container.id === "roof-setup";
    });

    startContainer.hidden = false;
    this.mapInstance.state = "roof-setup";
  }

  updateNameOfRoofInstance() {
    this.headline.textContent = this.roofInstance.name;
  }
}

class ProgressButtonInstance {
  static btnInstances = [];
  constructor(btn, mapInstance) {
    const qs = (sel) => {
      return document.querySelector(sel);
    };
    this.btn = btn;
    this.mapInstance = mapInstance;
    this.btnDisabled = Boolean(btn.disabled);
    this.direction = this.btn.dataset.direction;
    this.currentSelection = qs(`#${btn.dataset.current}`);
    this.targetSelection = qs(`#${btn.dataset.target}`);

    ProgressButtonInstance.btnInstances.push(this);

    this.bindClickEvent();
  }

  bindClickEvent() {
    this.btn.addEventListener("click", () => {
      this.toggleSelection();
      this.initCases(this.targetSelection.id);
    });
  }

  initCases(expr) {
    if (expr) {
      this.mapInstance.state = expr;
    }

    switch (expr) {
      case "roof-setup":
        this.forwardToRoofSetup();
        break;
      case "roof-edge-selection":
        this.forwardToRoofEdgeSelection();
        break;
      case "module-setup":
        this.forwardToModuleSetup();
        break;
      default:
        console.log(`Expression ${expr} not found.`);
    }
  }

  forwardToRoofSetup() {
    // if (this.direction === "previous") {
    this.mapInstance.roofInstances.forEach((roof) => {
      roof.setToMarkOutMode();
    });
    // }
  }

  forwardToRoofEdgeSelection() {
    // if (this.direction === "next") {
    this.mapInstance.roofInstances.forEach((roof) => {
      roof.setToRoofEdgeSelectionMode();
    });
    // }
  }

  forwardToModuleSetup() {
    // if (this.direction === "next") {
    this.mapInstance.roofInstances.forEach((roof) => {
      roof.setToModuleSetupMode();
    });
    // } else if (this.direction === "previous") {
    // this.mapInstance.roofInstances.forEach((roof) => {
    //   roof.setToRoofEdgeSelectionMode();
    // });
    // }
  }

  toggleSelection() {
    if (this.btnDisabled) return;
    this.currentSelection.hidden = true;
    this.targetSelection.hidden = false;
  }

  disableButton() {
    this.btn.disabled = true;
    this.btnDisabled = true;
  }

  enableButton() {
    this.btn.disabled = false;
    this.btnDisabled = false;
  }
}

class RoofTypeSelectionInstance {
  constructor(mapInstance, container, input, dialogArr) {
    this.mapInstance = mapInstance;
    this.container = container;
    this.input = input;
    this.dialogArr = dialogArr;
    this.bindClickEvent();
  }

  bindClickEvent() {
    this.input.addEventListener("click", () => {
      this.setRoofType();
    });
  }

  setRoofType() {
    this.mapInstance.setProgressBtnState("enable");
    this.updateMarkUpInfoDialog();
  }

  updateMarkUpInfoDialog() {
    this.dialogArr.forEach((dialog) => {
      const useTag = dialog.querySelector("use");
      useTag.setAttribute("href", `#${this.input.id}-icon`);
    });
  }
}

class AddNewRoofBtnInstance {
  constructor(mapInstance, btn) {
    this.mapInstance = mapInstance;
    this.btn = btn;
    this.isActive = false;

    this.bindClickEventHandler();
  }

  setStateToActive() {
    this.isActive = true;
    this.btn.dataset.active = "true";
  }

  setStateToInactive() {
    this.isActive = false;
    this.btn.dataset.active = "false";
  }

  bindClickEventHandler() {
    this.btn.addEventListener("click", () => {
      if (this.isActive) return;

      this.mapInstance.createRoofInstance();
      this.mapInstance.startMarkingMode();
    });
  }
}

const qs = (sel) => {
  return document.querySelector(sel);
};
const qsa = (sel) => {
  return document.querySelectorAll(sel);
};

const selectionContainerArr = qsa(".selection");
const selectionContainer = qs("#roof-type-selection");
const roofTypeSelection = qsa(".roof-selection__input");
const dialogArr = qsa(".info-dialog");
const roofTypeSelectionObj = {
  selectionContainer: selectionContainer,
  roofTypeSelection: roofTypeSelection,
  dialogArr: dialogArr,
};
const roofAngleSliderObj = {
  input: qs("#roof-angle"),
  increase: qs("#increase-roof-angle"),
  decrease: qs("#decrease-roof-angle"),
  display: qs("#display-roof-angle"),
  type: "roof-angle",
};
const distortionAngleSliderObj = {
  input: qs("#distortion-angle"),
  increase: qs("#increase-distortion-angle"),
  decrease: qs("#decrease-distortion-angle"),
  display: qs("#display-distortion-angle"),
  type: "distortion",
};
const containerForRoofCards = qsa(".selection__body[data-mark-up='true']");
const roofCardTemplate = qs("#roof-card");
const progressBtnArr = qsa(".selection__progress-btn");
const addNewRoofBtn = qs("#add-new-roof");
const mapContainer = qs("#map");
const map = new MapInstance(
  containerForRoofCards,
  mapContainer,
  roofCardTemplate,
  addNewRoofBtn,
  progressBtnArr,
  roofTypeSelectionObj,
  selectionContainerArr,
  roofAngleSliderObj,
  distortionAngleSliderObj,
);
