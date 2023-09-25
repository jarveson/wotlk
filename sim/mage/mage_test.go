package mage

import (
	"log"
	"os"
	"testing"

	_ "github.com/wowsims/wotlk/sim/common"
	"github.com/wowsims/wotlk/sim/core"
	"github.com/wowsims/wotlk/sim/core/proto"
)

func init() {
	RegisterMage()
}

func GetAplRotation(dir string, file string) core.RotationCombo {
	filePath := dir + "/" + file + ".json"
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("failed to load apl json file: %s, %s", filePath, err)
	}

	return core.RotationCombo{Label: file, Rotation: core.APLRotationFromJsonString(string(data))}
}

func TestArcane(t *testing.T) {
	core.RunTestSuite(t, t.Name(), core.FullCharacterTestSuiteGenerator(core.CharacterSuiteConfig{
		Class: proto.Class_ClassMage,
		Race:  proto.Race_RaceTroll,

		GearSet:     core.GearSetCombo{Label: "P1Arcane", GearSet: P1ArcaneGear},
		Talents:     ArcaneTalents,
		Glyphs:      ArcaneGlyphs,
		Consumes:    FullArcaneConsumes,
		SpecOptions: core.SpecOptionsCombo{Label: "Arcane", SpecOptions: PlayerOptionsArcane},
		Rotation:    GetAplRotation("../../ui/mage/apls", "arcane"),
		OtherRotations: []core.RotationCombo{
			GetAplRotation("../../ui/mage/apls", "arcane_aoe"),
		},

		ItemFilter: ItemFilter,
	}))
}

func TestFire(t *testing.T) {
	core.RunTestSuite(t, t.Name(), core.FullCharacterTestSuiteGenerator(core.CharacterSuiteConfig{
		Class: proto.Class_ClassMage,
		Race:  proto.Race_RaceTroll,

		GearSet:     core.GearSetCombo{Label: "P1Fire", GearSet: P1FireGear},
		Talents:     FireTalents,
		Glyphs:      FireGlyphs,
		Consumes:    FullFireConsumes,
		SpecOptions: core.SpecOptionsCombo{Label: "Fire", SpecOptions: PlayerOptionsFire},
		Rotation:    GetAplRotation("../../ui/mage/apls", "fire"),
		OtherRotations: []core.RotationCombo{
			GetAplRotation("../../ui/mage/apls", "fire_aoe"),
		},

		ItemFilter: ItemFilter,
	}))
}

func TestFrostFire(t *testing.T) {
	core.RunTestSuite(t, t.Name(), core.FullCharacterTestSuiteGenerator(core.CharacterSuiteConfig{
		Class: proto.Class_ClassMage,
		Race:  proto.Race_RaceTroll,

		GearSet:     core.GearSetCombo{Label: "P1FrostFire", GearSet: P1FireGear},
		Talents:     FrostFireTalents,
		Glyphs:      FrostFireGlyphs,
		Consumes:    FullFireConsumes,
		SpecOptions: core.SpecOptionsCombo{Label: "Fire", SpecOptions: PlayerOptionsFire},
		Rotation:    GetAplRotation("../../ui/mage/apls", "frostfire"),

		ItemFilter: ItemFilter,
	}))
}

func TestFrost(t *testing.T) {
	core.RunTestSuite(t, t.Name(), core.FullCharacterTestSuiteGenerator(core.CharacterSuiteConfig{
		Class: proto.Class_ClassMage,
		Race:  proto.Race_RaceTroll,

		GearSet:     core.GearSetCombo{Label: "P1Frost", GearSet: P1FrostGear},
		Talents:     FrostTalents,
		Glyphs:      FrostGlyphs,
		Consumes:    FullFrostConsumes,
		SpecOptions: core.SpecOptionsCombo{Label: "Frost", SpecOptions: PlayerOptionsFrost},
		Rotation:    GetAplRotation("../../ui/mage/apls", "frost"),
		OtherRotations: []core.RotationCombo{
			GetAplRotation("../../ui/mage/apls", "frost_aoe"),
		},

		ItemFilter: ItemFilter,
	}))
}

