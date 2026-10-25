const roofSetupInstructionDialogTemplateHTML = `
    <form method="dialog" data-element="instruction" data-step="roof-setup">
        <h2 id="instruction-note-titel" class="info-dialog__headline">Instruction</h2>
        <p>Mark the sides of the roof where the PV modules are to be installed.</p>
        <ol role="list" class="info-dialog__steps-list">
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>
              Start the mark-out mode by clicking the
              <span style="display: inline-block;">
                <span class="selection__body-start-marking-btn">
                  <svg class="selection__body-start-marking-btn-icon" aria-hidden="true">
                    <use href="#plus-icon"></use>
                  </svg>
                  <span>Add new roof</span>
                </span>
              </span>
              button.
            </span>
          </li>
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Select the corner points of the desired roof side that will be covered with PV modules. You can exclude larger dormers. You can adjust the marker positions by dragging them.</span>
            <svg class="info-dialog__roof-icon mark-out" data-element="roof-icon">
              <use href="#gable-roof-icon"></use>
            </svg>
          </li>
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Repeat these steps to mark out multiple roof surfaces.</span>
          </li>
        </ol>
        <button class="info-dialog__close-btn">Got it !</button>
    </form>`;

const roofEdgeSelectionInstructionDialogTemplateHTML = `
    <form method="dialog" data-element="instruction" data-step="roof-edge-selection">
        <h2 id="instruction-note-titel" class="info-dialog__headline">Instruction</h2>
        <p>Select the edge of your roof as shown in the illustration. This edge is used to determine the south-facing orientation (azimuth). In the next step, the PV modules will be aligned along this edge.</p>
        <svg class="info-dialog__roof-icon roof-edge-selection" data-element="roof-icon">
            <use href="#gable-roof-icon"></use>
        </svg>
        <button class="info-dialog__close-btn">Got it !</button>
    </form>`;

const moduleSetupInstructionDialogTemplateHTML = `
    <form method="dialog" data-element="instruction" data-step="module-setup">
        <h2 id="instruction-note-titel" class="info-dialog__headline">Instruction</h2>
        <p>Adjust the settings using the sliders:</p>
        <ol role="list" class="info-dialog__steps-list">
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Adjust your roof angle so that the PV modules are displayed correctly and the system output can be calculated accurately.</span>
          </li>
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Adjust the aerial image distortion so that the orientation of the PV modules matches that of your roof.</span>
          </li>
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Adjust the layout of the solar panels to fit your roof. Remove individual panels to make room for skylights, dormers, or similar features. You can remove and add panels by clicking on them.</span>
            <img class="info-dialog__roof-icon mark-out" src="./src/img/remove-module.gif">
          </li>
          <li role="listitem" class="info-dialog__steps-list-item">
            <span>Repeat these steps to mark out multiple roof surfaces.</span>
          </li>
        </ol>
        <button class="info-dialog__close-btn">Got it !</button>
    </form>`;

const instructionDialog = [ roofSetupInstructionDialogTemplateHTML, roofEdgeSelectionInstructionDialogTemplateHTML, moduleSetupInstructionDialogTemplateHTML ]

export { instructionDialog } ;
