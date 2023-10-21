import { EventID, TypedEvent } from '../typed_event.js';
import { Input, InputConfig } from './input.js';

import {h, Fragment, render, createRef, Ref, ComponentChildren, VNode, cloneElement} from 'preact';
import { useSignal, useComputed, Signal, useSignalEffect } from '@preact/signals';
import { MutableRef, useEffect, useRef, useState } from 'preact/hooks';
import { Tooltip, Popover, OverlayTrigger, Overlay } from 'react-bootstrap';
import { InputP, InputPPropsExternal } from './input_preact.js';

export type ListItemAction = 'create' | 'delete' | 'move' | 'copy';

export interface ListPickerActionsConfig {
	create?: {
		// Whether or not to use an icon for the create action button
		// defaults to FALSE
		useIcon?: boolean	
	}
}

interface AeProps {
	cssClass: string;
	iconCssClass: string;
	onClick: () => void;
	label: string;
	show?:boolean;
	draggable?:boolean;
	onDragStart?: h.JSX.DragEventHandler<any>,
}

export const ActionElem = (props: AeProps) => {
	let aref = useRef(null);
	return (
		<a ref={aref} onClick={props.onClick} draggable={props.draggable} onDragStart={props.onDragStart} class={`list-picker-item-action ${props.cssClass}`} href={'javascript:void(0)'} role='button'>
			<i class={`fa fa-xl ${props.iconCssClass}`}></i>
			<Overlay target={aref} show={props.show}>
				<Tooltip title={props.label}/>
			</Overlay>
		</a>
	);
}

const actionEnabled = (action: ListItemAction, allowedActions?: Array<ListItemAction>): boolean => {
    return !allowedActions || allowedActions.includes(action);
}

type NLPProps<ModObject, ItemType> = {
    item: ItemType,
    inlineMenuBar: boolean,
    idx: number,
    itemLabel?: string,
    itemPicker: (index: number, item: ItemType) => VNode<any>
    allowedActions?: Array<ListItemAction>,
    extraHeaderElem: VNode<any>,
}

function NewListPicker<ModObject, ItemType>(props: NLPProps<ModObject, ItemType>) {
    let [dragFromClass, setDragFromClass] = useState('');
    let [dragToClass, setDragToClass] = useState('');
    let [curDragData, setDragData] = useState(null as any | null);
    let dragEnterCounter = useSignal(0);
    let shide = useSignal(0);
    let menuBar = Array<VNode<any>>();

    let itemPickerRef = useRef<any>(null);
    let itemPicker = props.itemPicker(props.idx, props.item);
    let itemElem = <div class='list-picker-item'>{itemPicker}</div>
    let headerElems = [ 
    (<div class='list-picker-item-header'>
        {!props.inlineMenuBar && props.itemLabel &&
            <h6 class='list-picker-item-title'>{`${props.itemLabel} ${props.idx}`}</h6>
        }
        {props.extraHeaderElem}
    </div>)];

    let ondragenter = undefined;
    let ondragleave = undefined;
    let ondragover = undefined;
    let ondrop = undefined;

    if (actionEnabled('move', props.allowedActions)) {
        const onclickhide = () => shide.value++;
        const ondragstart = (event: DragEvent) => {
            event.dataTransfer!.dropEffect = 'move';
            event.dataTransfer!.effectAllowed = 'move';
            setDragFromClass('dragfrom');
            setDragData({item: props.item, listpicker: itemPickerRef.current});
        }

        headerElems.push(
            <ActionElem 
			   cssClass={'list-picker-item-move'} 
               iconCssClass='fa-arrows-up-down'
               label='Move (Drag+Drop)'
               onClick={onclickhide}
               draggable={true}
               onDragStart={ondragstart}
            />
        );

        ondragenter = (event:DragEvent) => {
            if (!curDragData || curDragData.listpicker != itemPickerRef)
                return;
            event.preventDefault();
            dragEnterCounter.value++;
            setDragToClass('dragto');
        }

        ondragleave = (event:DragEvent) => {
            if (!curDragData || curDragData.listpicker != itemPickerRef)
                return;
            event.preventDefault();
            dragEnterCounter.value--;
            if (dragEnterCounter.value <= 0)
                setDragToClass('');
        }

        ondragover = (event:DragEvent) => {
            if (!curDragData || curDragData.listpicker != itemPickerRef)
                return;
            event.preventDefault();
        }

        ondrop = (event:DragEvent) => {
            if (!curDragData || curDragData.listpicker != itemPickerRef)
                return;
            event.preventDefault();
            dragEnterCounter.value = 0;
            setDragToClass('');
            setDragFromClass('');
            //props.onItemDropped(curDragData.item.idx, props.idx);

            setDragData(null);
        }
    }

    if (actionEnabled('copy', props.allowedActions)) {
        const onclick = () => {
            //props.onCopyClicked(props.idx)
            shide.value++;
        }
        headerElems.push(
            <ActionElem 
                cssClass={'list-picker-item-copy'} 
                iconCssClass='fa-copy' 
                label={`Copy to New ${props.itemLabel!}`}
                onClick={onclick}/>
        );
    }

    if (actionEnabled('delete', props.allowedActions)) {
        let onclick = () => {
            shide.value++;
        }
        headerElems.push(
            <ActionElem 
                cssClass={'list-picker-item-delete link-danger'} 
                iconCssClass='fa-times'
                label={`Delete ${props.itemLabel!}`}
                onClick={onclick}/>
        );
    }

    if (props.inlineMenuBar) {
        menuBar.push(itemElem);
        menuBar.push(...headerElems);
    } else {
        menuBar.push(...headerElems);
        menuBar.push(itemElem)
    }

    return (
        <div class={`list-picker-item-container ${props.inlineMenuBar && 'inline'} ${dragFromClass} ${dragToClass}`}
            onDragEnter={ondragenter}
            onDragLeave={ondragleave}
            onDragOver={ondragover}
            onDrop={ondrop}
        >
            {menuBar}
        </div>
    )
}

