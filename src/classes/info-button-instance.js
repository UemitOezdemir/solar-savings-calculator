"use strict";

import { infoButtonTemplateHTML } from "../components/info-button.js";

export default class InfoButtonInstance {
  constructor(mapInstance, manager) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    this.btn = null;

    this.createAddNewRoofBtn();

    this.bindClickEventHandler();
  }

  createAddNewRoofBtn() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(infoButtonTemplateHTML, "text/html");

    this.btn = doc.querySelector('[data-element="info-btn"]');
    this.appendInfoBtn();
  }

  appendInfoBtn() {
    if (!this.manager.steps.includes(this.mapInstance.step)) return;

    this.mapInstance.infoBtnContainer.append(this.btn);
  }

  bindClickEventHandler() {
    this.btn.addEventListener("click", () => {
      document.getElementById(this.btn.dataset.dialogOpen).showModal();
      //   if (this.isDisabled) return;

      //   this.mapInstance.createRoofInstance();
      //   this.mapInstance.startMarkingMode();
      //   this.mapInstance.setProgressBtnState("disable");
    });
  }
}
