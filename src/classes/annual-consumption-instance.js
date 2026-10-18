"use strict";

import { annualConsumptionTemplateHTML } from "../components/annual-consumption.js";

export default class RoofCardInstance {
  constructor(mapInstance, manager) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    this.parentContainer = null;
    this.input = null;

    this.createConsumptionInput();
  }

  createConsumptionInput() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(annualConsumptionTemplateHTML, "text/html");

    this.card = doc.querySelector('[data-element="consumption"]');
    // this.assignCardElements();
    this.appendRoofCard();
    this.bindEditClickHandler();
    // this.bindEditClickHandler();
    // this.bindHideClickHandler();
    // this.bindDeleteClickHandler();
  }

//   assignCardElements() {
//     this.headline = this.card.querySelector("[data-element='headline']");
//     this.roofAngle = this.card.querySelector("[data-element='roof-angle']");
//     this.moduleCount = this.card.querySelector("[data-element='module-count']");
//     this.totalPower = this.card.querySelector("[data-element='total-power']");
//     this.editBtn = this.card.querySelector("[data-element='edit']");
//     this.hideBtn = this.card.querySelector("[data-element='hide']");
//     this.deleteBtn = this.card.querySelector("[data-element='delete']");
//   }

  appendRoofCard() {
    if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;

    this.mapInstance.mainContentContainer.append(this.card);
  }

//   bindEditClickHandler() {
//     this.editBtn.addEventListener("click", () => {
//       if (this.roofInstance.isHidden) return;

//       if (this.roofInstance.isActive) {
//         this.roofInstance.disableInstance();
//       } else {
//         this.roofInstance.enableInstance();
//       }
//     });
//   }

//   bindHideClickHandler() {
//     this.hideBtn.addEventListener("click", () => {
//       if(this.roofInstance.isHidden) {
//         this.roofInstance.showInstance();
//       } else {
//         this.roofInstance.disableInstance();
//         this.roofInstance.hideInstance();
//       }
//     });
//   }

//   bindDeleteClickHandler() {
//     this.deleteBtn.addEventListener("click", () => {
//       this.roofInstance.deleteInstance();
//     });
//   }
}
