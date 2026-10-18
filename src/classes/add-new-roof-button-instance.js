"use strict";

import { addNewRoofBtnTemplateHTML } from "../components/add-new-roof-btn.js";

export default class AddNewRoofBtnInstance {
  constructor(mapInstance, manager) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    this.btn = null;
    this.isDisabled = false;

    this.createAddNewRoofBtn();

    this.bindClickEventHandler();
  }

  createAddNewRoofBtn() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(addNewRoofBtnTemplateHTML, "text/html");

    this.btn = doc.querySelector("button");
    this.appendAddNewRoofBtn();
  }

  appendAddNewRoofBtn() {
    if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;

    this.mapInstance.controlElementsContainer.append(this.btn);
  }

  bindClickEventHandler() {
    this.btn.addEventListener("click", () => {
      if (this.isDisabled) return;

      this.mapInstance.createRoofInstance();
      this.mapInstance.startMarkingMode();
      this.mapInstance.setProgressBtnState("disable");
    });
  }
}