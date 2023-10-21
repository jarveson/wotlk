import { useSignal, useComputed, Signal, useSignalEffect } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { h, Fragment } from 'preact';
import { Disposable, EventID, TypedEvent } from '..//typed_event.js';
import { Tooltip, Popover, OverlayTrigger, Overlay } from 'react-bootstrap';

export interface InputPProps<ModObject, T, V = T> {
	modObject: ModObject,

	label?: string,
	labelTooltip?: string,
	inline?: boolean,
	extraCssClasses?: Array<string>,

	children: h.JSX.Element,

	defaultValue?: T,

	// If set, will automatically disable the input when this evaluates to false.
	enableWhen?: (obj: ModObject) => boolean,

	// If set, will automatically hide the input when this evaluates to false.
	showWhen?: (obj: ModObject) => boolean,

	// Returns the event indicating the mapped value has changed.
	changedEvent: (obj: ModObject) => TypedEvent<any>,

	// Get and set the mapped value.
	getValue: (obj: ModObject) => T,
	setValue: (eventID: EventID, obj: ModObject, newValue: T) => void,

	// Convert between source value and input value types. In most cases this is not needed
	// because source and input use the same type. These functions must be set if T != V.
	sourceToValue?: (src: T) => V,
	valueToSource?: (val: V) => T,

	getInputValue(): T;
	setInputValue(newValue: T): void;

	inputChanged: Signal<number>;
}

export interface InputPPropsExternal<ModObject, T, V = T> {
	modObject: ModObject,

	label?: string,
	labelTooltip?: string,
	inline?: boolean,
	extraCssClasses?: Array<string>,

	defaultValue?: T,

	// If set, will automatically disable the input when this evaluates to false.
	enableWhen?: (obj: ModObject) => boolean,

	// If set, will automatically hide the input when this evaluates to false.
	showWhen?: (obj: ModObject) => boolean,

	// Returns the event indicating the mapped value has changed.
	changedEvent: (obj: ModObject) => TypedEvent<any>,

	// Get and set the mapped value.
	getValue: (obj: ModObject) => T,
	setValue: (eventID: EventID, obj: ModObject, newValue: T) => void,

	// Convert between source value and input value types. In most cases this is not needed
	// because source and input use the same type. These functions must be set if T != V.
	sourceToValue?: (src: T) => V,
	valueToSource?: (val: V) => T,
}

interface ILPP {
	label: string;
	labelTooltip?: string;
}

const InputLabelP = (props: ILPP) => {
	let labelRef = useRef(null);
	return (
		<label ref={labelRef} className="form-label">
			{props.label}
			{props.labelTooltip && 
			<Overlay target={labelRef}>
				<Tooltip>{props.labelTooltip}</Tooltip>
			</Overlay>}
		</label>
	)
}

export function InputP<ModObject, T, V = T>(props : InputPProps<ModObject, T, V>) {
	let enabled = useSignal(!props.enableWhen || props.enableWhen(props.modObject));
	let shown = useSignal(!props.showWhen || props.showWhen(props.modObject));
	let disabled = useComputed(() => !enabled.value);

	let update = () => {
		enabled.value = !props.enableWhen || props.enableWhen(props.modObject);
		shown.value = !props.showWhen || props.showWhen(props.modObject);
	}

	let classList = 'input-root';
	if (props.extraCssClasses)
		classList += ' ' + props.extraCssClasses.join(' ');
	if (props.inline)
		classList += ' input-inline';
	if (!enabled.value)
		classList += ' disabled';
	if (!shown.value)
		classList += ' hide';

	const initialValue = props.defaultValue ? props.defaultValue : props.getValue(props.modObject);
	props.setInputValue(initialValue);

	let e: Disposable | null = null;
	useEffect(() => {
		e = props.changedEvent(props.modObject).on(eventID => {
			props.setInputValue(props.getValue(props.modObject));
			update();
		})
		return () => e && e.dispose();
	});

	let changeEmitter = new TypedEvent<void>()
	useSignalEffect(() => {
		let eid = props.inputChanged.value;
		props.setValue(eid, props.modObject, props.getInputValue());
		changeEmitter.emit(eid);
	})	

	return (
	<div class={classList} disabled={disabled}>
		{ props.label && <InputLabelP label={props.label} labelTooltip={props.labelTooltip}/>}
		{ props.children }
	</div>
	);
}

export interface NPP<ModObject, T, V = T> extends InputPPropsExternal<ModObject, T, V> {
	float? : boolean;
	positive? : boolean;
}

export function NumberPickerP<ModObject>(props: NPP<ModObject, number>) {
	let float = useSignal(props.float || false);
	let positive = useSignal(props.positive || false);
	let inputValue = useSignal('');
	let inputSize = useSignal(3);
	let eventId = useSignal(0);

	let cssClasses = ['number-picker-root'];
	if (props.extraCssClasses)
		cssClasses.push(...props.extraCssClasses);

	let onchange = () => {
		if (positive.value) {
			if (float.value) {
				inputValue.value = Math.abs(parseFloat(inputValue.value)).toFixed(2);
			} else {
				inputValue.value = Math.abs(parseInt(inputValue.value)).toString();
			}
		}
		eventId.value = TypedEvent.nextEventID();
	}

	let updatesize = () => {
		inputSize.value = Math.max(3, inputValue.value.length);
	}

	let oninput = () => {
		updatesize();
	}

	let getInputValue = () => {
		if (props.float) {
			return parseFloat(inputValue.value) || 0;
		} else {
			return parseInt(inputValue.value) || 0;
		}
	}

	let setInputValue = (newValue: number) => {
		if (props.float)
			inputValue.value = newValue.toFixed(2);
		else
			inputValue.value = String(newValue);
	}

	return (
	<InputP
		modObject={props.modObject}
		label={props.label}
		labelTooltip={props.labelTooltip}
		inline={props.inline}
		extraCssClasses={cssClasses}
		defaultValue={props.defaultValue}
		enableWhen={props.enableWhen}
		showWhen={props.showWhen}
		changedEvent={props.changedEvent}
		getValue={props.getValue}
		setValue={props.setValue}
		sourceToValue={props.sourceToValue}
		valueToSource={props.valueToSource}
		setInputValue={setInputValue}
		inputChanged={eventId}
		getInputValue={getInputValue}
	>
		<input 
			type='text' 
			class='form-control number-picker-input'
			onChange={onchange}
			onInput={oninput}
			size={inputSize}
			value={inputValue}
		/>
	</InputP>
	);
}
