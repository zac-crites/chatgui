import { CreateChatCompletionRequest } from 'openai';

import PropertySlider from './PropertySlider';

type SettingsPanelProps = {
  requestSettings: CreateChatCompletionRequest,
  setRequestSettings: (_: CreateChatCompletionRequest) => void,
}

const SettingsPanel = ({
  requestSettings,
  setRequestSettings
}: SettingsPanelProps) => {

  return (
    <div className="settings-panel">
      <PropertySlider
        label="Max Tokens:"
        min="1"
        max="2048"
        step="1"
        value={requestSettings.max_tokens ?? 1024}
        onChange={(v) => setRequestSettings({ ...requestSettings, max_tokens: parseInt(v) })} />
      <PropertySlider
        label="Temperature:"
        min="0"
        max="1"
        step=".05"
        value={requestSettings.temperature ?? 0.7}
        onChange={(v) => setRequestSettings({ ...requestSettings, temperature: parseFloat(v) })} />
      <PropertySlider
        label="Top P:"
        min="0"
        max="1"
        step=".05"
        value={requestSettings.top_p ?? 1.0}
        onChange={(v) => setRequestSettings({ ...requestSettings, top_p: parseFloat(v) })} />
      <PropertySlider
        label="Frequency Penalty:"
        min="0"
        max="1"
        step=".05"
        value={requestSettings.frequency_penalty ?? 0.0}
        onChange={(v) => setRequestSettings({ ...requestSettings, frequency_penalty: parseFloat(v) })} />
      <PropertySlider
        label="Presence Penalty:"
        min="0"
        max="1"
        step=".05"
        value={requestSettings.presence_penalty ?? 0.0}
        onChange={(v) => setRequestSettings({ ...requestSettings, presence_penalty: parseFloat(v) })} />
    </div>
  );
}

export default SettingsPanel;
