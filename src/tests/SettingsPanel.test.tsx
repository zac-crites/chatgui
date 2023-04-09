import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateChatCompletionRequest } from 'openai';
import SettingsPanel from '../SettingsPanel';

describe('SettingsPanel', () => {
    let mockRequestSettings: CreateChatCompletionRequest;
    let mockSetRequestSettings: jest.Mock;

    beforeEach(() => {
        mockRequestSettings = {
            model: "mockModel",
            max_tokens: 200,
            temperature: 0.5,
            top_p: 0.8,
            frequency_penalty: 0.2,
            presence_penalty: 0.4,
            messages: []
        };
        mockSetRequestSettings = jest.fn();
    });

    it('renders all sliders with default values', () => {
        render(
            <SettingsPanel
                requestSettings={mockRequestSettings}
                setRequestSettings={mockSetRequestSettings}
            />
        );
        expect(screen.getByLabelText('Max Tokens:')).toHaveValue(200);
        expect(screen.getByLabelText('Temperature:')).toHaveValue(0.5);
        expect(screen.getByLabelText('Top P:')).toHaveValue(0.8);
        expect(screen.getByLabelText('Frequency Penalty:')).toHaveValue(0.2);
        expect(screen.getByLabelText('Presence Penalty:')).toHaveValue(0.4);
    });

it.each`
sliderName | sliderLabel | newValue
${'top_p'} | ${'Top P:'} | ${'0.5'}
${'max_tokens'} | ${'Max Tokens:'} | ${'300'}
${'temperature'} | ${'Temperature:'} | ${'0.8'}
${'presence_penalty'} | ${'Presence Penalty:'} | ${'0.7'}
${'frequency_penalty'} | ${'Frequency Penalty:'} | ${'0.1'}
`('updates $sliderName slider on change', ({ sliderName, sliderLabel, newValue }) => {
        render(
            <SettingsPanel
                requestSettings={mockRequestSettings}
                setRequestSettings={mockSetRequestSettings}
            />
        );
        const slider = screen.getByLabelText(sliderLabel) as HTMLInputElement;
        act(() => {
            userEvent.click(slider);
            userEvent.clear(slider);
            userEvent.paste(slider, newValue);
        });
        expect(mockSetRequestSettings).toHaveBeenCalledWith({
            ...mockRequestSettings,
            [sliderName]: parseFloat(newValue),
        });
    });
});
