import { InputPreact, useBsTooltipPreact } from './inputPreact.js'

import { h, JSX, Fragment, VNode, cloneElement } from 'preact';
import { useState, useEffect, useRef, Ref } from 'preact/hooks';
import { Signal, useSignal } from '@preact/signals';

export type ListItemAction = 'create' | 'delete' | 'move' | 'copy';

export interface ListPickerActionsConfig {
	create?: {
		// Whether or not to use an icon for the create action button
		// defaults to FALSE
		useIcon?: boolean	
	}
}

export type AEProps = {
    cssClasses: Array<string>, 
    iconCssClass: string,
    tooltip: string,
    hide?: Signal,
    onClick?:JSX.MouseEventHandler<any>,

    draggable?:boolean,
    onDragStart?:JSX.DragEventHandler<any>,
}

const ActionElement = (props: AEProps) => {
    const aref = useRef<HTMLAnchorElement>(null);
    useBsTooltipPreact({el:aref.current!, tooltip: props.tooltip, hide: props.hide});

    return (
        <a
            ref={aref}
            onClick={props.onClick}
            class={`list-picker-item-action ${props.cssClasses.join(' ')}`}
            href='javascript:void(0)'
            role='button'
            draggable={props.draggable}
            onDragStart={props.onDragStart}
        >
            <i class={`fa fa-xl ${props.iconCssClass}`}></i>
        </a>
    );
}

type NLPProps<ItemType> = {
    item: ItemType,
    inlineMenuBar: boolean,
    idx: number,
    onItemDropped: (srcIdx:number, dstIdx:number) => void;
    onCopyClicked: (srcIdx: number) => void;
    onDeleteClicked: (srcIdx: number) => void;
    itemLabel?: string,
    itemPicker: VNode<any>
    allowedActions?: Array<ListItemAction>,
}

const actionEnabled = (action: ListItemAction, allowedActions?: Array<ListItemAction>): boolean => {
    return !allowedActions || allowedActions.includes(action);
}

function NewListPicker<ItemType>(props: NLPProps<ItemType>) {
    let [dragFromClass, setDragFromClass] = useState('');
    let [dragToClass, setDragToClass] = useState('');
    let [curDragData, setDragData] = useState(null as any | null);
    let dragEnterCounter = useSignal(0);
    let shide = useSignal(0);
    let menuBar = Array<VNode<any>>();

    let itemPickerRef = useRef<any>(null);
    let itemPicker = cloneElement(props.itemPicker, {idx: props.idx, ref: itemPickerRef, item: props.item});
    let itemElem = <div class='list-picker-item'>{itemPicker}</div>
    let headerElems = [ 
    (<div class='list-picker-item-header'>
        {!props.inlineMenuBar && props.itemLabel &&
            <h6 class='list-picker-item-title'>{`${props.itemLabel} ${props.idx}`}</h6>
        }
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
            <ActionElement 
               cssClasses={['list-picker-item-move']} 
               iconCssClass='fa-arrows-up-down'
               tooltip='Move (Drag+Drop)'
               hide={shide}
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
            props.onItemDropped(curDragData.item.idx, props.idx);

            setDragData(null);
        }
    }

    if (actionEnabled('copy', props.allowedActions)) {
        const onclick = () => {
            props.onCopyClicked(props.idx)
            shide.value++;
        }
        headerElems.push(
            <ActionElement 
                cssClasses={['list-picker-item-copy']} 
                iconCssClass='fa-copy' 
                tooltip={`Copy to New ${props.itemLabel!}`}
                onClick={onclick}
                hide={shide}/>
        );
    }

    if (actionEnabled('delete', props.allowedActions)) {
        let onclick = () => {
            shide.value++;
        }
        headerElems.push(
            <ActionElement 
                cssClasses={['list-picker-item-delete', 'link-danger']} 
                iconCssClass='fa-times'
                tooltip={`Delete ${props.itemLabel!}`}
                onClick={onclick}
                hide={shide}/>
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

const DEFAULT_CONFIG = {
	actions: {
		create: {
			useIcon: false,
		}
	}
}

type LPConfigProps<ItemType> = {
	itemLabel: string,
    extraCssClasses?: Array<string>
	actions?: ListPickerActionsConfig,
	title?: string,
	titleTooltip?: string,
	inlineMenuBar?: boolean,
	hideUi?: boolean,
	horizontalLayout?: boolean,
    // If set, only actions included in the list are allowed. Otherwise, all actions are allowed.
	allowedActions?: Array<ListItemAction>,
    itemPickers: Array<ItemType>
    itemPicker: VNode<any>

    onNewItem: () => void,
    onItemDropped: (srcIdx:number, dstIdx:number) => void;
    onCopyClicked: (srcIdx: number) => void;
    onDeleteClicked: (srcIdx: number) => void;
}

export function ListPickerPreact<ItemType>(props: LPConfigProps<ItemType>) {
    props = {...DEFAULT_CONFIG, ...props};

    const [inlineMenuBarVal, setInlineMenuBar] = useState(false);

    let cssClasses = ['list-picker-root'];
    let labelCssClasses = [];
    if (props.title)
        labelCssClasses.push('list-picker-title');
    if (props.hideUi)
        cssClasses.push('hide-ui');
    if (props.horizontalLayout) {
        cssClasses.push('horizontal')
        setInlineMenuBar(true);
    }
    if (props.extraCssClasses)
        cssClasses.push(...props.extraCssClasses);

    let children = Array<VNode<any>>();

    if (actionEnabled('create', props.allowedActions)) {
        let shide = useSignal(0);

        let createOnClick = () => {
            props.onNewItem && props.onNewItem();
            shide.value++;
        }

        let newItemButton = (
            <>
            {props.actions?.create?.useIcon ? 
                <ActionElement 
                    cssClasses={['link-success', 'list-picker-new-button']}
                    iconCssClass='fa-plus'
                    tooltip={`New ${props.itemLabel}`}
                    hide={shide}
                    onClick={createOnClick}
                    ></ActionElement>
                : <button class='btn btn-primary list-picker-new-button'>{`New ${props.itemLabel}`}</button>
            }
            </>
        );
        children.push(newItemButton);
    }


    return (
        <InputPreact 
            cssClasses={cssClasses} 
            labelCssClasses={labelCssClasses} 
            label={props.title}
            labelTooltip={props.titleTooltip}
            >
            <div className="list-picker-items">
                {props.itemPickers.map((ip, idx) => 
                    <NewListPicker 
                        item={ip}
                        idx={idx}
                        onCopyClicked={props.onCopyClicked}
                        onDeleteClicked={props.onDeleteClicked}
                        onItemDropped={props.onItemDropped}
                        inlineMenuBar={inlineMenuBarVal}
                        itemPicker={props.itemPicker}/>)}
            </div>
            { children }
        </InputPreact>
    );
}
