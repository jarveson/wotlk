/** @jsx h */
/** @jsxFrag Fragment */
import { TypedEvent } from '../typed_event.js';
import { InputPreact, useModObject } from './inputPreact.js'
import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, Ref, useContext } from 'preact/hooks';
import { ICProps } from './inputPreact.js';
import { Player } from '../player.js';

type AspProps = {
    modObject: any,
	value: string,
    icProps: ICProps,
	oninput: (e: Event) => void,
	onchange: (e: Event) => void,
}

export const AdaptiveStringPickerPreact = (props: AspProps) => {
    const changedEvent = (modObj: Player<any>) => modObj.rotationChangeEmitter;
	const [evntval, setEvntVal] = useModObject(changedEvent, props.modObject);
	const [sizeVal, setSizeVal] = useState(3);

    if (props.icProps.cssClasses)
        props.icProps.cssClasses.push('adaptive-string-picker-root')
    else
        props.icProps.cssClasses = ['adaptive-string-picker-root'];

	const onchange = (e: Event) => {
		props.onchange(e);
	} 

	const updateSize = () => {
		const newSize = Math.max(3, props.value.length);
		if (newSize != sizeVal)
			setSizeVal(newSize);
	}
	updateSize();

	const oninput = (e:Event) => {
		props.oninput(e);
		updateSize();
	}

    return (
        <InputPreact
        {...props.icProps}
        >
            <input
				value={props.value}
				class='form-control'
				onChange={onchange}
				onInput={oninput}
				size={sizeVal}
				type={'text'}/>
        </InputPreact>
    )
}
