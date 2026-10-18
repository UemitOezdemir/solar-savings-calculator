const roofCardTemplateHTML = `
    <div class="roof-card" data-active="true" data-element="card">
      <div class="roof-card__content">
        <h4 class="roof-card__headline" data-element="headline">Roof 1</h4>
        <div class="roof-card__description">
          <div class="roof-card__angle-wrapper" aria-label="Dachwinkel">
            <svg class="roof-card__angle-icon">
              <use href="#roof-angle-icon"></use>
            </svg>
            <span class="roof-card__angle" data-element="roof-angle">0</span>
            <span>°</span>
          </div>
          <div class="roof-card__module-count-wrapper" aria-label="Anzahl der Module">
            <svg class="roof-card__module-count-icon">
              <use href="#solar-module-icon"></use>
            </svg>
            <span class="roof-card__module-count" data-element="module-count">0</span>
            <span>pc</span>
          </div>
          <div class="roof-card__module-count-wrapper" aria-label="Anzahl der Module">
            <svg class="roof-card__total-power-icon">
              <use href="#solar-power-total-icon"></use>
            </svg>
            <span class="roof-card__module-count" data-element="total-power">0</span>
            <span>kWp</span>
          </div>
        </div>
      </div>
      <div class="roof-card__btn-container">
        <button data-active="true" class="roof-card__control-btn" type="button" data-element="edit" title="Edit roof setup" aria-label="Edit roof setup">
          <svg class="roof-card__btn-icon" xmlns="http://www.w3.org" aria-hidden="true">
            <use href="#pen-icon"></use>
          </svg>
        </button>
        <button data-active="false" class="roof-card__control-btn" type="button" data-element="hide" title="Hide roof setup" aria-label="Hide roof setup">
          <svg viewBox="15 35 170 130" class="roof-card__btn-icon" xmlns="http://www.w3.org" aria-hidden="true">
            <path d="M 20 100 C 50 40, 150 40, 180 100 C 150 160, 50 160, 20 100 Z" mask="url(#global-eye-mask)" />
          </svg>
        </button>
        <button data-active="false" class="roof-card__control-btn" type="button" data-element="delete" title="Delete roof setup" aria-label="Delete roof setup">
          <svg class="roof-card__btn-icon" xmlns="http://www.w3.org" aria-hidden="true">
            <use href="#bin-icon"></use>
          </svg>
        </button>
      </div>
    </div>`;

export { roofCardTemplateHTML }
