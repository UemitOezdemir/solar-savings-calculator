"use strict";

import {
  nextButtonTemplateHTML,
  previousButtonTemplateHTML,
} from "../components/progress-buttons.js";
import ProgressButtonInstance from "./progress-button-instance.js";

export default class ProgressButtonManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;

    this.stepCounter = 0;

    this.allProgressBtns = [];

    this.steps = {
      "roof-type-selection": {
        previous: { interaction: false },
        next: { interaction: true },
        headline: "Select Roof Type"
      },
      "roof-setup": {
        previous: { interaction: true },
        next: { interaction: true },
        headline: "Mark out the roof area"
      },
      "roof-edge-selection": {
        previous: { interaction: true },
        next: { interaction: true },
        headline: "Select roof edge"
      },
      "module-setup": {
        previous: { interaction: true },
        next: { interaction: true },
        headline: "Setup Modules"
      },
      "battery-size-selection": {
        previous: { interaction: true },
        next: { interaction: true },
        headline: "Select Battery Size"
      },
      "annual-consumption": {
        previous: { interaction: true },
        next: { interaction: true },
        headline: "Annual electricity consumption"
      },
    };

    this.updateCurrentStep();
    this.createButtons();
  }

  updateCurrentStep() {
    const currStep =  Object.keys(this.steps)[this.stepCounter];
    this.mapInstance.step = currStep;

    this.updateHeadlineToCurrentStep();
  }

  updateHeadlineToCurrentStep() {
    this.mapInstance.headline.textContent = this.steps[this.mapInstance.step].headline;
    this.mapInstance.progressCounter.textContent = `${this.stepCounter + 1} / ${Object.keys(this.steps).length}`
  }

  createButtons() {
    const prevBtnInstance = new ProgressButtonInstance(
      this.mapInstance,
      this,
      previousButtonTemplateHTML,
    );
    const nextBtnInstance = new ProgressButtonInstance(
      this.mapInstance,
      this,
      nextButtonTemplateHTML,
    );

    this.allProgressBtns.push(prevBtnInstance, nextBtnInstance);
  }

  showProgressBtns() {
    const step = this.steps[this.mapInstance.step];
    this.allProgressBtns.forEach((btnInstance) => {
      const btn = btnInstance.btn;
      const direction = btn.dataset.direction;
      if (step[direction].interaction) {
        btn.style.display = "block";
      } else {
        btn.style.display = "none";
      }
    });
  }

  hideProgressBtns() {
    this.allProgressBtns.forEach((btnInstance) => {
      const btn = btnInstance.btn.style.display = "none";
    });
  }

  enableNextBtn() {
    const nextBtnInstance = this.allProgressBtns.find(
      (btnInstance) => btnInstance.btn.dataset.direction === "next",
    );
    nextBtnInstance.btn.disabled = false;
    nextBtnInstance.btnDisabled = false;
  }

  disableNextBtn() {
    const nextBtnInstance = this.allProgressBtns.find(
      (btnInstance) => btnInstance.btn.dataset.direction === "next",
    );
    nextBtnInstance.btn.disabled = true;
    nextBtnInstance.btnDisabled = true;
  }

  updateProgressBtnsToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideProgressBtns();
    } else {
      this.showProgressBtns();
    }
  }

  restart() {
    this.stepCounter = 0;
    this.updateCurrentStep();
  }
}