var ItemFilter = core.ItemFilter{
	WeaponTypes: []proto.WeaponType{
		proto.WeaponType_WeaponTypeDagger,
		proto.WeaponType_WeaponTypeSword,
		proto.WeaponType_WeaponTypeOffHand,
		proto.WeaponType_WeaponTypeStaff,
	},
	ArmorType: proto.ArmorType_ArmorTypeCloth,
	RangedWeaponTypes: []proto.RangedWeaponType{
		proto.RangedWeaponType_RangedWeaponTypeWand,
	},
}

var ArcaneTalents = "23000513310033015032310250532-03-023303001"
var FireTalents = "23000503110003-0055030012303331053120301351"
var FrostFireTalents = "23000503110003-0055030012303331053120301351"
var FrostTalents = "23000503110003--0533030310233100030152231351"
var ArcaneGlyphs = &proto.Glyphs{
	Major1: int32(proto.MageMajorGlyph_GlyphOfArcaneBlast),
	Major2: int32(proto.MageMajorGlyph_GlyphOfArcaneMissiles),
	Major3: int32(proto.MageMajorGlyph_GlyphOfMoltenArmor),
}
var FireGlyphs = &proto.Glyphs{
	Major1: int32(proto.MageMajorGlyph_GlyphOfFireball),
	Major2: int32(proto.MageMajorGlyph_GlyphOfMoltenArmor),
	Major3: int32(proto.MageMajorGlyph_GlyphOfLivingBomb),
}
var FrostFireGlyphs = &proto.Glyphs{
	Major1: int32(proto.MageMajorGlyph_GlyphOfFrostfire),
	Major2: int32(proto.MageMajorGlyph_GlyphOfMoltenArmor),
	Major3: int32(proto.MageMajorGlyph_GlyphOfLivingBomb),
}
var FrostGlyphs = &proto.Glyphs{
	Major1: int32(proto.MageMajorGlyph_GlyphOfFrostbolt),
	Major3: int32(proto.MageMajorGlyph_GlyphOfEternalWater),
	Major2: int32(proto.MageMajorGlyph_GlyphOfMoltenArmor),
}

var PlayerOptionsFire = &proto.Player_Mage{
	Mage: &proto.Mage{
		Options: &proto.Mage_Options{
			Armor:          proto.Mage_Options_MoltenArmor,
			IgniteMunching: true,
		},
		Rotation: &proto.Mage_Rotation{},
	},
}

var PlayerOptionsFrost = &proto.Player_Mage{
	Mage: &proto.Mage{
		Options: &proto.Mage_Options{
			Armor: proto.Mage_Options_MageArmor,
		},
		Rotation: &proto.Mage_Rotation{},
	},
}

var PlayerOptionsArcane = &proto.Player_Mage{
	Mage: &proto.Mage{
		Options: &proto.Mage_Options{
			Armor: proto.Mage_Options_MoltenArmor,
		},
		Rotation: &proto.Mage_Rotation{},
	},
}

var FullFireConsumes = &proto.Consumes{
	Flask:         proto.Flask_FlaskOfTheFrostWyrm,
	Food:          proto.Food_FoodFirecrackerSalmon,
	DefaultPotion: proto.Potions_PotionOfSpeed,
}
var FullFrostConsumes = FullFireConsumes

var FullArcaneConsumes = FullFireConsumes

var P1ArcaneGear = core.EquipmentSpecFromJsonString(`{"items": [
	{"id":40416,"enchant":3820,"gems":[41285,39998]},
	{"id":44661,"gems":[40026]},
	{"id":40419,"enchant":3810,"gems":[40051]},
	{"id":44005,"enchant":3722,"gems":[40026]},
	{"id":44002,"enchant":3832,"gems":[39998,39998]},
	{"id":44008,"enchant":2332,"gems":[39998,0]},
	{"id":40415,"enchant":3604,"gems":[39998,0]},
	{"id":40561,"gems":[39998]},
	{"id":40417,"enchant":3719,"gems":[39998,40051]},
	{"id":40558,"enchant":3606},
	{"id":40719},
	{"id":40399},
	{"id":39229},
	{"id":40255},
	{"id":40396,"enchant":3834},
	{"id":40273},
	{"id":39426}
]}`)
var P1FrostGear = P1ArcaneGear
var P1FireGear = P1ArcaneGear
