import { Tooltip } from 'bootstrap';
import { h, ComponentChildren } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { TypedEvent } from '../typed_event.js';
import { Signal, useSignal } from "@preact/signals";

export type ICProps = {
	cssClasses?: Array<string>,
	children: ComponentChildren,
	enabled?: boolean,
	shown?: boolean,

    label?: string,
	labelTooltip?: string,
	inline?: boolean,
    labelCssClasses?: Array<string>,
}

const DEFAULT_CONFIG = {
    enabled: true,
    shown: true,
}

export type BsTTProps = {
    el: HTMLElement,
    tooltip: string,
    html?: boolean,
    hide?: Signal,
}

export const useBsTooltipPreact = (props: BsTTProps) => {
    let t : Tooltip | null = null;
    useEffect(() => {	
        t = new Tooltip(props.el, {
            title: props.tooltip,
            html: props.html,
        });
        return () => t && t.dispose();
    }, [props.tooltip]);

    if (props.hide) {
        useEffect(() => {
            t?.hide();
        }, [props.hide.value])
    }
}

export function useModObject<ModObject>(changedEvent: (obj: ModObject) => TypedEvent<any>, modObj: ModObject) {
	const [val, setVal] = useState(0);

	useEffect(() => {
		const e = changedEvent(modObj).on((eventID:number) => {
			setVal(eventID);
		});
		return () => e.dispose();
	}, [])
    return [val, setVal];
}

export const InputPreact = (props: ICProps) => {
	const labelRef = useRef<HTMLLabelElement>(null);
    props = {...DEFAULT_CONFIG, ...props};

	if (props.label && props.labelTooltip) {
        useBsTooltipPreact({el:labelRef.current!, tooltip: props.labelTooltip, html: true});
	}

	return (
		<div class={`input-root ${props.inline && 'input-inline'} ${props.cssClasses?.join(' ')} ${!props.enabled && 'disabled'} ${!props.shown && 'hide'}`}>
			{props.label &&
				<label className={`form-label ${props.labelCssClasses?.join(' ')}`} ref={labelRef}>
					{props.label}
				</label>
			}
			{props.children}
		</div>
	)
}