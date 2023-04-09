import "./PropertySlider.css"
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

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

    const [id] = useState( "slider" + uuidv4().toString() );
    const [input,setInput] = useState("");

    const handleChange = (v:string) => {
        if ( v === null || v === undefined || input === v )
            return;
        setInput(v);
        onChange(v);
    }

    return (
        <div className="slider">
            <div>
                <label htmlFor={id}>{label}</label>
                <input
                    id={id}
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onFocus={(e)=>e.target.select()}
                    onChange={(e)=>handleChange(e.target.value)}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                step={step}
                onChange={(e)=>handleChange(e.target.value)}
            />
        </div>
    )
};

export default PropertySlider;