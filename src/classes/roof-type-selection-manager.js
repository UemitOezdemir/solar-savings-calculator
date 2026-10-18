"use strict";

import { roofTypeSelectionTemplateHTML } from "../components/roof-type-selection.js";
import RoofTypeSelectionInstance from "./roof-type-selection-instance.js";

export default class RoofTypeSelectionManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.roofTypeSelectionParentNode = null;

    this.allSelections = [];

    this.steps = {
      "roof-type-selection": {
        interaction: true,
      },
    };

    this.createRoofTypeSelection();
  }

  createRoofTypeSelection() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(roofTypeSelectionTemplateHTML, "text/html");
    this.roofTypeSelectionParentNode = doc.querySelector('[data-element="roof-type-selection"]');
    const selectionsArr = this.roofTypeSelectionParentNode.querySelectorAll(
      '[data-element="selection"]',
    );

    selectionsArr.forEach((selection) => {
      const selectionInstance = new RoofTypeSelectionInstance(this.mapInstance, selection);
    });

    this.appendRoofTypeSelection();
  }

  appendRoofTypeSelection() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) return;

    this.mapInstance.mainContentContainer.append(this.roofTypeSelectionParentNode);
  }

  showRoofTypeSelection() {
    const parent = this.roofTypeSelectionParentNode.parentNode;
    if (parent === this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.append(this.roofTypeSelectionParentNode);
  }

  hideRoofTypeSelection() {
    const parent = this.roofTypeSelectionParentNode.parentNode;
    if (parent !== this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.removeChild(this.roofTypeSelectionParentNode);
  }

  updateRoofTypeSelectionToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideRoofTypeSelection();
    } else {
      this.showRoofTypeSelection();
      if(this.mapInstance.selectedRoofType) {
        this.mapInstance.setProgressBtnState("enable")
      }
    }
  }
}
