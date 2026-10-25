"use strict";

import { instructionDialog } from "../components/instruction-dialog.js";
import InstructionDialogInstance from "./instruction-dialog-instance.js";

export default class InfoButtonManager {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;

    this.allInstructionDialogInstances = [];

    this.steps = [];

    this.createInstructionDialog();
  }

  createInstructionDialog() {
    instructionDialog.forEach((dialogTemplateHTML) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(dialogTemplateHTML, "text/html");
      const dialogContent = doc.querySelector('[data-element="instruction"]');

      this.steps.push(dialogContent.dataset.step);

      const dialogInstance = new InstructionDialogInstance(
        this.mapInstance,
        this,
        dialogContent,
      );
      this.allInstructionDialogInstances.push(dialogInstance);
    });
  }

  showInstructionDialog() {
    this.mapInstance.instructionContainer.innerHTML = "";

    const currInstruction = this.allInstructionDialogInstances.find((instance) => instance.step === this.mapInstance.step);
    currInstruction.updateRoofIcon();

    this.mapInstance.instructionContainer.append(currInstruction.dialogContent);
    this.mapInstance.instructionContainer.showModal()
  }

  updateInstructionDialogToCurrentState() {
    if (this.steps.includes(this.mapInstance.step)) this.showInstructionDialog();
  }
}
