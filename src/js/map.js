"use strict";

import MapInstance from "../classes/map-instance.js";
import MapPreviewInstance from "../classes/map-preview-instance.js";

const qs = (sel) => {
  return document.querySelector(sel);
};

const startCoords = [47.650654145124975, 9.470023180118131];
const headline = qs('[data-element="headline"]');
const progressCounter = qs('[data-element="progress-counter"]')
const controlElementsContainer = qs('[data-element="control-elements-container"]')
const mainContentContainer = qs('[data-element="main-content-container"]')
const progressBtnContainer = qs('[data-element="progress-btn-container"]')

const previewContainer = qs("#map-preview");
const mapContainer = qs("#map");

const mapPreview = new MapPreviewInstance(previewContainer, startCoords, mapContainer);

const map = new MapInstance(
  startCoords,
  mapContainer,
  mapPreview,
  headline,
  progressCounter,
  controlElementsContainer,
  mainContentContainer,
  progressBtnContainer,
);
