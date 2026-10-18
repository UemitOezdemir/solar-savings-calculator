"use strict";

export default class BatterySizeSelectionInstance {
  constructor(mapInstance, input, label) {
    this.mapInstance = mapInstance;
    this.input = input;
    this.label = label;

    this.bindClickEvent();
  }

  bindClickEvent() {
    this.input.addEventListener("click", () => {
      this.enableProgressBtn();
      this.mapInstance.selectedBatterySize = this.input.value;
    });
  }

  enableProgressBtn() {
    this.mapInstance.setProgressBtnState("enable");
  }
}
