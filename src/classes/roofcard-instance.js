"use strict";

import { roofCardTemplateHTML } from "../components/roof-card.js";

export default class RoofCardInstance {
  constructor(roofInstance, mapInstance, manager) {
    this.map = mapInstance.map;
    this.mapInstance = mapInstance;
    this.roofInstance = roofInstance;
    // this.container = container;
    this.manager = manager;
    this.card = null;
    this.headline = null;
    this.roofAngle = null;
    this.moduleCount = null;
    this.totalPower = null;
    this.editBtn = null;
    this.hideBtn = null;
    this.deleteBtn = null;

    this.editBtnIsDisabled = false;

    this.createRoofCard();
  }

  createRoofCard() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(roofCardTemplateHTML, "text/html");

    this.card = doc.querySelector('[data-element="card"]');
    this.assignCardElements();
    this.appendRoofCard();
    this.bindEditClickHandler();
    this.bindHideClickHandler();
    this.bindDeleteClickHandler();
  }

  assignCardElements() {
    this.headline = this.card.querySelector("[data-element='headline']");
    this.roofAngle = this.card.querySelector("[data-element='roof-angle']");
    this.moduleCount = this.card.querySelector("[data-element='module-count']");
    this.totalPower = this.card.querySelector("[data-element='total-power']");
    this.editBtn = this.card.querySelector("[data-element='edit']");
    this.hideBtn = this.card.querySelector("[data-element='hide']");
    this.deleteBtn = this.card.querySelector("[data-element='delete']");
  }

  appendRoofCard() {
    if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;

    this.mapInstance.mainContentContainer.append(this.card);
  }

  bindEditClickHandler() {
    this.editBtn.addEventListener("click", () => {
      if (this.roofInstance.isHidden) return;

      if (this.roofInstance.isActive) {
        this.roofInstance.disableInstance();
      } else {
        this.roofInstance.enableInstance();
      }
    });
  }

  bindHideClickHandler() {
    this.hideBtn.addEventListener("click", () => {
      if(this.roofInstance.isHidden) {
        this.roofInstance.showInstance();
      } else {
        this.roofInstance.disableInstance();
        this.roofInstance.hideInstance();
      }
    });
  }

  bindDeleteClickHandler() {
    this.deleteBtn.addEventListener("click", () => {
      this.roofInstance.deleteInstance();
    });
  }
}
