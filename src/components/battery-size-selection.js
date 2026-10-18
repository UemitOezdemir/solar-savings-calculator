const batterySizeSelectionTemplateHTML = `
          <fieldset data-element="battery-size-selection">
            <div class="battery-selection">
              <input data-element="selection" class="battery-selection__input" type="radio" id="battery-small" name="battery-size" value="">
              <label class="battery-selection-label" for="battery-small">
                <svg class="battery-icon" viewBox="0 0 100 100" aria-hidden="true">
                  <use href="#battery-icon"></use>
                </svg>
                <span data-battery-label="small">10 kWh</span>
              </label>
            </div>
            <div class="battery-selection">
              <input data-element="selection" class="battery-selection__input" type="radio" id="battery-medium" name="battery-size" value="">
              <label class="battery-selection-label" for="battery-medium">
                <svg class="battery-icon" viewBox="0 0 100 100" aria-hidden="true">
                  <use href="#battery-icon"></use>
                </svg>
                <span data-battery-label="medium">15 kWh</span>
              </label>
            </div>
            <div class="battery-selection">
              <input data-element="selection" class="battery-selection__input" type="radio" id="battery-large" name="battery-size" value="">
              <label class="battery-selection-label" for="battery-large">
                <svg class="battery-icon" viewBox="0 0 100 100" aria-hidden="true">
                  <use href="#battery-icon"></use>
                </svg>
                <span data-battery-label="large">20 kWh</span>
              </label>
            </div>
          </fieldset>`;

export { batterySizeSelectionTemplateHTML };
