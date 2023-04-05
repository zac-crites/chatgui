import { CreateChatCompletionRequest } from 'openai';

type SettingsPanelProps = {
  requestSettings : CreateChatCompletionRequest,
  setRequestSettings : (_:CreateChatCompletionRequest)=>void,
  handleSaveTemplate : () => void,
  handleReset: () => void
}

const SettingsPanel = ({
  requestSettings,
  setRequestSettings,
  handleSaveTemplate,
  handleReset
} : SettingsPanelProps ) =>  {

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <label>
        Max Tokens:
        <input
          type="number"
          value={requestSettings.max_tokens}
          onChange={(event) => setRequestSettings({ ...requestSettings, max_tokens: parseInt(event.target.value) })}
        />
      </label>
      <label>
        Temperature:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={requestSettings.temperature ?? 0.7}
          onChange={(event) => setRequestSettings({ ...requestSettings, temperature: parseFloat(event.target.value) })}
        />
      </label>
      <label>
        Top P:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={requestSettings.top_p ?? 1.0}
          onChange={(event) => setRequestSettings({ ...requestSettings, top_p: parseFloat(event.target.value) })}
        />
      </label>
      <label>
        Frequency Penalty:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={requestSettings.frequency_penalty ?? 0.0}
          onChange={(event) => setRequestSettings({ ...requestSettings, frequency_penalty: parseFloat(event.target.value) })}
        />
      </label>
      <label>
        Presence Penalty:
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={requestSettings.presence_penalty ?? 0.0}
          onChange={(event) => setRequestSettings({ ...requestSettings, presence_penalty: parseFloat(event.target.value) })}
        />
      </label>


      <button onClick={handleSaveTemplate}>Save Template</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

export default SettingsPanel;