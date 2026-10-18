const roofTypeSelectionTemplateHTML = `
          <fieldset data-element="roof-type-selection">
            <div class="roof-selection">
              <input data-element="selection" class="roof-selection__input" type="radio" id="gable-roof" name="roof-type" value="gable-roof">
              <label class="roof-selection-label" for="gable-roof">
                <svg class="roof-icon" viewBox="0 0 103 93" aria-hidden="true">
                  <use href="#gable-roof-icon"></use>
                </svg>
                <span>Gable</span>
              </label>
            </div>
            <div class="roof-selection">
              <input data-element="selection" class="roof-selection__input" type="radio" id="hip-roof" name="roof-type" value="hip-roof">
              <label class="roof-selection-label" for="hip-roof">
                <svg class="roof-icon" viewBox="0 0 103 93" aria-hidden="true">
                  <use href="#hip-roof-icon"></use>
                </svg>
                <span>Hip</span>
              </label>
            </div>
            <div class="roof-selection">
              <input data-element="selection" class="roof-selection__input" type="radio" id="pyramid-roof" name="roof-type" value="pyramid-hip">
              <label class="roof-selection-label" for="pyramid-roof">
                <svg class="roof-icon" viewBox="0 0 103 93" aria-hidden="true">
                  <use href="#pyramid-roof-icon"></use>
                </svg>
                <span>Pyramid</span>
              </label>
            </div>
            <div class="roof-selection">
              <input data-element="selection" class="roof-selection__input" type="radio" id="flat-roof" name="roof-type" value="flat">
              <label class="roof-selection-label" for="flat-roof">
                <svg class="roof-icon" viewBox="0 0 103 93" aria-hidden="true">
                  <use href="#flat-roof-icon"></use>
                </svg>
                <span>Flat</span>
              </label>
            </div>
            <div class="roof-selection">
              <input data-element="selection" class="roof-selection__input" type="radio" id="shed-roof" name="roof-type" value="shed">
              <label class="roof-selection-label" for="shed-roof" aria-hidden="true">
                <svg class="roof-icon" viewBox="0 0 103 93">
                  <use href="#shed-roof-icon"></use>
                </svg>
                <span>Shed</span>
              </label>
            </div>
          </fieldset>`;

export { roofTypeSelectionTemplateHTML };
