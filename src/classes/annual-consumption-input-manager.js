"use strict";

import AnnualConsumptionInputInstance from "./annual-consumption-input-instance.js";

export default class AnnualConsumptionInputManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;

    this.inputInstance = null;

    this.steps = ["annual-consumption"];

    this.createAnnualConsumptionInput();
  }
  
    createAnnualConsumptionInput() {
      this.inputInstance = new AnnualConsumptionInputInstance(this.mapInstance, this);
    }
  
    showAnnualConsumptionInput() {
      const parent = this.inputInstance.inputWrapper.parentNode;
      if (parent === this.mapInstance.controlElementsContainer) return;
  
      this.mapInstance.mainContentContainer.append(this.inputInstance.inputWrapper);
    }
  
    hideAnnualConsumptionInput() {
      const parent = this.inputInstance.inputWrapper.parentNode;
      if (parent !== this.mapInstance.mainContentContainer) return;
  
      this.mapInstance.mainContentContainer.removeChild(this.inputInstance.inputWrapper);
    }
  
    updateAnnualConsumptionInputToCurrentState() {
      if (!this.steps.includes(this.mapInstance.step)) {
        this.hideAnnualConsumptionInput();
      } else {
        this.showAnnualConsumptionInput();
      }
    }
}
