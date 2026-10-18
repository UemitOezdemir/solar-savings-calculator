"use strict";

import AddNewRoofBtnInstance from "./add-new-roof-button-instance.js";

export default class AddNewRoofBtnManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.btnInstance = null;

    this.steps = {
      "roof-setup": {
        interaction: true,
      },
    };

    this.createAddNewRoofBtn();
  }

  createAddNewRoofBtn() {
    this.btnInstance = new AddNewRoofBtnInstance(this.mapInstance, this);
  }

  showAddNewRoofBtn() {
    const parent = this.btnInstance.btn.parentNode;
    if (parent === this.mapInstance.controlElementsContainer) return;

    this.mapInstance.controlElementsContainer.append(this.btnInstance.btn);
  }

  hideAddNewRoofBtn() {
    const parent = this.btnInstance.btn.parentNode;
    if (parent !== this.mapInstance.controlElementsContainer) return;

    this.mapInstance.controlElementsContainer.removeChild(this.btnInstance.btn);
  }

  enableAddNewRoofBtn() {
    this.btnInstance.isDisabled = false;
    this.btnInstance.btn.dataset.active = "false";
  }

  disableAddNewRoofBtn() {
    this.btnInstance.isDisabled = true;
    this.btnInstance.btn.dataset.active = "true";
  }

  updateAddNewRoofBtnToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideAddNewRoofBtn();
    } else {
      this.showAddNewRoofBtn();
      this.enableProgressBtn();
    }
  }

  enableProgressBtn() {
    if(this.mapInstance.roofInstances.length === 0) {
      this.mapInstance.setProgressBtnState("disable");
      return;
    };

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
}
