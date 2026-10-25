"use strict";

export default class InstructionDialogInstance {
  constructor(mapInstance, manager, dialogContent) {
    this.mapInstance = mapInstance;
    this.manager = manager;

    this.dialogContent = dialogContent;
    this.roofIcon = null;

    this.step = null;

    this.createInstructionDialog();
  }

  createInstructionDialog() {
    this.roofIcon = this.dialogContent.querySelector('[data-element="roof-icon"]');
    this.step = this.dialogContent.dataset.step;

    this.appendInstructionDialog();
  }

  appendInstructionDialog() {
    if (!this.manager.steps.includes(this.mapInstance.step)) return;

    this.mapInstance.infoBtnContainer.append(this.btn);
  }

  updateRoofIcon() {
    if(!this.roofIcon) return;

    const useTag = this.roofIcon.querySelector("use");
    useTag.setAttribute("href", `#${this.mapInstance.selectedRoofType}-icon`);
  }
}
