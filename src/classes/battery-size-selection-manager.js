"use strict";

import { batterySizeSelectionTemplateHTML } from "../components/battery-size-selection.js";
import BatterySizeSelectionInstance from "./battery-size-selection-instance.js";

export default class BatterySizeSelectionManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.batterySizeSelectionParentNode = null;

    this.roundToKwh = 5;

    this.allSelections = [];

    this.steps = {
      "battery-size-selection": {
        interaction: true,
      },
    };

    this.createBatterySizeSelection();
  }

  createBatterySizeSelection() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(batterySizeSelectionTemplateHTML, "text/html");
    this.batterySizeSelectionParentNode = doc.querySelector(
      '[data-element="battery-size-selection"]',
    );

    const selectionsArr = this.batterySizeSelectionParentNode.querySelectorAll(".battery-selection");

    selectionsArr.forEach((selection) => {
      this.input = selection.querySelector("input");
      this.label = selection.querySelector("[data-battery-label]");

      const selectionInstance = new BatterySizeSelectionInstance(
        this.mapInstance,
        this.input,
        this.label,
      );

      this.allSelections.push(selectionInstance);
    });

    this.appendBatterySizeSelection();
  }

  appendBatterySizeSelection() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) return;

    this.mapInstance.mainContentContainer.append(this.batterySizeSelectionParentNode);
  }

  showBatterySizeSelection() {
    const parent = this.batterySizeSelectionParentNode.parentNode;
    if (parent === this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.append(this.batterySizeSelectionParentNode);

    this.setBatterySizeRecommendation();

    // this.triggerAPICall();
  }

  hideBatterySizeSelection() {
    const parent = this.batterySizeSelectionParentNode.parentNode;
    if (parent !== this.mapInstance.mainContentContainer) return;

    this.mapInstance.mainContentContainer.removeChild(this.batterySizeSelectionParentNode);
  }

  updateBatterySizeSelectionToCurrentState() {
    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideBatterySizeSelection();
    } else {
      this.showBatterySizeSelection();
      if (this.mapInstance.selectedBatterySize) {
        this.mapInstance.setProgressBtnState("enable");
      }
    }
  }

  setBatterySizeRecommendation() {
    const totalSystemPower = this.calcTotalPower();

    const batterySizes = {
      small: this.roundBatterySize(totalSystemPower / 2),
      medium: this.roundBatterySize(totalSystemPower),
      large: this.roundBatterySize(totalSystemPower * 1.5),
    };

    this.allSelections.forEach((selection) => {
      const label = selection.label;
      const input = selection.input;

      label.textContent = `${batterySizes[label.dataset.batteryLabel]} kWh`;
      input.value = batterySizes[label.dataset.batteryLabel];
    });
  }

  roundBatterySize(size) {
    const rounded = Math.round(size / this.roundToKwh) * this.roundToKwh;
    return Math.max(this.roundToKwh, rounded);
  }

  calcTotalPower() {
    let totalSystemPower = 0;

    this.mapInstance.roofInstances.forEach((roof) => {
      const moduleManager = roof.moduleManager;
      totalSystemPower += moduleManager.allModules.length * moduleManager.modulePower;
    });

    return totalSystemPower / 1000;
  }

  // triggerAPICall() {
  //   let globalGenerationProfile = [];
  //   async function calculateSolarYield() {
  //     const lat = 47.66;
  //     const lon = 9.47;
  //     const roofs = [
  //       { kwp: 6.0, slope: 35, azimuth: 0 },
  //       { kwp: 4.5, slope: 30, azimuth: -90 },
  //     ];

  //     try {
  //       const response = await fetch("http://localhost:3000/api/calculate-hourly-roofs", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ lat, lon, roofs }),
  //       });

  //       const data = await response.json();

  //       if (data.success) {

  //         console.log(data);
  //         alert("PV-Daten erfolgreich berechnet!");
  //       } else {
  //         console.error("Server-Fehler:", data.error);
  //       }
  //     } catch (error) {
  //       console.error("Netzwerkfehler zum Backend:", error);
  //     }
  //   }
  //   calculateSolarYield();
  // }
}
