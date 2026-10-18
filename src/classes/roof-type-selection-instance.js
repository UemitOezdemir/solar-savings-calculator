"use strict";

export default class RoofTypeSelectionInstance {
  constructor(mapInstance, input) {
    this.mapInstance = mapInstance;
    this.input = input;

    this.bindClickEvent();
  }

  bindClickEvent() {
    this.input.addEventListener("click", () => {
      this.enableProgressBtn();
      this.mapInstance.selectedRoofType = this.input.id;
    });
  }

  enableProgressBtn() {
    this.mapInstance.setProgressBtnState("enable");
  }
}