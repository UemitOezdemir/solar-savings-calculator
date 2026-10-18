"use strict";

import ModuleInstance from "./module-instance.js";
import { determineRoofEdgeHeading, generateValidModules } from "./helper-functions.js";

export default class ModuleManager {
  constructor(mapInstance, roofInstance) {
    this.mapInstance = mapInstance;
    this.map = mapInstance.map;
    this.roofInstance = roofInstance;
    this.allModules = [];
    this.deselectedModules = [];

    // Module Spec.
    this.moduleWidth = 1.13;
    this.moduleHeight = 1.76;
    this.modulePower = 440;
    this.moduleLoss = 14;

    // Module Color when disabled
    this.disabled = {
      colorActive: "#a0a0a0",
      colorInactive: "transparent",
      pane: "modules-to-back",
      interactive: false,
    };

    // Polygon colors & options for steps
    this.steps = {
      "module-setup": {
        colorActive: "#122B4E",
        colorInactive: "transparent",
        pane: "modules-to-front",
        interactive: true,
      },
    };
  }

  createModules() {
    this.deleteModules();

    const {
      polylineManager,
      polylineManager: { selectedRoofEdge },
      polygonManager,
      polygonManager: { polygon },
      angles,
    } = this.roofInstance;

    const { heading, start, end } = determineRoofEdgeHeading(
      polylineManager,
      polygonManager,
      angles["azimuth"],
      selectedRoofEdge,
      polygon.instance,
    );

    const modulesLatLngs = generateValidModules(
      polygonManager.polygon.instance,
      start,
      end,
      heading,
      angles["roof-angle"],
      angles["distortion-angle"],
      this.moduleWidth,
      this.moduleHeight,
    );

    modulesLatLngs.forEach((latLngs) => {
      const module = new ModuleInstance(this.mapInstance, this.roofInstance, this, latLngs);

      this.allModules.push(module);
    });
  }

  deleteModules() {
    if (this.allModules.length === 0 && this.deselectedModules.length === 0) return;

    this.allModules.forEach((module) => module.instance.remove());
    this.deselectedModules.forEach((module) => {
      module.instance.remove();
    });

    this.allModules = [];
    this.deselectedModules = [];
  }

  hideModules() {
    this.allModules.forEach((mod) => mod.instance.remove());
    this.deselectedModules.forEach((mod) => mod.instance.remove());
  }

  showModules() {
    this.allModules.forEach((mod) => mod.instance.addTo(this.map));
    this.deselectedModules.forEach((mod) => mod.instance.addTo(this.map));
  }

  disableModules() {
    this.allModules.forEach((module) => {
      module.instance.options.interactive = this.disabled.interactive;
      module.instance.options.pane = this.disabled.pane;
      module.instance.setStyle({ fillColor: this.disabled.colorActive });
    });
    this.deselectedModules.forEach((module) => {
      module.instance.options.interactive = this.disabled.interactive;
      module.instance.options.pane = this.disabled.pane;
      module.instance.setStyle({ fillColor: this.disabled.colorInactive });
    });
    this.hideModules();
    this.showModules();
  }

  enableModules() {
    const currStep = this.steps[this.mapInstance.step];

    this.allModules.forEach((module) => {
      module.instance.options.interactive = currStep.interactive;
      module.instance.options.pane = currStep.pane;
      module.instance.setStyle({ fillColor: currStep.colorActive });
    });
    this.deselectedModules.forEach((module) => {
      module.instance.options.interactive = currStep.interactive;
      module.instance.options.pane = currStep.pane;
      module.instance.setStyle({ fillColor: currStep.colorInactive });
    });
    this.hideModules();
    this.showModules();
  }

  setModuleColorToCurrentState() {
    if (this.allModules.length === 0 && this.deselectedModules.length === 0) return;

    if (!Object.hasOwn(this.steps, this.mapInstance.step)) {
      this.hideModules();
      return;
    }

    if (this.roofInstance.isHidden) {
      this.hideModules();
      return;
    }

    if (!this.roofInstance.isActive) {
      this.disableModules();
    } else {
      this.enableModules();
    }

    this.roofInstance.roofCardManager.updateRoofCardValues();

    if (this.allModules.length > 0) this.mapInstance.setProgressBtnState("enable");
  }
}
