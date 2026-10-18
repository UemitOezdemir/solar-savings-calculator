const annualConsumptionTemplateHTML = `    
    <div class="consumption-wrapper" data-element="consumption">
        <label class="consumption-label" id="consumption-label" for="consumption">
            Annual Electricity Consumption
        </label>
        <div class="consumption-input-wrapper">
            <input 
            class="consumption-input"
            type="number" 
            id="consumption" 
            name="consumption" 
            min="0" 
            step="1"
            required
            inputmode="numeric"
            aria-labelledby="consumption-label consumption-unit"
            aria-describedby="consumption-hilfe">
            <span id="consumption-unit" aria-hidden="true">kWh</span>
        </div>
        <p id="consumption-hilfe" class="consumption-helper-text">
            Enter your electricity usage in kilowatt-hours (kWh). You can find this on your most recent bill.
        </p>
    </div>`;

export { annualConsumptionTemplateHTML };
