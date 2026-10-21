"use strict";

import { annualConsumptionTemplateHTML } from "../components/annual-consumption.js";

export default class InfoButtonInstance {
  constructor(mapInstance, manager) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    this.inputWrapper = null;
    this.input = null;

    this.createAnnualConsumtionInput();

    this.bindInputEventHandler();
  }

  createAnnualConsumtionInput() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(annualConsumptionTemplateHTML, "text/html");

    this.inputWrapper = doc.querySelector('[data-element="consumption"]');
    this.input = doc.querySelector('[data-element="consumption-input"]');
    this.appendAnnualConsumtionInput();
  }

  appendAnnualConsumtionInput() {
    if (!this.manager.steps.includes(this.mapInstance.step)) return;

    this.mapInstance.mainContentContainer.append(this.inputWrapper);
  }

  bindInputEventHandler() {
    this.input.addEventListener("input", () => {
      if (this.input.value.length === 0) {
        this.mapInstance.setProgressBtnState("disable");
        this.mapInstance.annualConsumption = null;
      } else {
        this.mapInstance.setProgressBtnState("enable");
        this.mapInstance.annualConsumption = parseFloat(this.input.value);
      }
    });
  }
}