export interface LppProps<ModObject, ItemType> extends InputPPropsExternal<ModObject, Array<ItemType>> {
	modObject: ModObject;

	itemLabel: string,
	newItem: () => ItemType,
	copyItem: (oldItem: ItemType) => ItemType,
	newItemPicker: (index: number, item: ItemType) => VNode<any>,
	actions?: ListPickerActionsConfig
	title?: string,
	titleTooltip?: string,
	inlineMenuBar?: boolean,
	hideUi?: boolean,
	horizontalLayout?: boolean,
	extraHeaderForItem: (srcIdx: number, item: ItemType) => VNode<any>;

	// If set, only actions included in the list are allowed. Otherwise, all actions are allowed.
	allowedActions?: Array<ListItemAction>,
}

const DEFAULT_CONFIG = {
	actions: {
		create: {
			useIcon: false,
		}
	}
}

export function ListPickerP<ModObject, ItemType>(props: LppProps<ModObject, ItemType>) {
	props = {...DEFAULT_CONFIG, ...props};

	let eventId = useSignal(0);
	let itemPickerPairs = useSignal([] as Array<ItemType>)

	if (props.horizontalLayout)
		props.inlineMenuBar = true;

	let classlist = ['list-picker-root'];
	if (props.extraCssClasses)
		classlist.push(...props.extraCssClasses);

	if (props.hideUi)
		classlist.push('hide-ui')
	if (props.horizontalLayout)
		classlist.push('horizontal')

	let [catShown, setCatShown] = useState(true);
	let createAction : JSX.Element | null = null;

	if (actionEnabled('create', props.allowedActions)) {
		const aecOnClick = () => {
			const newItem = props.newItem();
			const newList = props.getValue(props.modObject).concat([newItem]);
			props.setValue(TypedEvent.nextEventID(), props.modObject, newList);
			setCatShown(false);
		};
		if (props.actions?.create?.useIcon) {
			createAction = 
				<ActionElem 
					onClick={aecOnClick} 
					cssClass='link-success list-picker-new-button'
					iconCssClass='fa-plus'
					show={catShown}
					label={`New ${props.label}`}/>
		} else {
			createAction = <button onClick={aecOnClick} class='btn btn-primary list-picker-new-button' content={`New ${props.itemLabel}`}></button>;
		}
	}

	const getInputValue = (): Array<ItemType> => {
		return itemPickerPairs.value;
	}

	const setInputValue = (newValue: Array<ItemType>): void => {
		// Add/remove pickers to make the lengths match.
		itemPickerPairs.value = newValue;
	}

	let titleRef = useRef(null);
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
			<>
				{	props.title &&
						<label ref={titleRef} className='list-picker-title form-label'>
							{props.title}
							{props.titleTooltip && 
								<Overlay target={titleRef}>
									<Tooltip title={props.titleTooltip}/>
								</Overlay>
							}
						</label>
				}
				<div className="list-picker-items">
					{
						itemPickerPairs.value.map((ip, idx) => 
							<NewListPicker
								item={ip}
								idx={idx}
								extraHeaderElem={props.extraHeaderForItem(idx, ip)}
								inlineMenuBar={props.inlineMenuBar ?? false}
								itemPicker={props.newItemPicker}/>
						)
					}
				</div>
				{ createAction && createAction }
			</>
		</InputP>
	)

}
