import React from 'react';

function SettingsPanel({
  numTokens,
  setNumTokens,
  temperature,
  setTemperature,
  topP,
  setTopP,
  frequencyPenalty,
  setFrequencyPenalty,
  presencePenalty,
  setPresencePenalty,
  handleSaveTemplate,
  handleReset
}) {
  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <label>
        Max Tokens:
        <input
          type="number"
          value={numTokens}
          onChange={(event) => setNumTokens(parseInt(event.target.value))}
        />
      </label>
      <label>
        Temperature:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={temperature}
          onChange={(event) => setTemperature(parseFloat(event.target.value))}
        />
      </label>
      <label>
        Top P:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={topP}
          onChange={(event) => setTopP(parseFloat(event.target.value))}
        />
      </label>
      <label>
        Frequency Penalty:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={frequencyPenalty}
          onChange={(event) => setFrequencyPenalty(parseFloat(event.target.value))}
        />
      </label>
      <label>
        Presence Penalty:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={presencePenalty}
          onChange={(event) => setPresencePenalty(parseFloat(event.target.value))}
        />
      </label>

      
      <button onClick={handleSaveTemplate}>Save Template</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

export default SettingsPanel;