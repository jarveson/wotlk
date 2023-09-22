import { EventID, TypedEvent } from '../typed_event.js';

import { Input, InputConfig } from './input.js';

import { InputPreact, useBsTooltipPreact, useModObject } from '../inputPreact.js'

import { h, JSX, Fragment, VNode, cloneElement } from 'preact';
import { useState, useEffect, useRef, Ref, useContext } from 'preact/hooks';
import { Signal, useSignal } from '@preact/signals';
import { ActionElement, ListPickerPreact } from '../list_picker_preact.js';
import { ICProps } from './inputPreact.js';
import { Player } from '../player.js';

type AspProps = {
    modObject: any
    icProps: ICProps
}

export const AdaptiveStringPicker = (props: AspProps) => {
    const changedEvent = (modObj: Player<any>) => modObj.rotationChangeEmitter;
	const [val, setVal] = useModObject(changedEvent, props.modObject)
    if (props.icProps.cssClasses)
        props.icProps.cssClasses.push('adaptive-string-picker-root')
    else
        props.icProps.cssClasses = ['adaptive-string-picker-root'];
    
    return (
        <InputPreact
        {...props.icProps}
        >
            <input class='form-control' type={'text'}></input>
        </InputPreact>
    )
}

// A string picker which adapts its width to the input.
export class AdaptiveStringPicker<ModObject> extends Input<ModObject, string> {
	private readonly inputElem: HTMLInputElement;

	constructor(parent: HTMLElement, modObject: ModObject, config: InputConfig<ModObject, string>) {
		super(parent, 'adaptive-string-picker-root', modObject, config);

		this.inputElem = document.createElement('input');
		this.inputElem.type = 'text';
		this.inputElem.classList.add('form-control')
		this.rootElem.appendChild(this.inputElem);

		this.init();

		this.inputElem.addEventListener('change', event => {
			this.inputChanged(TypedEvent.nextEventID());
		});
		this.inputElem.addEventListener('input', event => {
			this.updateSize();
		});
		this.updateSize();
	}

	getInputElem(): HTMLElement {
		return this.inputElem;
	}

	getInputValue(): string {
		return this.inputElem.value;
	}

	setInputValue(newValue: string) {
		this.inputElem.value = newValue;
		this.updateSize();
	}

	private updateSize() {
		const newSize = Math.max(3, this.inputElem.value.length);
		if (this.inputElem.size != newSize)
			this.inputElem.size = newSize;
	}
}
