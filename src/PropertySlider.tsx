import "./PropertySlider.css"

type PropertySliderProps = {
    label: string
    value: string | number,
    min: string | number | undefined,
    max: string | number | undefined,
    step: string | number | undefined
    onChange: (newValue: string) => void
}

const PropertySlider = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: PropertySliderProps) => {

    return (
        <div className="slider">
            <div>
                <div>{label}</div>
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onFocus={(e)=>e.target.select()}
                    onChange={(e)=>onChange(e.target.value)}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                step={step}
                onChange={(e)=>onChange(e.target.value)}
            />
        </div>
    )
};

export default PropertySlider;