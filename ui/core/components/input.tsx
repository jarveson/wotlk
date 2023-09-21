import { Tooltip } from 'bootstrap';
import { EventID, TypedEvent } from '../typed_event.js';

import { JSX, h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * Data for creating a new input UI element.
 */
export interface InputConfig<ModObject, T, V = T> {
	label?: string,
	labelTooltip?: string,
	inline?: boolean,
	extraCssClasses?: Array<string>,

	defaultValue?: T,

	// Returns the event indicating the mapped value has changed.
	changedEvent: (obj: ModObject) => TypedEvent<any>,

	// Get and set the mapped value.
	getValue: (obj: ModObject) => T,
	setValue: (eventID: EventID, obj: ModObject, newValue: T) => void,

	// If set, will automatically disable the input when this evaluates to false.
	enableWhen?: (obj: ModObject) => boolean,

	// If set, will automatically hide the input when this evaluates to false.
	showWhen?: (obj: ModObject) => boolean,

	// Overrides the default root element (new div).
	rootElem?: HTMLElement,

	// Convert between source value and input value types. In most cases this is not needed
	// because source and input use the same type. These functions must be set if T != V.
	sourceToValue?: (src: T) => V,
	valueToSource?: (val: V) => T,
}

type ICProps<ModObject, T, V> = {
	modObject: ModObject,
	cfg: InputConfig<ModObject, T, V>,
	cssClass: string,
	children: JSX.Element,
	enabled: boolean,
	shown: boolean,
}

function useModObject<ModObject>(modObj: ModObject) {
	const [val, setVal] = useState()

	config.changedEvent(modObj).on(eventID => {
		this.setInputValue(this.getSourceValue());
		this.update();
	})
}

export function InputPreact<ModObject, T, V>(props: ICProps<ModObject, T, V>) {
	const labelRef = useRef<HTMLLabelElement>(null);

	if (props.cfg.label && props.cfg.labelTooltip) {
		useEffect(() => {	
			const t = new Tooltip(labelRef.current!, {
				title: props.cfg.labelTooltip,
				html: true,
			});
			return () => t.dispose();
		}, [props.cfg.labelTooltip]);
	}

	const setInputValue = () => {
		props.cfg.setValue
	}

	useEffect(() => {
		props.cfg.changedEvent(modObj)
	})

	return (
		<div class={`input-root ${props.cfg.inline && 'input-inline'} ${props.cfg.extraCssClasses?.join(' ')} ${!props.enabled && 'disabled'} ${!props.shown && 'hide'}`}>
			{props.cfg.label &&
				<label className="form-label" ref={labelRef}>
					{props.cfg.label}
				</label>
			}
			{props.children}
		</div>
	)
}

// Shared logic for UI elements that are mapped to a value for some modifiable object.
export abstract class Input<ModObject, T, V = T> extends Component {
	private readonly inputConfig: InputConfig<ModObject, T, V>;
	readonly modObject: ModObject;

	protected enabled: boolean = true;

	readonly changeEmitter = new TypedEvent<void>();

	constructor(parent: HTMLElement, cssClass: string, modObject: ModObject, config: InputConfig<ModObject, T, V>) {
		super(parent, 'input-root', config.rootElem);
		this.inputConfig = config;
		this.modObject = modObject;
		this.rootElem.classList.add(cssClass);

		if (config.inline) this.rootElem.classList.add('input-inline');
		if (config.extraCssClasses) this.rootElem.classList.add(...config.extraCssClasses);
		if (config.label) this.rootElem.appendChild(this.buildLabel(config));

		config.changedEvent(this.modObject).on(eventID => {
			this.setInputValue(this.getSourceValue());
			this.update();
		});
	}

	private buildLabel(config: InputConfig<ModObject, T, V>): JSX.Element {
		let dataset = {};

		let label = 
			<label className="form-label">
				{config.label}
			</label>;

		if (config.labelTooltip)
			new Tooltip(label, {
				title: config.labelTooltip,
				html: true,
			});

		return label;
	}

	update() {
		const enable = !this.inputConfig.enableWhen || this.inputConfig.enableWhen(this.modObject);
		if (enable) {
			this.enabled = true;
			this.rootElem.classList.remove('disabled');
			this.getInputElem()?.removeAttribute('disabled');
		} else {
			this.enabled = false;
			this.rootElem.classList.add('disabled');
			this.getInputElem()?.setAttribute('disabled', '');
		}

		const show = !this.inputConfig.showWhen || this.inputConfig.showWhen(this.modObject);
		if (show) {
			this.rootElem.classList.remove('hide');
		} else {
			this.rootElem.classList.add('hide');
		}
	}

	// Can't call abstract functions in constructor, so need an init() call.
	init() {
		const initialValue = this.inputConfig.defaultValue ? this.inputConfig.defaultValue : this.inputConfig.getValue(this.modObject);
		this.setInputValue(initialValue);
		this.update();
	}

	abstract getInputElem(): HTMLElement | null;

	abstract getInputValue(): T;

	abstract setInputValue(newValue: T): void;

	protected getSourceValue(): T {
		return this.inputConfig.getValue(this.modObject);
	}

	protected setSourceValue(eventID: EventID, newValue: T) {
		this.inputConfig.setValue(eventID, this.modObject, newValue);
	}

	protected sourceToValue(src: T): V {
		return this.inputConfig.sourceToValue ? this.inputConfig.sourceToValue(src) : src as unknown as V;
	}
	protected valueToSource(val: V): T {
		return this.inputConfig.valueToSource ? this.inputConfig.valueToSource(val) : val as unknown as T;
	}

	// Child classes should call this method when the value in the input element changes.
	inputChanged(eventID: EventID) {
		this.setSourceValue(eventID, this.getInputValue());
		this.changeEmitter.emit(eventID);
	}

	// Sets the underlying value directly.
	setValue(eventID: EventID, newValue: T) {
		this.inputConfig.setValue(eventID, this.modObject, newValue);
	}

	static newGroupContainer(): HTMLElement {
		let group = document.createElement('div');
		group.classList.add('picker-group');
		return group;
	}
}
