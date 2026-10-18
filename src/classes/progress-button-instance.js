"use strict";

export default class ProgressButtonInstance {
  constructor(mapInstance, manager, buttonTemplateHTML) {
    this.mapInstance = mapInstance;
    this.manager = manager;
    this.buttonTemplateHTML = buttonTemplateHTML;
    this.btn = null;
    this.btnDisabled = null;

    this.createProgressBtn();

    this.bindClickEvent();
  }

  createProgressBtn() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.buttonTemplateHTML, "text/html");

    this.btn = doc.querySelector('[data-element="progress-btn"]');
    this.btnDisabled = Boolean(this.btn.disabled);

    this.appendProgressButton();
  }

  appendProgressButton() {
    if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;    
    
    const step = this.manager.steps[this.mapInstance.step]
    const btnOption = step[this.btn.dataset.direction];

    if(!btnOption.interaction) {
      this.btn.style.display = "none" ;
    } else {
      this.btn.style.display = "block" ;
    }

    this.mapInstance.progressBtnContainer.append(this.btn);
  }

  bindClickEvent() {
    this.btn.addEventListener("click", () => {
      if(this.btnDisabled) return;

      if(this.btn.dataset.direction === "next") {
        this.manager.stepCounter += 1;
        this.manager.disableNextBtn();
      } else if(this.btn.dataset.direction === "previous") {
        this.manager.stepCounter -= 1;
      }

      this.manager.updateCurrentStep();
      this.mapInstance.updateStateToCurrentStep();
    });
  }
}