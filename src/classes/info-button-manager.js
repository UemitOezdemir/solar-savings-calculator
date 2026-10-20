"use strict";

import InfoBtnInstance from "./info-button-instance.js";

export default class InfoButtonManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.btnInstance = null;

    this.steps = ["roof-setup", "roof-edge-selection", "module-setup"];

    this.createInfoBtn();
  }

  createInfoBtn() {
    this.btnInstance = new InfoBtnInstance(this.mapInstance, this);
  }

  showInfoBtn() {
    const parent = this.btnInstance.btn.parentNode;
    if (parent === this.mapInstance.controlElementsContainer) return;

    this.mapInstance.infoBtnContainer.append(this.btnInstance.btn);
  }

  hideInfoBtn() {
    const parent = this.btnInstance.btn.parentNode;
    if (parent !== this.mapInstance.infoBtnContainer) return;

    this.mapInstance.infoBtnContainer.removeChild(this.btnInstance.btn);
  }

  updateInfoBtnToCurrentState() {
    if (!this.steps.includes(this.mapInstance.step)) {
      this.hideInfoBtn();
    } else {
      this.showInfoBtn();
    }
  }
}
