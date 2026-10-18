"use strict";

import { angleSliderTemplateHTML } from "../components/angle-slider.js";

export default class AngleSliderInstance {
  constructor(mapInstance, manager, options) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    // Slider container
    this.sliderElement = null;
    // Slider control elements
    this.sliderInput = null;
    this.increaseBtn = null;
    this.decreaseBtn = null;
    // Slider elements to display values
    this.titleElement = null;
    this.angleElement = null;
    // SLider start value
    this.startValue = options.startAngle;
    // Slider value
    this.value = options.startAngle;
    this.min = options.minValue;
    this.max = options.maxValue;
    this.step = options.step;
    // Slider angle type ( roof angle / distortion angle )
    this.angleType = options.type;
    // Slider title which is the angle type
    this.title = options.title;

    this.createAngleSlider();
    this.setIncreaseHandler();
    this.setDecreaseHandler();
    this.setInputHandler();
  }

  createAngleSlider() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(angleSliderTemplateHTML, "text/html");

    this.sliderElement = doc.querySelector('[data-element="slider"]');
    this.assignSliderElements();
    this.setHTMLAttributes();
    this.appendAngleSlider();
  }

  assignSliderElements() {
    this.sliderInput = this.sliderElement.querySelector("input");
    this.increaseBtn = this.sliderElement.querySelector('[data-element="increase-btn"]');
    this.decreaseBtn = this.sliderElement.querySelector('[data-element="decrease-btn"]');
    this.titleElement = this.sliderElement.querySelector('[data-element="title"]');
    this.titleElement.textContent = this.title;
    this.angleElement = this.sliderElement.querySelector('[data-element="angle"]');
    this.angleElement.textContent = this.value;
  }

  setHTMLAttributes() {
    this.sliderElement.querySelector("label").setAttribute("for", this.angleType);
    this.sliderInput.setAttribute("name", this.angleType);
    this.sliderInput.setAttribute("min", this.min);
    this.sliderInput.setAttribute("max", this.max);
    this.sliderInput.setAttribute("value", this.value);
    this.sliderInput.setAttribute("step", this.step);
    this.sliderInput.id = this.angleType;

  }

  appendAngleSlider() {
    if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;

    this.mapInstance.controlElementsContainer.append(this.sliderElement);
  }

  setIncreaseHandler() {
    this.increaseBtn.addEventListener("click", () => {
      if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;
      if (!this.mapInstance.activeRoofInstance) return;
      if (this.value === this.max) return;

      this.value += +this.step;
      this.setNewValueToSlider();
      this.setNewValuesToRoofInstance();
      this.setNewValuesToRoofCards();
      this.recreateModules();
    });
  }

  setDecreaseHandler() {
    this.decreaseBtn.addEventListener("click", () => {
      if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;
      if (!this.mapInstance.activeRoofInstance) return;
      if (this.value === this.min) return;

      this.value -= +this.step;
      this.setNewValueToSlider();
      this.setNewValuesToRoofInstance();
      this.setNewValuesToRoofCards();
      this.recreateModules();
    });
  }

  setInputHandler() {
    this.sliderInput.addEventListener("input", () => {
      if (!Object.hasOwn(this.manager.steps, this.mapInstance.step)) return;
      if (!this.mapInstance.activeRoofInstance) return;

      this.value = +this.sliderInput.value;
      this.setNewValueToSlider();
      this.setNewValuesToRoofInstance();
      this.setNewValuesToRoofCards();
      this.recreateModules();
    });
  }

  recreateModules() {
    this.mapInstance.activeRoofInstance.moduleManager.createModules();
  }

  setNewValueToSlider() {
    this.sliderInput.value = this.value;
    this.angleElement.textContent = this.value;
  }

  setNewValuesToRoofInstance() {
    this.mapInstance.activeRoofInstance.angles[this.angleType] = this.value;
  }

  setNewValuesToRoofCards() {
    this.mapInstance.activeRoofInstance.roofCardManager.updateRoofCardValues();
  }
}
