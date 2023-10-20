import { Stat, Class, PseudoStat, Spec } from '..//proto/common.js';
import { TristateEffect } from '..//proto/common.js'
import { getClassStatName, statOrder } from '..//proto_utils/names.js';
import { Stats } from '..//proto_utils/stats.js';
import { Player } from '..//player.js';
import { Disposable, EventID, TypedEvent } from '..//typed_event.js';

import * as Mechanics from '../constants/mechanics.js';

import { NumberPicker } from './number_picker';
import { Component } from './component.js';

import { Tooltip, Popover, OverlayTrigger, Overlay } from 'react-bootstrap';

import { useSignal, useComputed, Signal, useSignalEffect } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { h, Fragment } from 'preact';

interface InputPProps<ModObject, T, V = T> {
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


interface InputPPropsExternal<ModObject, T, V = T> {
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

function InputP<ModObject, T, V = T>(props : InputPProps<ModObject, T, V>) {
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

interface NPP<ModObject, T, V = T> extends InputPPropsExternal<ModObject, T, V> {
	float? : boolean;
	positive? : boolean;
}

function NumberPickerP<ModObject>(props: NPP<ModObject, number>) {
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

interface BSLP {
	stat: Stat;
	player: Player<any>;
}

const BonusStatsLink = (props: BSLP) => {
	let statName = getClassStatName(props.stat, props.player.getClass());
	let [shown, setShown] = useState(true);

	let picker = <Popover>
					<Popover.Body>
						<NumberPickerP
							modObject={props.player}
							label={`Bonus ${statName}`}
							extraCssClasses={['mb-0', 'bonus-stats-popover']}
							changedEvent={(player: Player<any>) => player.bonusStatsChangeEmitter}
							getValue={(player: Player<any>) => player.getBonusStats().getStat(props.stat)}
							setValue={(eventID: EventID, player: Player<any>, newValue: number) => {
								const bonusStats = player.getBonusStats().withStat(props.stat, newValue);
								player.setBonusStats(eventID, bonusStats);
								setShown(false);
							}}
					/>
					</Popover.Body>
				</Popover>;

	return (
		<OverlayTrigger
			trigger='click'
			placement='right'
			overlay={picker}
			//show={shown}
		>
			<a
				href="javascript:void(0)"
				class='add-bonus-stats text-white ms-2'
				data-bs-toggle='popover'
				role={'button'}
			>
				<i class="fas fa-plus-minus"></i>
			</a>
		</OverlayTrigger>
	)
}

interface ISP {
	player: Player<any>;
	idx: number;
	stat: Stat;
	baseStats: Stats;
	baseDelta: Stats;

	gearStats: Stats;
	gearDelta: Stats;

	talentsStats: Stats;
	talentsDelta: Stats;

	buffsStats: Stats;
	buffsDelta: Stats;

	consumesStats: Stats;
	consumesDelta: Stats;

	finalStats: Stats;
	bonusStats: Stats;

	debuffStats: Stats;
}

const IndividualStat = (props: ISP) => {
	const statDisplayString = (stats: Stats, deltaStats: Stats, stat: Stat): string => {
		let rawValue = deltaStats.getStat(stat);

		if (stat == Stat.StatBlockValue) {
			rawValue *= stats.getPseudoStat(PseudoStat.PseudoStatBlockValueMultiplier) || 1;
		}

		let displayStr = String(Math.round(rawValue));

		if (stat == Stat.StatMeleeHit) {
			displayStr += ` (${(rawValue / Mechanics.MELEE_HIT_RATING_PER_HIT_CHANCE).toFixed(2)}%)`;
		} else if (stat == Stat.StatSpellHit) {
			displayStr += ` (${(rawValue / Mechanics.SPELL_HIT_RATING_PER_HIT_CHANCE).toFixed(2)}%)`;
		} else if (stat == Stat.StatMeleeCrit || stat == Stat.StatSpellCrit) {
			displayStr += ` (${(rawValue / Mechanics.SPELL_CRIT_RATING_PER_CRIT_CHANCE).toFixed(2)}%)`;
		} else if (stat == Stat.StatMeleeHaste) {
			if ([Class.ClassDruid, Class.ClassShaman, Class.ClassPaladin, Class.ClassDeathknight].includes(props.player.getClass())) {
				displayStr += ` (${(rawValue / Mechanics.SPECIAL_MELEE_HASTE_RATING_PER_HASTE_PERCENT).toFixed(2)}%)`;
			} else {
				displayStr += ` (${(rawValue / Mechanics.HASTE_RATING_PER_HASTE_PERCENT).toFixed(2)}%)`;
			}
		} else if (stat == Stat.StatSpellHaste) {
			displayStr += ` (${(rawValue / Mechanics.HASTE_RATING_PER_HASTE_PERCENT).toFixed(2)}%)`;
		} else if (stat == Stat.StatArmorPenetration) {
			displayStr += ` (${(rawValue / Mechanics.ARMOR_PEN_PER_PERCENT_ARMOR).toFixed(2)}%)`;
		} else if (stat == Stat.StatExpertise) {
			// As of 06/20, Blizzard has changed Expertise to no longer truncate at quarter percent intervals. Note that
			// in-game character sheet tooltips will still display the truncated values, but it has been tested to behave
			// continuously in reality since the patch.
			displayStr += ` (${(rawValue / Mechanics.EXPERTISE_PER_QUARTER_PERCENT_REDUCTION / 4).toFixed(2)}%)`;
		} else if (stat == Stat.StatDefense) {
			displayStr += ` (${(Mechanics.CHARACTER_LEVEL * 5 + Math.floor(rawValue / Mechanics.DEFENSE_RATING_PER_DEFENSE)).toFixed(0)})`;
		} else if (stat == Stat.StatBlock) {
			// TODO: Figure out how to display these differently for the components than the final value
			//displayStr += ` (${(rawValue / Mechanics.BLOCK_RATING_PER_BLOCK_CHANCE).toFixed(2)}%)`;
			displayStr += ` (${((rawValue / Mechanics.BLOCK_RATING_PER_BLOCK_CHANCE) + (Mechanics.MISS_DODGE_PARRY_BLOCK_CRIT_CHANCE_PER_DEFENSE * Math.floor(stats.getStat(Stat.StatDefense) / Mechanics.DEFENSE_RATING_PER_DEFENSE)) + 5.00).toFixed(2)}%)`;
		} else if (stat == Stat.StatDodge) {
			//displayStr += ` (${(rawValue / Mechanics.DODGE_RATING_PER_DODGE_CHANCE).toFixed(2)}%)`;
			displayStr += ` (${(stats.getPseudoStat(PseudoStat.PseudoStatDodge) * 100).toFixed(2)}%)`;
		} else if (stat == Stat.StatParry) {
			//displayStr += ` (${(rawValue / Mechanics.PARRY_RATING_PER_PARRY_CHANCE).toFixed(2)}%)`;
			displayStr += ` (${(stats.getPseudoStat(PseudoStat.PseudoStatParry) * 100).toFixed(2)}%)`;
		} else if (stat == Stat.StatResilience) {
			displayStr += ` (${(rawValue / Mechanics.RESILIENCE_RATING_PER_CRIT_REDUCTION_CHANCE).toFixed(2)}%)`;
		}

		return displayStr;
	}
	let bonusStatValue = props.bonusStats.getStat(props.stat);

	let tooltipContent = 
	<div>
		<div className="character-stats-tooltip-row">
			<span>Base:</span>
			<span>{statDisplayString(props.baseStats, props.baseDelta, props.stat)}</span>
		</div>
		<div className="character-stats-tooltip-row">
			<span>Gear:</span>
			<span>{statDisplayString(props.gearStats, props.gearDelta, props.stat)}</span>
		</div>
		<div className="character-stats-tooltip-row">
			<span>Talents:</span>
			<span>{statDisplayString(props.talentsStats, props.talentsDelta, props.stat)}</span>
		</div>
		<div className="character-stats-tooltip-row">
			<span>Buffs:</span>
			<span>{statDisplayString(props.buffsStats, props.buffsDelta, props.stat)}</span>
		</div>
		<div className="character-stats-tooltip-row">
			<span>Consumes:</span>
			<span>{statDisplayString(props.consumesStats, props.consumesDelta, props.stat)}</span>
		</div>
		{props.debuffStats.getStat(props.stat) != 0 &&
		<div className="character-stats-tooltip-row">
			<span>Debuffs:</span>
			<span>{statDisplayString(props.debuffStats, props.debuffStats, props.stat)}</span>
		</div>
		}
		{bonusStatValue != 0 &&
		<div className="character-stats-tooltip-row">
			<span>Bonus:</span>
			<span>{statDisplayString(props.bonusStats, props.bonusStats, props.stat)}</span>
		</div>
		}
		<div className="character-stats-tooltip-row">
			<span>Total:</span>
			<span>{statDisplayString(props.finalStats, props.finalStats, props.stat)}</span>
		</div>
	</div>;

	let bonusClass = bonusStatValue == 0 ? 'text-white' : bonusStatValue > 0 ? 'text-success' : 'text-danger';

	return(
		<OverlayTrigger
			overlay={<Tooltip>{tooltipContent}</Tooltip>}
			trigger='hover'
		>
		<a
			href="javascript:void(0)" 
			className={`stat-value-link ${bonusClass}`}
			role='button'>
			{`${statDisplayString(props.finalStats, props.finalStats, props.stat)} `}
		</a>
		</OverlayTrigger>
	)
}

interface McctProps {
	player: Player<any>,
	finalStats: Stats,
}

const MeleeCritCapTooltip = (props: McctProps) => {
	const meleeCritCapInfo = props.player.getMeleeCritCapInfo();

	const meleeCritCapDisplayString = (player: Player<any>, finalStats: Stats): string => {
		const playerCritCapDelta = player.getMeleeCritCap();

		if(playerCritCapDelta === 0.0) {
			return 'Exact';
		}

		const prefix = playerCritCapDelta > 0 ? 'Over by ' : 'Under by ';
		return `${prefix} ${Math.abs(playerCritCapDelta).toFixed(2)}%`;
	}

	const tooltipContent = (
		<div>
			<div className="character-stats-tooltip-row">
				<span>Glancing:</span>
				<span>{`${meleeCritCapInfo.glancing.toFixed(2)}%`}</span>
			</div>
			<div className="character-stats-tooltip-row">
				<span>Suppression:</span>
				<span>{`${meleeCritCapInfo.suppression.toFixed(2)}%`}</span>
			</div>
			<div className="character-stats-tooltip-row">
				<span>To Hit Cap:</span>
				<span>{`${meleeCritCapInfo.remainingMeleeHitCap.toFixed(2)}%`}</span>
			</div>
			<div className="character-stats-tooltip-row">
				<span>To Exp Cap:</span>
				<span>{`${meleeCritCapInfo.remainingExpertiseCap.toFixed(2)}%`}</span>
			</div>
			<div className="character-stats-tooltip-row">
				<span>Debuffs:</span>
				<span>{`${meleeCritCapInfo.debuffCrit.toFixed(2)}%`}</span>
			</div>
			{meleeCritCapInfo.specSpecificOffset != 0 &&
			<div className="character-stats-tooltip-row">
				<span>Spec Offsets:</span>
				<span>{`${meleeCritCapInfo.specSpecificOffset.toFixed(2)}%`}</span>
			</div>
			}
			<div className="character-stats-tooltip-row">
				<span>Final Crit Cap:</span>
				<span>{`${meleeCritCapInfo.baseCritCap.toFixed(2)}%`}</span>
			</div>
			<hr/>
			<div className="character-stats-tooltip-row">
				<span>Can Raise By:</span>
				<span>{`${(meleeCritCapInfo.remainingExpertiseCap + meleeCritCapInfo.remainingMeleeHitCap).toFixed(2)}%`}</span>
			</div>
		</div>
	);

	const capDelta = meleeCritCapInfo.playerCritCapDelta;
	let bonusClass = capDelta == 0 ? 'text-white' : capDelta < 0 ? 'text-success' : 'text-danger';

	let aref = useRef(null);
	return (
		<a
			ref={aref}
			href="javascript:void(0)"
			class={`stat-value-link ${bonusClass}`}
			role="button">
			{`${meleeCritCapDisplayString(props.player, props.finalStats)} `}
			<Overlay target={aref}>
				<Tooltip>{tooltipContent}</Tooltip>
			</Overlay>
		</a>
	)
}

export type StatMods = { talents: Stats };

export interface CSP {
	player: Player<any>;
	stats: Array<Stat>;
	modifyDisplayStats?: (player: Player<any>) => StatMods
}

export const CharacterStatsPreact = (props: CSP) => {
	let stats = statOrder.filter(stat => props.stats.includes(stat));
	let [playerStats, setPlayerStats] = useState(props.player.getCurrentStats());

	useEffect(() => {
		TypedEvent.onAny([props.player.currentStatsEmitter, props.player.sim.changeEmitter, props.player.talentsChangeEmitter]).on(() => {
			setPlayerStats(props.player.getCurrentStats());
		});
		// fix me and clear event sub
	});

	const getDebuffStats = () => {
		let debuffStats = new Stats();

		const debuffs = props.player.sim.raid.getDebuffs();
		if (debuffs.misery || debuffs.faerieFire == TristateEffect.TristateEffectImproved) {
			debuffStats = debuffStats.addStat(Stat.StatSpellHit, 3 * Mechanics.SPELL_HIT_RATING_PER_HIT_CHANCE);
		}
		if (debuffs.totemOfWrath || debuffs.heartOfTheCrusader || debuffs.masterPoisoner) {
			debuffStats = debuffStats.addStat(Stat.StatSpellCrit, 3 * Mechanics.SPELL_CRIT_RATING_PER_CRIT_CHANCE);
			debuffStats = debuffStats.addStat(Stat.StatMeleeCrit, 3 * Mechanics.MELEE_CRIT_RATING_PER_CRIT_CHANCE);
		}
		if (debuffs.improvedScorch || debuffs.wintersChill || debuffs.shadowMastery) {
			debuffStats = debuffStats.addStat(Stat.StatSpellCrit, 5 * Mechanics.SPELL_CRIT_RATING_PER_CRIT_CHANCE);
		}

		return debuffStats;
	}

	const shouldShowMeleeCritCap = (player: Player<any>): boolean => {
		return [
			Spec.SpecDeathknight,
			Spec.SpecEnhancementShaman,
			Spec.SpecFeralDruid,
			Spec.SpecRetributionPaladin,
			Spec.SpecRogue,
			Spec.SpecWarrior
		].includes(player.spec);
	}

	const statMods = props.modifyDisplayStats ? props.modifyDisplayStats(props.player) : {
		talents: new Stats(),
	};

	const baseStats = Stats.fromProto(playerStats.baseStats);
	const gearStats = Stats.fromProto(playerStats.gearStats);
	const talentsStats = Stats.fromProto(playerStats.talentsStats);
	const buffsStats = Stats.fromProto(playerStats.buffsStats);
	const consumesStats = Stats.fromProto(playerStats.consumesStats);
	const debuffStats = getDebuffStats();
	const bonusStats = props.player.getBonusStats();

	const baseDelta = baseStats;
	const gearDelta = gearStats.subtract(baseStats).subtract(bonusStats);
	const talentsDelta = talentsStats.subtract(gearStats).add(statMods.talents);
	const buffsDelta = buffsStats.subtract(talentsStats);
	const consumesDelta = consumesStats.subtract(buffsStats);

	const finalStats = Stats.fromProto(playerStats.finalStats).add(statMods.talents).add(debuffStats);

	return (
		<div className='character-stats-root'>
			<label className='character-stats-label'>Stats</label>
			<table className='character-stats-table'>
				{
					stats.map((stat, idx) => {
						let statName = getClassStatName(stat, props.player.getClass());
			
						return (
						<tr className='character-stats-table-row'>	
							<td className="character-stats-table-label">{statName}</td>
							<td className="character-stats-table-value">
								<IndividualStat 
								player={props.player}
								idx={idx}
								stat={stat}
								baseStats={baseStats}
								baseDelta={baseDelta}
								gearStats={gearStats}
								gearDelta={gearDelta}
								talentsDelta={talentsDelta}
								talentsStats={talentsStats}
								buffsDelta={buffsDelta}
								buffsStats={buffsStats}
								consumesDelta={consumesDelta}
								consumesStats={consumesStats}
								finalStats={finalStats}
								bonusStats={bonusStats}
								debuffStats={debuffStats}/>
								<BonusStatsLink stat={stat} player={props.player} />
							</td>
						</tr>);
			
					})
				}
				{
					shouldShowMeleeCritCap(props.player) &&
					<tr className='character-stats-table-row'>
						<td className="character-stats-table-label">Melee Crit Cap</td>
						<td className="character-stats-table-value">
							<MeleeCritCapTooltip
								player={props.player}
								finalStats={finalStats}
							/>
						</td>
					</tr>
				}
			</table>
		</div>
	);
}
