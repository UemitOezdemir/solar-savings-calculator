"use strict";

import RoofCardInstance from "./roofcard-instance.js";

export default class RoofCardManager {
  constructor(roofInstance, mapInstance) {
    this.map = mapInstance.map;
    this.mapInstance = mapInstance;
    this.roofInstance = roofInstance;
    this.roofCard = null;

    this.steps = {
      "roof-setup": {
        interaction: true,
      },
      "roof-edge-selection": {
        interaction: true,
      },
      "module-setup": {
        interaction: true,
      },
    };
  }

  createRoofCard() {
    this.roofCard = new RoofCardInstance(this.roofInstance, this.mapInstance, this);

    this.updateRoofCardValues();
  }

  updateRoofCardValues() {
    const { name, angles, moduleManager } = this.roofInstance;
    const { headline, roofAngle, moduleCount, totalPower } = this.roofCard;

    headline.textContent = name;
    roofAngle.textContent = angles[roofAngle.dataset.element];
    moduleCount.textContent = moduleManager.allModules.length;
    totalPower.textContent = (moduleManager.allModules.length * moduleManager.modulePower) / 1000;
  }

  updateCtrlBtnState() {
    if (this.roofInstance.isHidden) {
      this.roofCard.editBtn.dataset.active = "false";
      this.roofCard.editBtn.disabled = true;
      this.roofCard.hideBtn.dataset.active = "true";
      return;
    }

    if (!this.roofInstance.isActive) {
      this.roofCard.editBtn.dataset.active = "false";
      this.roofCard.editBtn.disabled = false;
      this.roofCard.hideBtn.dataset.active = "false";
      return;
    }

    if (this.roofInstance.isActive) {
      this.roofCard.editBtn.dataset.active = "true";
      this.roofCard.editBtn.disabled = false;
      this.roofCard.hideBtn.dataset.active = "false";
    }
  }

  showCardInstance() {
    if (!this.roofCard) return;

    const parent = this.roofCard.card.parentNode;
    if (parent === this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.append(this.roofCard.card);
  }

  hideCardInstance() {
    if (!this.roofCard) return;

    const parent = this.roofCard.card.parentNode;
    if (parent !== this.mapInstance.mainContentContainer) return;
    this.mapInstance.mainContentContainer.removeChild(this.roofCard.card);
  }

  disableCardInstances() {
    if (!this.roofCard) return;

    this.roofCard.card.dataset.active = "false";
    this.updateCtrlBtnState();
  }

  enableCardInstances() {
    if (!this.roofCard) return;

    this.roofCard.card.dataset.active = "true";
    this.updateCtrlBtnState();
  }

  deleteRoofCardInstance() {
    if (!this.roofCard) return;

    const parent = this.roofCard.card.parentNode;
    if (parent !== this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.removeChild(this.roofCard.card);

    this.roofCard = null;
  }

  updateRoofCardInstanceToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideCardInstance();
    } else {
      this.showCardInstance();
    }
  }

  updateNameOnRoofCard() {
    this.roofCard.headline.textContent = this.roofInstance.name;
  }
}
