"use strict";

import AngleSliderInstance from "./angle-slider-instance.js";

export default class AngleSliderManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.allAngleSlider = [];

    this.angleOptions = [
      {
        type: "roof-angle",
        title: "Roof Angle",
        startAngle: 30,
        minValue: 0,
        maxValue: 50,
        step: 0.5,
      },
      {
        type: "distortion-angle",
        title: "Distortion Angle",
        startAngle: 0,
        minValue: -45,
        maxValue: 45,
        step: 0.5,
      },
    ];

    this.steps = {
      "module-setup": {
        interaction: true,
      },
    };

    this.createAngleSlider();
  }

  createAngleSlider() {
    this.angleOptions.forEach((options) => {
      const angleSliderInstance = new AngleSliderInstance(this.mapInstance, this, options);
      this.allAngleSlider.push(angleSliderInstance);
    });
  }

  setRoofInstanceValuesToAngleSlider() {
    this.allAngleSlider.forEach((sliderInstance) => {
      const roofInstance = this.mapInstance.activeRoofInstance;
      const angleType = sliderInstance.angleType;

      sliderInstance.value = roofInstance.angles[angleType];
      sliderInstance.setNewValueToSlider();
    });
  }

  showSliderControls() {
    this.allAngleSlider.forEach((sliderInstance) => {
      const parent = sliderInstance.sliderElement.parentNode;
      if (parent === this.mapInstance.controlElementsContainer) return;

      this.mapInstance.controlElementsContainer.append(sliderInstance.sliderElement);
    });
  }

  hideSliderControls() {
    this.allAngleSlider.forEach((sliderInstance) => {
      const parent = sliderInstance.sliderElement.parentNode;
      if (parent !== this.mapInstance.controlElementsContainer) return;
      this.mapInstance.controlElementsContainer.removeChild(sliderInstance.sliderElement);
    });
  }

  disableSliderControls() {
    this.allAngleSlider.forEach((sliderInstance) => {
      sliderInstance.sliderInput.disabled = true;
      sliderInstance.increaseBtn.disabled = true;
      sliderInstance.decreaseBtn.disabled = true;
    });
  }

  enableSliderControls() {
    this.allAngleSlider.forEach((sliderInstance) => {
      sliderInstance.sliderInput.disabled = false;
      sliderInstance.increaseBtn.disabled = false;
      sliderInstance.decreaseBtn.disabled = false;
    });
  }

  updateSliderControlsToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideSliderControls();
    } else {
      this.showSliderControls();
    }
  }
}
