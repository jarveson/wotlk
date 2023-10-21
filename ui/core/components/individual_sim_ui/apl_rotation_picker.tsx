import { Tooltip } from 'bootstrap';
import { EventID, TypedEvent } from '../../typed_event.js';
import { Player } from '../../player.js';
import { ListItemPickerConfig, ListPicker } from '../list_picker.js';
import { AdaptiveStringPicker } from '../string_picker.js';
import {
	APLRotation,
	APLListItem,
	APLAction,
	APLPrepullAction,
	APLValue,
	APLValueConst,
} from '../../proto/apl.js';

import { Component } from '../component.js';
import { Input, InputConfig } from '../input.js';
import { ActionId } from '../../proto_utils/action_id.js';
import { SimUI } from '../../sim_ui.js';

import { APLActionPicker } from './apl_actions.js';
import { APLValuePicker, APLValueImplStruct } from './apl_values.js';

import { useSignal, useComputed, Signal, useSignalEffect, signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { h, Fragment, render } from 'preact';
import { ActionElem, ListPickerP } from '../list_picker_preact.js';
import { InputP, InputPPropsExternal } from '../input_preact.js';
//import { Tooltip, Popover, OverlayTrigger, Overlay } from 'react-bootstrap';

/*
interface APPrepullApProps<ModObject, T, V = T> extends InputPPropsExternal<ModObject, T, V> {
	modObject: ModObject
	index: number
}

function AplPrepullActionPickerPreact(props: APPrepullApProps<Player<any>, APLPrepullAction>) {
	let cssClasses = ['apl-list-item-picker-root'];
	if (props.extraCssClasses)
		cssClasses.push(...props.extraCssClasses);

	const getItem = (): APLPrepullAction => {
		return props.getValue(props.modObject) || APLPrepullAction.create({
			action: {},
		});
	}

	const getInputValue = (): APLPrepullAction => {
		const item = APLPrepullAction.create({
			hide: props.hidePicker.getInputValue(),
			doAtValue: {
				value: {oneofKind: 'const', const: { val: this.doAtPicker.getInputValue() }},
			},
			action: this.actionPicker.getInputValue(),
		});
		return item;
	}

	const setInputValue = (newValue: APLPrepullAction) => {
		if (!newValue) {
			return;
		}
		this.hidePicker.setInputValue(newValue.hide);
		this.doAtPicker.setInputValue((newValue.doAtValue?.value as APLValueImplStruct<'const'>|undefined)?.const.val || '');
		this.actionPicker.setInputValue(newValue.action || APLAction.create());
	}

	return (
	<InputP
		modObject={props.modObject}
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
	></InputP>
	);
}

class APLPrepullActionPicker extends Input<Player<any>, APLPrepullAction> {
	private readonly player: Player<any>;

	private readonly hidePicker: Input<Player<any>, boolean>;
	private readonly doAtPicker: Input<Player<any>, string>;
	private readonly actionPicker: APLActionPicker;

	private getItem(): APLPrepullAction {
		return this.getSourceValue() || APLPrepullAction.create({
			action: {},
		});
	}

	constructor(parent: HTMLElement, player: Player<any>, config: ListItemPickerConfig<Player<any>, APLPrepullAction>, index: number) {
		config.enableWhen = () => !this.getItem().hide;
		super(parent, 'apl-list-item-picker-root', player, config);
		this.player = player;
}*/
export class APLRotationPicker extends Component {
	constructor(parent: HTMLElement, simUI: SimUI, modPlayer: Player<any>) {
		super(parent, 'apl-rotation-picker-root');

		/*render(
		<ListPickerP
			modObject={modPlayer}
			extraCssClasses={['apl-prepull-action-picker']}
			title='Prepull Actions'
			titleTooltip='Actions to perform before the pull.'
			itemLabel='Prepull Action'
			changedEvent= {(player: Player<any>) => player.rotationChangeEmitter}
			getValue={(player: Player<any>) => player.aplRotation.prepullActions}
			setValue={(eventID: EventID, player: Player<any>, newValue: Array<APLPrepullAction>) => {
				player.aplRotation.prepullActions = newValue;
				player.rotationChangeEmitter.emit(eventID);
			}}
			newItem={() => APLPrepullAction.create({
				action: {},
				doAtValue: {
					value: {oneofKind: 'const', const: { val: '-1s' }}
				},
			})}
			copyItem={(oldItem: APLPrepullAction) => APLPrepullAction.clone(oldItem)}
			newItemPicker={(index: number, item: APLPrepullAction) => <div>RAWRAWRAWR</div>}
			extraHeaderForItem={(srcIdx: number, item: APLPrepullAction) => <div>HEADERRAWR</div>}
			inlineMenuBar={true}
		/>
		, this.rootElem);*/

		new ListPicker<Player<any>, APLPrepullAction>(this.rootElem, modPlayer, {
			extraCssClasses: ['apl-prepull-action-picker'],
			title: 'Prepull Actions',
			titleTooltip: 'Actions to perform before the pull.',
			itemLabel: 'Prepull Action',
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => player.aplRotation.prepullActions,
			setValue: (eventID: EventID, player: Player<any>, newValue: Array<APLPrepullAction>) => {
				player.aplRotation.prepullActions = newValue;
				player.rotationChangeEmitter.emit(eventID);
			},
			newItem: () => APLPrepullAction.create({
				action: {},
				doAtValue: {
					value: {oneofKind: 'const', const: { val: '-1s' }}
				},
			}),
			copyItem: (oldItem: APLPrepullAction) => APLPrepullAction.clone(oldItem),
			newItemPicker: (parent: HTMLElement, listPicker: ListPicker<Player<any>, APLPrepullAction>, index: number, config: ListItemPickerConfig<Player<any>, APLPrepullAction>) => new APLPrepullActionPicker(parent, modPlayer, config, index),
			inlineMenuBar: true,
		});

		new ListPicker<Player<any>, APLListItem>(this.rootElem, modPlayer, {
			extraCssClasses: ['apl-list-item-picker'],
			title: 'Priority List',
			titleTooltip: 'At each decision point, the simulation will perform the first valid action from this list.',
			itemLabel: 'Action',
			changedEvent: (player: Player<any>) => player.rotationChangeEmitter,
			getValue: (player: Player<any>) => player.aplRotation.priorityList,
			setValue: (eventID: EventID, player: Player<any>, newValue: Array<APLListItem>) => {
				player.aplRotation.priorityList = newValue;
				player.rotationChangeEmitter.emit(eventID);
			},
			newItem: () => APLListItem.create({
				action: {},
			}),
			copyItem: (oldItem: APLListItem) => APLListItem.clone(oldItem),
			newItemPicker: (parent: HTMLElement, listPicker: ListPicker<Player<any>, APLListItem>, index: number, config: ListItemPickerConfig<Player<any>, APLListItem>) => new APLListItemPicker(parent, modPlayer, config, index),
			inlineMenuBar: true,
		});

		//modPlayer.rotationChangeEmitter.on(() => console.log('APL: ' + APLRotation.toJsonString(modPlayer.aplRotation)))
	}
}

class APLPrepullActionPicker extends Input<Player<any>, APLPrepullAction> {
	private readonly player: Player<any>;

	private readonly doAtPicker: Input<Player<any>, string>;
	private readonly actionPicker: APLActionPicker;

	private hpVal = signal(false);

	private getItem(): APLPrepullAction {
		return this.getSourceValue() || APLPrepullAction.create({
			action: {},
		});
	}

	constructor(parent: HTMLElement, player: Player<any>, config: ListItemPickerConfig<Player<any>, APLPrepullAction>, index: number) {
		config.enableWhen = () => !this.getItem().hide;
		super(parent, 'apl-list-item-picker-root', player, config);
		this.player = player;

		const itemHeaderElem = ListPicker.getItemHeaderElem(this);
		makeListItemWarnings(itemHeaderElem, player, player => player.getCurrentStats().rotationStats?.prepullActions[index]?.warnings || []);

		render(
		<HidePickerP
			modObject={player}
			val={this.hpVal}
			changedEvent={() => this.player.rotationChangeEmitter}
			getValue={() => this.getItem().hide}
			setValue={(eventID: EventID, player: Player<any>, newValue: boolean) => {
				this.getItem().hide = newValue;
				this.hpVal.value = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			}}
		/>
		, itemHeaderElem);

		this.doAtPicker = new AdaptiveStringPicker(this.rootElem, this.player, {
			label: 'Do At',
			labelTooltip: 'Time before pull to do the action. Should be negative, and formatted like, \'-1s\' or \'-2500ms\'.',
			extraCssClasses: ['apl-prepull-actions-doat'],
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => (this.getItem().doAtValue?.value as APLValueImplStruct<'const'>|undefined)?.const.val || '',
			setValue: (eventID: EventID, player: Player<any>, newValue: string) => {
				if (newValue) {
					this.getItem().doAtValue = APLValue.create({
						value: {oneofKind: 'const', const: { val: newValue }}
					});
				} else {
					this.getItem().doAtValue = undefined;
				}
				this.player.rotationChangeEmitter.emit(eventID);
			},
			inline: true,
		});
		//this.doAtPicker = new APLValuePicker(this.rootElem, this.player, {
		//	label: 'Do At',
		//	labelTooltip: 'Time before pull to do the action. Should be negative, and formatted like, \'-1s\' or \'-2500ms\'.',
		//	extraCssClasses: ['apl-prepull-actions-doat'],
		//	changedEvent: () => this.player.rotationChangeEmitter,
		//	getValue: () => this.getItem().doAtValue,
		//	setValue: (eventID: EventID, player: Player<any>, newValue: APLValue | undefined) => {
		//		this.getItem().doAtValue = newValue;
		//		this.player.rotationChangeEmitter.emit(eventID);
		//	},
		//	inline: true,
		//});

		this.actionPicker = new APLActionPicker(this.rootElem, this.player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().action!,
			setValue: (eventID: EventID, player: Player<any>, newValue: APLAction) => {
				this.getItem().action = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});
		this.init();
	}

	getInputElem(): HTMLElement | null {
		return this.rootElem;
	}

	getInputValue(): APLPrepullAction {
		const item = APLPrepullAction.create({
			hide: this.hpVal.value,
			doAtValue: {
				value: {oneofKind: 'const', const: { val: this.doAtPicker.getInputValue() }},
			},
			action: this.actionPicker.getInputValue(),
		});
		return item;
	}

	setInputValue(newValue: APLPrepullAction) {
		if (!newValue) {
			return;
		}
		this.hpVal.value = newValue.hide;
		this.doAtPicker.setInputValue((newValue.doAtValue?.value as APLValueImplStruct<'const'>|undefined)?.const.val || '');
		this.actionPicker.setInputValue(newValue.action || APLAction.create());
	}
}

class APLListItemPicker extends Input<Player<any>, APLListItem> {
	private readonly player: Player<any>;
	private readonly actionPicker: APLActionPicker;
	private hpVal = signal(false);

	private getItem(): APLListItem {
		return this.getSourceValue() || APLListItem.create({
			action: {},
		});
	}

	constructor(parent: HTMLElement, player: Player<any>, config: ListItemPickerConfig<Player<any>, APLListItem>, index: number) {
		config.enableWhen = () => !this.getItem().hide;
		super(parent, 'apl-list-item-picker-root', player, config);
		this.player = player;

		const itemHeaderElem = ListPicker.getItemHeaderElem(this);
		makeListItemWarnings(itemHeaderElem, player, player => player.getCurrentStats().rotationStats?.priorityList[index]?.warnings || []);

		render(
		<HidePickerP
			modObject={player}
			val={this.hpVal}
			changedEvent={() => this.player.rotationChangeEmitter}
			getValue={() => this.getItem().hide}
			setValue={(eventID: EventID, player: Player<any>, newValue: boolean) => {
				this.getItem().hide = newValue;
				this.hpVal.value = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			}}
		/>, itemHeaderElem);

		this.actionPicker = new APLActionPicker(this.rootElem, this.player, {
			changedEvent: () => this.player.rotationChangeEmitter,
			getValue: () => this.getItem().action!,
			setValue: (eventID: EventID, player: Player<any>, newValue: APLAction) => {
				this.getItem().action = newValue;
				this.player.rotationChangeEmitter.emit(eventID);
			},
		});
		this.init();
	}

	getInputElem(): HTMLElement | null {
		return this.rootElem;
	}

	getInputValue(): APLListItem {
		const item = APLListItem.create({
			hide: this.hpVal.value,
			action: this.actionPicker.getInputValue(),
		});
		return item;
	}

	setInputValue(newValue: APLListItem) {
		if (!newValue) {
			return;
		}
		this.hpVal.value = newValue.hide;
		this.actionPicker.setInputValue(newValue.action || APLAction.create());
	}
}

function makeListItemWarnings(itemHeaderElem: HTMLElement, player: Player<any>, getWarnings: (player: Player<any>) => Array<string>) {
	const warningsElem = ListPicker.makeActionElem('apl-warnings', 'fa-exclamation-triangle');
	warningsElem.classList.add('warning', 'link-warning');
	warningsElem.setAttribute('data-bs-html', 'true');
	const warningsTooltip = Tooltip.getOrCreateInstance(warningsElem, {
		customClass: 'dropdown-tooltip',
		title: 'Warnings',
		html: true,
	});
	itemHeaderElem.appendChild(warningsElem);

	const updateWarnings = async () => {
		warningsTooltip.setContent({ '.tooltip-inner': '' });
		const warnings = getWarnings(player);
		if (warnings.length == 0) {
			warningsElem.style.visibility = 'hidden';
		} else {
			warningsElem.style.visibility = 'visible';
			const formattedWarnings = await Promise.all(warnings.map(w => ActionId.replaceAllInString(w)));
			warningsTooltip.setContent({
				'.tooltip-inner': `
				<p>This action has warnings, and might not behave as expected.</p>
				<ul>
					${formattedWarnings.map(w => `<li>${w}</li>`).join('')}
				</ul>
			`});
		}
	};
	updateWarnings();
	player.currentStatsEmitter.on(updateWarnings);
}

interface HpProps extends InputPPropsExternal<Player<any>, boolean> {
	val: Signal<boolean>
}

function HidePickerP(props: HpProps) {
	let eventId = useSignal(0);

	let classlist = ['hide-picker-root'];
	if (props.extraCssClasses)
		classlist.push(...props.extraCssClasses);

	const getInputValue = () => {
		return props.val.value
	}

	const setInputValue = (newVal: boolean) => {
		props.val.value = newVal;
	}
	
	const onClick = () => {
		props.val.value = !props.val.value
		eventId.value = TypedEvent.nextEventID();
	}

	return (
		<InputP
			modObject={props.modObject}
			label={props.label}
			labelTooltip={props.labelTooltip}
			inline={props.inline}
			extraCssClasses={classlist}
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
			<ActionElem
				cssClass='hide-picker-button'
				iconCssClass={props.val.value ? 'fa-eye-slash' : 'fa-eye'}
				label={props.val.value ? 'Enable Action' : 'Disable Action'}
				onClick={onClick}
			/>
		</InputP>
	);
}
