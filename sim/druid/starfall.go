package druid

import (
	"strconv"
	"time"

	"github.com/wowsims/wotlk/sim/core"
	"github.com/wowsims/wotlk/sim/core/stats"
)

// We register two spells to apply two different dot effects and get two entries in Damage/Detailed results
func (druid *Druid) registerStarfallSpell() {
	if !druid.Talents.Starfall {
		return
	}
	baseCost := druid.BaseMana * 0.35
	target := druid.CurrentTarget

	numberOfTicks := core.TernaryInt(druid.Env.GetNumTargets() > 1, 20, 10)
	tickLength := core.TernaryDuration(druid.Env.GetNumTargets() > 1, time.Millisecond*500, time.Millisecond*1000)

	druid.Starfall = druid.RegisterSpell(core.SpellConfig{
		ActionID:    core.ActionID{SpellID: 53201},
		SpellSchool: core.SpellSchoolArcane,

		ResourceType: stats.Mana,
		BaseCost:     baseCost,

		Cast: core.CastConfig{
			DefaultCast: core.Cast{
				Cost: baseCost,
				GCD:  core.GCDDefault,
			},
			CD: core.Cooldown{
				Timer:    druid.NewTimer(),
				Duration: time.Second * 90,
			},
		},

		ApplyEffects: core.ApplyEffectFuncDirectDamage(core.SpellEffect{
			ProcMask:         core.ProcMaskSpellDamage,
			DamageMultiplier: 1,
			ThreatMultiplier: 1,
			OutcomeApplier:   druid.OutcomeFuncMagicHit(),
			OnSpellHitDealt: func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
				if spellEffect.Landed() {
					druid.StarfallDot.Apply(sim)
					druid.StarfallSplash.Cast(sim, target)
				}
			},
		}),
	})

	druid.StarfallSplash = druid.RegisterSpell(core.SpellConfig{
		ActionID:    core.ActionID{SpellID: 53190},
		SpellSchool: core.SpellSchoolArcane,

		Cast: core.CastConfig{
			CD: core.Cooldown{
				Timer:    druid.NewTimer(),
				Duration: time.Second * 90,
			},
		},

		ApplyEffects: core.ApplyEffectFuncDirectDamage(core.SpellEffect{
			ProcMask:         core.ProcMaskSpellDamage,
			DamageMultiplier: 1,
			ThreatMultiplier: 1,
			OutcomeApplier:   druid.OutcomeFuncMagicHit(),
			OnSpellHitDealt: func(sim *core.Simulation, spell *core.Spell, spellEffect *core.SpellEffect) {
				if spellEffect.Landed() {
					druid.StarfallDotSplash.Apply(sim)
				}
			},
		}),
	})

	druid.StarfallDot = core.NewDot(core.Dot{
		Spell: druid.Starfall,
		Aura: target.RegisterAura(core.Aura{
			Label:    "Starfall-" + strconv.Itoa(int(druid.Index)),
			ActionID: core.ActionID{SpellID: 53201},
		}),
		NumberOfTicks: numberOfTicks,
		TickLength:    tickLength,
		TickEffects: core.TickFuncSnapshot(target, core.SpellEffect{
			ProcMask:         core.ProcMaskPeriodicDamage,
			DamageMultiplier: 1,
			ThreatMultiplier: 1,
			IsPeriodic:       true,
			BaseDamage:       core.BaseDamageConfigMagic(563, 653, 0.127),
			OutcomeApplier:   druid.OutcomeFuncTick(),
		}),
	})

	druid.StarfallDotSplash = core.NewDot(core.Dot{
		Spell: druid.StarfallSplash,
		Aura: target.RegisterAura(core.Aura{
			Label:    "StarfallSplash-" + strconv.Itoa(int(druid.Index)),
			ActionID: core.ActionID{SpellID: 53190},
		}),
		NumberOfTicks: numberOfTicks,
		TickLength:    tickLength,
		TickEffects: core.TickFuncApplyEffects(core.ApplyEffectFuncAOEDamage(druid.Env, core.SpellEffect{
			ProcMask:         core.ProcMaskPeriodicDamage,
			DamageMultiplier: 1,
			ThreatMultiplier: 1,
			IsPeriodic:       true,
			BaseDamage:       core.BaseDamageConfigMagicNoRoll(101, 0.127),
			OutcomeApplier:   druid.OutcomeFuncTick(),
		})),
	})
}
