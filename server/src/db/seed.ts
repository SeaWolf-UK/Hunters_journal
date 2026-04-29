import Database from 'better-sqlite3';

const SEED_CREATURES = [
  {
    name: 'Red Dragon', type: 'dragon', subtype: 'chromatic', size: 'huge', challenge: 17,
    alignment: 'chaotic evil', armor_class: 19, hit_points: 256,
    speed: '40 ft., climb 40 ft., fly 80 ft.', senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 23',
    languages: 'Common, Draconic', damage_types: 'fire', habitats: 'mountains, volcanoes, rocky caves',
    movement_modes: 'walking, climbing, flying',
    physical_descriptors: 'massive scaled body, sweeping horns, bat-like wings, crimson scales that gleam in light, smoke curling from nostrils',
    behavioral_descriptors: 'arrogant, territorial, obsessive hoarder of treasure, views all other creatures as lesser beings',
    sensory_clues: 'sulfur smell, distant roar echoing through canyons, heat shimmer in the air',
    spoor_clues: 'charred ground, claw marks scoring stone, molten slag where breath weapon struck, enormous tracks',
    status_effects: 'frightened',
    traits: JSON.stringify([
      { name: 'Fire Breath', text: 'Exhales fire in a 90-foot cone. DC 21 DEX save. 63 (18d6) fire damage on a failed save, half on success.' },
      { name: 'Legendary Resistance (3/Day)', text: 'If the dragon fails a saving throw, it can choose to succeed instead.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'Frightful Presence, then one Bite and two Claws.' },
      { name: 'Bite', text: '+14 to hit, 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage.' },
      { name: 'Claw', text: '+14 to hit, 15 (2d6 + 8) slashing damage.' }
    ]),
    description: 'The most covetous and arrogant of chromatic dragons. Red dragons lair in mountainous caverns and volcanic peaks, amassing vast hoards of treasure. Everything about them is oversized — their greed, their rage, and the devastation they leave behind.',
    lore_summary: 'A creature of devastating fire and overwhelming pride. Red dragons burn first and negotiate only when treasure is at stake. They see themselves as apex predators, and all evidence supports this belief.',
    source: 'SRD'
  },
  {
    name: 'Black Dragon', type: 'dragon', subtype: 'chromatic', size: 'large', challenge: 7,
    alignment: 'chaotic evil', armor_class: 18, hit_points: 127,
    speed: '40 ft., fly 80 ft., swim 40 ft.', senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 16',
    languages: 'Common, Draconic', damage_types: 'acid', habitats: 'swamps, bogs, fens, marshes, murky wetlands',
    movement_modes: 'walking, flying, swimming',
    physical_descriptors: 'sleek black scales, forward-swept horns, sunken eyes, skull-like facial structure, acidic saliva that sizzles on contact',
    behavioral_descriptors: 'cruel, patient, sadistic, prefers to watch prey suffer, lurks in ambush rather than direct confrontation',
    sensory_clues: 'acrid vinegar smell, hissing from murky water, dead and dissolving vegetation nearby',
    spoor_clues: 'melted and pitted stone from acid, bones dissolved and pitted, slime trails leading to water, tracks in soft mud',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Acid Breath', text: 'Exhales acid in a 60-foot line. DC 14 DEX save. 49 (11d8) acid damage on a failed save, half on success.' },
      { name: 'Amphibious', text: 'The dragon can breathe both air and water.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'Frightful Presence, then one Bite and two Claws.' },
      { name: 'Bite', text: '+11 to hit, 15 (2d10 + 4) piercing damage plus 4 (1d8) acid damage.' }
    ]),
    description: 'Black dragons inhabit fetid swamps and stagnant bogs, lurking just beneath the surface of murky water. They are patient ambush predators who enjoy the slow suffering of their prey.',
    lore_summary: 'Swamp-dwelling ambush predator with acidic breath. Black dragons are cruel in ways the other chromatics find excessive. They dissolve their victims slowly and watch with detached interest.',
    source: 'SRD'
  },
  {
    name: 'Green Dragon', type: 'dragon', subtype: 'chromatic', size: 'large', challenge: 8,
    alignment: 'lawful evil', armor_class: 18, hit_points: 136,
    speed: '40 ft., fly 80 ft., swim 40 ft.', senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 17',
    languages: 'Common, Draconic', damage_types: 'poison', habitats: 'forests, jungles, ancient woodlands, overgrown ruins',
    movement_modes: 'walking, flying, swimming',
    physical_descriptors: 'emerald scales, a crest of horns sweeping back from the brow, long sinuous neck, subtle camoflage among foliage',
    behavioral_descriptors: 'manipulative, deceptive, collects secrets and living servants rather than gold, patient schemer',
    sensory_clues: 'sickly sweet floral odor, unnaturally quiet forest sections, animals behaving oddly',
    spoor_clues: 'withered and blackened vegetation in a trail, dead birds and small animals with no visible wounds, poisonous residue on surfaces',
    status_effects: 'poisoned',
    traits: JSON.stringify([
      { name: 'Poison Breath', text: 'Exhales poisonous gas in a 60-foot cone. DC 16 CON save. 56 (16d6) poison damage on a failed save, half on success.' },
      { name: 'Amphibious', text: 'The dragon can breathe both air and water.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'Frightful Presence, then one Bite and two Claws.' },
      { name: 'Bite', text: '+11 to hit, 17 (2d10 + 6) piercing damage plus 7 (2d6) poison damage.' }
    ]),
    description: 'Green dragons are the political schemers of dragonkind. They lair in ancient forests and collect influence the way reds collect gold — obsessively. They prefer to corrupt and manipulate rather than destroy outright.',
    lore_summary: 'A forest predator that exhales poisonous gas. Greens are the liars and schemers, hoarding secrets and living puppets. If you find a patch of dead forest, a green dragon may have claimed it.',
    source: 'SRD'
  },
  {
    name: 'Blue Dragon', type: 'dragon', subtype: 'chromatic', size: 'large', challenge: 9,
    alignment: 'lawful evil', armor_class: 18, hit_points: 152,
    speed: '40 ft., burrow 30 ft., fly 80 ft.', senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 17',
    languages: 'Common, Draconic', damage_types: 'lightning', habitats: 'deserts, arid plains, rocky badlands, coastal cliffs',
    movement_modes: 'walking, burrowing, flying',
    physical_descriptors: 'azure scales with a metallic sheen, a prominent nose horn, swept-back frills along the jaw, crackling static in the air around it',
    behavioral_descriptors: 'vain, orderly, hierarchical, patient, excellent strategist, uses minions in coordinated attacks',
    sensory_clues: 'ozone smell before storms, static electricity in the air, distant thunder on clear days, sand vibrating',
    spoor_clues: 'vitrified sand turned to glass from lightning, burrow tunnels in sandstone, organized tracks suggesting patrol patterns',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Lightning Breath', text: 'Exhales lightning in a 90-foot line. DC 16 DEX save. 66 (12d10) lightning damage on a failed save, half on success.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'Frightful Presence, then one Bite and two Claws.' },
      { name: 'Bite', text: '+12 to hit, 18 (2d10 + 7) piercing damage plus 5 (1d10) lightning damage.' }
    ]),
    description: 'Blue dragons hunt the arid deserts, carving burrows into sandstone cliffs. They are the most organized of the chromatic dragons, using coordinated tactics and hired minions rather than mindless rage.',
    lore_summary: 'The desert strategist. Blue dragons exhale lightning and burrow through sand and stone. They value hierarchy and order — their order, with themselves at the top and everyone else far below.',
    source: 'SRD'
  },
  {
    name: 'White Dragon', type: 'dragon', subtype: 'chromatic', size: 'large', challenge: 2,
    alignment: 'chaotic evil', armor_class: 15, hit_points: 133,
    speed: '40 ft., burrow 20 ft., fly 80 ft., swim 40 ft.', senses: 'blindsight 60 ft., darkvision 120 ft., passive Perception 13',
    languages: 'Common, Draconic', damage_types: 'cold', habitats: 'arctic tundra, frozen mountains, glacial caves, ice sheets',
    movement_modes: 'walking, burrowing, flying, swimming',
    physical_descriptors: 'pale white scales, a crest of spines along the neck, translucent frost forming on its hide, lean build',
    behavioral_descriptors: 'primal, bestial, hungry, reactive rather than calculating, poor memory, driven by immediate need',
    sensory_clues: 'sudden temperature drops, frost forming in patterns, the smell of frozen meat, complete unnatural silence',
    spoor_clues: 'frozen corpses of prey animals, ice-rimed cave entrances, frost trails on surfaces, partially eaten frozen carcasses',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Cold Breath', text: 'Exhales frost in a 60-foot cone. DC 12 CON save. 31 (7d8) cold damage on a failed save, half on success.' },
      { name: 'Ice Walk', text: 'The dragon can move across icy surfaces without needing to make an ability check.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'Frightful Presence, then one Bite and two Claws.' },
      { name: 'Bite', text: '+6 to hit, 11 (2d8 + 2) piercing damage plus 3 (1d8) cold damage.' }
    ]),
    description: 'White dragons are the smallest, most animalistic, and least intelligent of the chromatic dragons. They inhabit frozen wastes and glacial caves, hunting with pure instinct rather than strategy.',
    lore_summary: 'The arctic predator. Whites are pure hunger wrapped in frost — less cunning than their kin but no less lethal in their frozen domain. They freeze prey first and ask no questions.',
    source: 'SRD'
  },
  {
    name: 'Lich', type: 'undead', subtype: '', size: 'medium', challenge: 21,
    alignment: 'any evil', armor_class: 17, hit_points: 135,
    speed: '30 ft.', senses: 'truesight 120 ft., passive Perception 19',
    languages: 'Common, plus up to five other languages', damage_types: 'necrotic, cold, lightning, poison',
    habitats: 'ancient tombs, ruined towers, hidden sanctums, demiplanes',
    movement_modes: 'walking',
    physical_descriptors: 'desiccated corpse, skeletal frame, pinpoints of light in hollow eye sockets, elaborate robes now rotting, jewelry and arcane implements',
    behavioral_descriptors: 'calculating, patient, obsessed with arcane secrets, views mortal lifespans as beneath consideration, long-term schemer',
    sensory_clues: 'the smell of dust and old parchment, a bone-deep chill, the faint sound of arcane whispering, candles flickering without wind',
    spoor_clues: 'warded areas, drained life from surroundings, books and scrolls of forbidden knowledge, destroyed phylacteries nearby',
    status_effects: 'paralyzed, frightened, poisoned',
    traits: JSON.stringify([
      { name: 'Spellcasting', text: 'The lich is an 18th-level spellcaster. Spell save DC 20, +12 to hit.' },
      { name: 'Paralyzing Touch', text: 'Melee spell attack, +12 to hit, 10 (3d6) cold damage. Target must succeed on DC 18 CON save or be paralyzed for 1 minute.' },
      { name: 'Turn Resistance', text: 'The lich has advantage on saving throws against any effect that turns undead.' }
    ]),
    actions: JSON.stringify([
      { name: 'Disrupt Life', text: 'Each non-undead creature within 20 feet must make a DC 18 CON save, taking 21 (6d6) necrotic damage on a failed save.' }
    ]),
    description: 'A lich is the remains of a powerful spellcaster who has cheated death through forbidden rituals, binding their soul into a phylactery to achieve a twisted immortality.',
    lore_summary: 'A spellcaster who defied death itself. Liches trade their humanity for eternity and arcane supremacy. They lair in places of ancient power and spend centuries perfecting rituals normal wizards cannot conceive.',
    source: 'SRD'
  },
  {
    name: 'Vampire', type: 'undead', subtype: 'shapechanger', size: 'medium', challenge: 13,
    alignment: 'lawful evil', armor_class: 16, hit_points: 144,
    speed: '30 ft.', senses: 'darkvision 120 ft., passive Perception 17',
    languages: 'the languages it knew in life', damage_types: 'necrotic',
    habitats: 'ancient castles, crypts, ruined mansions, urban underworld',
    movement_modes: 'walking, climbing',
    physical_descriptors: 'pale skin, elongated canines, gaunt features, dressed in fine but dated clothing, casts no reflection',
    behavioral_descriptors: 'seductive, predatory, aristocratic, territorial, obsessed with power and beauty, bound by strange compulsions',
    sensory_clues: 'a faint coppery smell of old blood, unnatural chill in the air, the whisper of bats, locals with unexplained bite marks',
    spoor_clues: 'drained corpses with twin puncture wounds, coffins filled with grave soil, missing persons last seen near old estates',
    status_effects: 'charmed, frightened',
    traits: JSON.stringify([
      { name: 'Children of the Night', text: 'Magically calls 2d4 swarms of bats or rats, or 1d4 wolves.' },
      { name: 'Regeneration', text: 'Regains 20 hit points at the start of its turn if it has at least 1 hit point, unless in sunlight or running water.' },
      { name: 'Misty Escape', text: 'When reduced to 0 hit points, transforms into mist and returns to its resting place.' }
    ]),
    actions: JSON.stringify([
      { name: 'Bite', text: "+9 to hit, 7 (1d6 + 4) piercing damage plus 10 (3d6) necrotic damage. Target's hit point maximum reduced." },
      { name: 'Charm', text: 'One humanoid the vampire can see must succeed on DC 17 WIS save or be charmed.' }
    ]),
    description: 'Vampires are undead creatures that sustain their existence by drinking the blood of the living. They retain the intelligence and personality they possessed in life, twisted by an eternal hunger.',
    lore_summary: 'An undead aristocrat sustained by blood. Vampires charm, regenerate, and refuse to die permanently. They cannot enter homes uninvited and are repelled by sunlight and running water — but they rarely give you the chance to exploit those weaknesses.',
    source: 'SRD'
  },
  {
    name: 'Beholder', type: 'aberration', subtype: '', size: 'large', challenge: 13,
    alignment: 'lawful evil', armor_class: 18, hit_points: 180,
    speed: '0 ft., fly 20 ft.', senses: 'darkvision 120 ft., passive Perception 22',
    languages: 'Deep Speech, Undercommon', damage_types: '',
    habitats: 'underdark caverns, deep subterranean vaults, forgotten temple complexes',
    movement_modes: 'flying (hover)',
    physical_descriptors: 'spherical body dominated by a central eye, ten eye stalks on flexible appendages, wide toothy mouth, mottled chitinous hide',
    behavioral_descriptors: 'paranoid, narcissistic, xenophobic, believes itself to be the perfect being and all others to be flawed abominations',
    sensory_clues: 'faint humming of arcane energy, the feeling of being watched, perfectly carved geometric tunnels, petrified creatures in lifelike poses',
    spoor_clues: 'disintegrated dust piles, charmed or confused creatures wandering aimlessly, perfectly smooth circular tunnels',
    status_effects: 'charmed, frightened, paralyzed, petrified, slowed',
    traits: JSON.stringify([
      { name: 'Antimagic Cone', text: "The beholder's central eye creates a 150-foot cone of antimagic." },
      { name: 'Eye Rays', text: 'The beholder shoots up to three random magical eye rays at targets: Charm, Paralyzing, Fear, Slowing, Enervation, Telekinetic, Sleep, Petrification, Disintegration, or Death.' }
    ]),
    actions: JSON.stringify([
      { name: 'Bite', text: '+5 to hit, 14 (4d6) piercing damage.' }
    ]),
    description: 'A beholder is a floating orb of flesh dominated by a single enormous eye and crowned with ten eyestalks, each capable of unleashing a different devastating magical effect.',
    lore_summary: 'A floating nightmare of eyes and magic. Beholders see themselves as perfect beings and reshape their underground lairs into paranoid fortresses. Every eye is a different way to die.',
    source: 'SRD'
  },
  {
    name: 'Mind Flayer', type: 'aberration', subtype: '', size: 'medium', challenge: 7,
    alignment: 'lawful evil', armor_class: 15, hit_points: 71,
    speed: '30 ft.', senses: 'darkvision 120 ft., passive Perception 16',
    languages: 'Deep Speech, Undercommon, telepathy 120 ft.', damage_types: 'psychic',
    habitats: 'underdark cities, deep subterranean fortresses, alien vessels',
    movement_modes: 'walking',
    physical_descriptors: 'humanoid frame with slick mauve skin, an octopoid head with four tentacles surrounding a lamprey-like mouth, elongated three-fingered hands',
    behavioral_descriptors: 'alien intelligence, views humanoids as cattle, hive-minded, utterly pragmatic, cold and clinical in cruelty',
    sensory_clues: 'the faint psychic pressure of telepathic presence, a slime residue on surfaces, missing persons from isolated settlements',
    spoor_clues: 'bodies with missing brains and crushed skulls, mind-controlled thralls acting strangely, psychic static in an area',
    status_effects: 'stunned, charmed',
    traits: JSON.stringify([
      { name: 'Mind Blast', text: 'The mind flayer emits psychic energy in a 60-foot cone. DC 15 INT save or take 22 (4d8 + 4) psychic damage and be stunned for 1 minute.' },
      { name: 'Extract Brain', text: 'Melee attack against an incapacitated humanoid, +7 to hit, 55 (10d10) piercing damage. If this reduces target to 0 hit points, the illithid consumes the brain.' }
    ]),
    actions: JSON.stringify([
      { name: 'Tentacles', text: '+7 to hit, 15 (2d10 + 4) psychic damage. If target is Medium or smaller, grappled (escape DC 15).' }
    ]),
    description: 'Mind flayers, also called illithids, are psionic aberrations that consume the brains of sentient creatures. They dwell in the deep Underdark and harbor ambitions of reclaiming the surface world they once ruled.',
    lore_summary: 'A psionic brain-eater from the deep. Mind flayers stun with a mental blast, then extract your brain. They think in ways humanoids cannot comprehend — you are cattle to them, and the whole of history is their reclamation project.',
    source: 'SRD'
  },
  {
    name: 'Owlbear', type: 'monstrosity', subtype: '', size: 'large', challenge: 3,
    alignment: 'unaligned', armor_class: 13, hit_points: 59,
    speed: '40 ft.', senses: 'darkvision 60 ft., passive Perception 13',
    languages: '', damage_types: '', habitats: 'dense forests, wooded hills, caves',
    movement_modes: 'walking',
    physical_descriptors: 'bear-like body covered in shaggy brown feathers, the head of an owl with a hooked beak, enormous round eyes, taloned forepaws',
    behavioral_descriptors: 'aggressively territorial, attacks on sight, protective of young to suicidal degree, hunts mainly at dusk and dawn',
    sensory_clues: 'deep hooting screech echoing through the woods, scattered bones and fur at a feeding site, clawed-up trees marking territory',
    spoor_clues: 'large tracks mixing claw and talon marks, tufts of feather-fur on branches, ravaged nests and dens of other creatures',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Keen Sight and Smell', text: 'The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'The owlbear makes two attacks: one with its beak and one with its claws.' },
      { name: 'Beak', text: '+7 to hit, 10 (1d10 + 5) piercing damage.' },
      { name: 'Claws', text: '+7 to hit, 14 (2d8 + 5) slashing damage.' }
    ]),
    description: 'A bizarre fusion of bear and owl, likely the result of a wizard experiment gone awry. Owlbears are fiercely territorial and will attack anything that enters their domain.',
    lore_summary: 'An unnatural fusion of owl and bear. Some wizard, somewhere, thought this was a good idea. It was not. Owlbears are all claws, beak, and rage, and they do not negotiate.',
    source: 'SRD'
  },
  {
    name: 'Gelatinous Cube', type: 'ooze', subtype: '', size: 'large', challenge: 2,
    alignment: 'unaligned', armor_class: 6, hit_points: 84,
    speed: '15 ft.', senses: 'blindsight 60 ft. (blind beyond this radius), passive Perception 8',
    languages: '', damage_types: 'acid', habitats: 'dungeons, underground corridors, ancient ruins, sewers',
    movement_modes: 'walking',
    physical_descriptors: 'a ten-foot cube of transparent, gelatinous matter, nearly invisible when stationary, faint shimmer when moving, bones and treasure suspended within',
    behavioral_descriptors: 'mindless, instinct-driven, endlessly patrols hallways and corridors, engulfs anything in its path',
    sensory_clues: 'faint acidic smell, unnaturally clean sections of dungeon floor, the faint wobble of suspended objects, missing dungeon debris',
    spoor_clues: 'perfectly clean stretches of dungeon floor and walls, dissolved organic matter, metal and stone objects deposited when cube moved on',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Transparent', text: 'Even when in plain sight, requires a successful DC 15 Wisdom (Perception) check to spot if it has not moved or attacked.' },
      { name: 'Engulf', text: 'The cube moves up to its speed. Creatures in its path must make a DC 12 DEX save or be engulfed, taking 10 (3d6) acid damage and being restrained.' }
    ]),
    actions: JSON.stringify([
      { name: 'Pseudopod', text: '+4 to hit, 10 (3d6) acid damage.' }
    ]),
    description: 'A gelatinous cube is a nearly-transparent ooze that slides through dungeon corridors, absorbing everything in its path. Detritus, bones, and coins float suspended within its body.',
    lore_summary: 'The dungeon janitor you never see until you are inside it. Gelatinous cubes clean dungeon corridors by dissolving everything organic. If a stretch of dungeon looks suspiciously clean, probe ahead with a pole.',
    source: 'SRD'
  },
  {
    name: 'Displacer Beast', type: 'monstrosity', subtype: '', size: 'large', challenge: 3,
    alignment: 'lawful evil', armor_class: 13, hit_points: 85,
    speed: '40 ft.', senses: 'darkvision 60 ft., passive Perception 11',
    languages: '', damage_types: '',
    habitats: 'dark forests, the Feywild, twilight groves',
    movement_modes: 'walking',
    physical_descriptors: 'sleek panther-like body covered in blue-black fur, six legs, two spiked tentacles sprouting from shoulders, glowing green eyes',
    behavioral_descriptors: 'stealthy predator, enjoys the hunt, toys with prey, intelligent but malevolent, drawn to areas of strong emotion',
    sensory_clues: 'the disorienting visual displacement shimmer, a low growling purr, the smell of a large cat mixed with something alien',
    spoor_clues: 'six-toed paw prints, tentacle drag marks in soil, displaced objects (the beast appears where it is not), slain prey untouched after the kill',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Displacement', text: 'The displacer beast projects a magical illusion that makes it appear to be standing several feet from its actual location, granting attackers disadvantage on attack rolls.' },
      { name: 'Avoidance', text: 'If the displacer beast is subjected to an effect that allows a DEX save for half damage, it takes no damage on a success.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'The displacer beast makes two attacks with its tentacles.' },
      { name: 'Tentacle', text: '+6 to hit, reach 10 ft., 6 (1d6 + 3) bludgeoning damage plus 4 (1d8) piercing damage.' }
    ]),
    description: 'Displacer beasts are sleek, six-legged predators from the Feywild whose magical displacement ability makes them appear to occupy a different location than their actual physical position.',
    lore_summary: 'A six-legged panther that is never quite where you think it is. Displacer beasts bend light (and sanity) around themselves. Strike where the eyes say they are, and you will hit only air.',
    source: 'SRD'
  },
  {
    name: 'Goblin', type: 'humanoid', subtype: 'goblinoid', size: 'small', challenge: 0.25,
    alignment: 'neutral evil', armor_class: 15, hit_points: 7,
    speed: '30 ft.', senses: 'darkvision 60 ft., passive Perception 9',
    languages: 'Common, Goblin', damage_types: '',
    habitats: 'caves, forests, ruins, anywhere dark and defensible',
    movement_modes: 'walking',
    physical_descriptors: 'short stature, greenish skin, large pointed ears, sharp jagged teeth, yellow or red eyes, dressed in scavenged armor',
    behavioral_descriptors: 'cowardly in equal numbers, aggressive in overwhelming force, greedy, cruel, ingenious, short attention span',
    sensory_clues: 'gibbering chatter echoing from caves, refuse piles near hidden entrances, crude warning signs made of bone and twine',
    spoor_clues: 'small muddy footprints, discarded bone tools and crude weapons, burnt-out campfires with stolen goods nearby, crude traps',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Nimble Escape', text: 'The goblin can Disengage or Hide as a bonus action on each of its turns.' }
    ]),
    actions: JSON.stringify([
      { name: 'Scimitar', text: '+4 to hit, 5 (1d6 + 2) slashing damage.' },
      { name: 'Shortbow', text: '+4 to hit, 5 (1d6 + 2) piercing damage.' }
    ]),
    description: 'Goblins are small, black-hearted humanoids that lair in caves and abandoned structures. They are individually weak but dangerous in numbers, using traps, ambushes, and sheer volume to overwhelm stronger foes.',
    lore_summary: 'Small, green, and vicious in a pack. Goblins are individually pathetic, but they never fight fair — they fight from ambush, with traps, in the dark, and with numbers. Underestimate them at your own expense.',
    source: 'SRD'
  },
  {
    name: 'Orc', type: 'humanoid', subtype: '', size: 'medium', challenge: 0.5,
    alignment: 'chaotic evil', armor_class: 13, hit_points: 15,
    speed: '30 ft.', senses: 'darkvision 60 ft., passive Perception 10',
    languages: 'Common, Orc', damage_types: '',
    habitats: 'mountains, caves, wastelands, frontier territories',
    movement_modes: 'walking',
    physical_descriptors: 'muscular gray-green frame, prominent lower tusks, coarse dark hair, heavy brow ridge, ritual scarring across face and arms',
    behavioral_descriptors: 'aggressive, tribal, respects strength above all, direct and unsubtle, relentless in pursuit',
    sensory_clues: 'distant war drums, crude territorial markers of skulls on spikes, smoke from raided settlements, guttural war chants',
    spoor_clues: 'large heavy boot prints, broken weapons and shields, slaughtered livestock, raided caravans, battle sites with no scavenging',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Aggressive', text: 'As a bonus action, the orc can move up to its speed toward a hostile creature it can see.' },
      { name: 'Relentless Endurance', text: 'When reduced to 0 hit points but not killed outright, the orc drops to 1 hit point instead (once per long rest).' }
    ]),
    actions: JSON.stringify([
      { name: 'Greataxe', text: '+5 to hit, 9 (1d12 + 3) slashing damage.' },
      { name: 'Javelin', text: '+5 to hit, 6 (1d6 + 3) piercing damage.' }
    ]),
    description: 'Orcs are hulking humanoids known for their brutality and tribal warrior culture. They raid and conquer with direct, overwhelming force, respecting only strength and the will to dominate.',
    lore_summary: 'Brutal warrior raiders. Orcs solve every problem with an axe. They respect strength and nothing else, and they never stop coming — even when you drop one, they find a way to keep fighting.',
    source: 'SRD'
  },
  {
    name: 'Troll', type: 'giant', subtype: '', size: 'large', challenge: 5,
    alignment: 'chaotic evil', armor_class: 15, hit_points: 84,
    speed: '30 ft.', senses: 'darkvision 60 ft., passive Perception 12',
    languages: 'Giant', damage_types: '',
    habitats: 'swamps, mountains, underdark outskirts, remote wilderness',
    movement_modes: 'walking',
    physical_descriptors: 'lanky rubbery green-gray body, elongated arms that drag on the ground, a mane of coarse dark hair, warty hide, talons and tusks',
    behavioral_descriptors: 'voraciously hungry, single-minded, dim but cunning in matters of survival, will eat anything, regenerates with terrifying speed',
    sensory_clues: 'the stench of rotting meat on its breath, wet slapping footfalls in swamp mud, bones cracked open for marrow, a guttural laugh',
    spoor_clues: 'lopped limbs that have not decayed, fire-scarred terrain where someone knew how to fight one, massive humanoid tracks, scattered bones',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Regeneration', text: 'The troll regains 10 hit points at the start of its turn. The troll dies only if it starts its turn with 0 hit points and does not regenerate. Acid or fire damage suppresses regeneration for one round.' }
    ]),
    actions: JSON.stringify([
      { name: 'Multiattack', text: 'The troll makes three attacks: one with its bite and two with its claws.' },
      { name: 'Bite', text: '+7 to hit, 7 (1d6 + 4) piercing damage.' },
      { name: 'Claw', text: '+7 to hit, 11 (2d6 + 4) slashing damage.' }
    ]),
    description: 'Trolls are towering, regenerating humanoids with a ceaseless hunger. Lop off a limb and it regrows. Burn the wound, however, and the regeneration falters — a fact few survive long enough to learn.',
    lore_summary: 'You cut it and it grows back. Trolls regenerate everything except their bad attitude. Fire and acid are the only things that slow them down. Amputate at your own risk — the limbs keep moving.',
    source: 'SRD'
  },
  {
    name: 'Mimic', type: 'monstrosity', subtype: 'shapechanger', size: 'medium', challenge: 2,
    alignment: 'neutral', armor_class: 12, hit_points: 58,
    speed: '15 ft.', senses: 'darkvision 60 ft., passive Perception 11',
    languages: '', damage_types: 'acid',
    habitats: 'dungeons, ruins, treasure rooms, abandoned structures',
    movement_modes: 'walking, climbing',
    physical_descriptors: 'in true form: an amorphous beige mass with eyes on stalks and a gaping maw; commonly disguised as a treasure chest, door, or piece of furniture',
    behavioral_descriptors: 'patient ambush predator, waits motionless for days or weeks, attacks when prey is close and committed, surprisingly intelligent',
    sensory_clues: 'a room where one object is suspiciously clean, a treasure chest in an otherwise empty room, faint adhesive residue on nearby surfaces',
    spoor_clues: 'bones in rooms with seemingly no monster, objects stuck to surfaces with dried adhesive, the fading pseudopod marks on floors',
    status_effects: 'grappled, restrained',
    traits: JSON.stringify([
      { name: 'Shapechanger', text: 'The mimic can use its action to polymorph into an object or back into its true amorphous form.' },
      { name: 'Adhesive', text: 'The mimic adheres to anything that touches it. A creature adhered to the mimic is also grappled (escape DC 13).' },
      { name: 'False Appearance', text: 'While motionless in object form, the mimic is indistinguishable from a normal object.' }
    ]),
    actions: JSON.stringify([
      { name: 'Pseudopod', text: '+5 to hit, 7 (1d8 + 3) bludgeoning damage. If in object form, target is subjected to Adhesive.' },
      { name: 'Bite', text: '+5 to hit, 7 (1d8 + 3) piercing damage plus 4 (1d8) acid damage.' }
    ]),
    description: 'Mimics are ambush predators that can assume the form of inanimate objects — most famously treasure chests. Their adhesive skin traps prey on contact, allowing the mimic to deliver a crushing bite.',
    lore_summary: 'The treasure chest is hungry. Mimics are the reason adventurers poke everything with a ten-foot pole. They are patient, sticky, and entirely indifferent to your sense of betrayal.',
    source: 'SRD'
  },
  {
    name: 'Ghost', type: 'undead', subtype: '', size: 'medium', challenge: 4,
    alignment: 'any', armor_class: 11, hit_points: 45,
    speed: '0 ft., fly 40 ft.', senses: 'darkvision 60 ft., passive Perception 11',
    languages: 'any languages it knew in life', damage_types: 'necrotic',
    habitats: 'ruins, ancient battlefields, places of tragedy and unfinished business',
    movement_modes: 'flying (hover)',
    physical_descriptors: 'translucent, vaguely humanoid apparition, tattered remnants of clothing, expression frozen in its dying emotion — rage, sorrow, or terror',
    behavioral_descriptors: 'bound by unfinished business, driven by a singular trauma or purpose, erratic, tragic more than evil',
    sensory_clues: 'sudden cold spots, flickering lights, the smell of flowers or decay from nowhere, objects moving on their own',
    spoor_clues: 'wilted plants in a path, haunted areas where animals refuse to go, aged or frightened locals with stories, unexplained cold zones',
    status_effects: 'frightened, charmed, possessed',
    traits: JSON.stringify([
      { name: 'Horrifying Visage', text: 'Each non-undead creature within 60 feet that can see the ghost must make a DC 13 WIS save or be frightened for 1 minute.' },
      { name: 'Possession', text: 'One humanoid the ghost can see must make a DC 13 CHA save or be possessed. The ghost controls the target.' },
      { name: 'Etherealness', text: 'The ghost enters the Ethereal Plane from the Material Plane, or vice versa.' }
    ]),
    actions: JSON.stringify([
      { name: 'Withering Touch', text: '+5 to hit, 17 (4d6 + 3) necrotic damage.' }
    ]),
    description: 'A ghost is the spirit of a deceased creature bound to the mortal plane by unfinished business or a traumatic death. It exists partially in the Ethereal Plane, rendering it incorporeal and difficult to combat.',
    lore_summary: 'The restless dead with unfinished business. Ghosts possess, terrify, and drain life. They are not evil so much as trapped — but that does not make their touch any less fatal.',
    source: 'SRD'
  },
  {
    name: 'Skeleton', type: 'undead', subtype: '', size: 'medium', challenge: 0.25,
    alignment: 'lawful evil', armor_class: 13, hit_points: 13,
    speed: '30 ft.', senses: 'darkvision 60 ft., passive Perception 9',
    languages: 'understands languages it knew in life but cannot speak', damage_types: '',
    habitats: 'crypts, ancient battlefields, necromancer lairs, tombs',
    movement_modes: 'walking',
    physical_descriptors: 'assemblage of bones animated by necromantic energy, empty eye sockets with pinpoints of light, clattering movement, whatever armor and weapons it died with',
    behavioral_descriptors: 'mindless, follows commands literally, no self-preservation, relentless, compels other undead to rise in its presence',
    sensory_clues: 'the dry clatter of bone on stone, crypt doors ajar, grave dirt disturbed, the smell of old bone dust',
    spoor_clues: 'scattered bones that reform when you look away, crypt seals broken from the inside, trails of grave dirt leading away from tombs',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Undead Fortitude', text: 'If damage reduces the skeleton to 0 hit points, it must make a CON save with DC 5 + damage taken, unless the damage is radiant or a critical hit. On a success, it drops to 1 hit point instead.' }
    ]),
    actions: JSON.stringify([
      { name: 'Shortsword', text: '+4 to hit, 5 (1d6 + 2) piercing damage.' },
      { name: 'Shortbow', text: '+4 to hit, 5 (1d6 + 2) piercing damage.' }
    ]),
    description: 'Skeletons are the bones of the dead, animated by dark necromantic magic to serve as tireless soldiers. They obey orders without question and fight without fear.',
    lore_summary: 'Bones given purpose. Skeletons are the cheapest necromantic labor — no flesh to rot, no will to break. They are mindless but numerous, and they never stop unless you break them completely.',
    source: 'SRD'
  },
  {
    name: 'Zombie', type: 'undead', subtype: '', size: 'medium', challenge: 0.25,
    alignment: 'neutral evil', armor_class: 8, hit_points: 22,
    speed: '20 ft.', senses: 'darkvision 60 ft., passive Perception 8',
    languages: 'understands languages it knew in life but cannot speak', damage_types: '',
    habitats: 'graveyards, swamps, necromancer lairs, plague-ravaged villages',
    movement_modes: 'walking',
    physical_descriptors: 'rotting corpse, gray-green flesh sloughing from bone, shambling gait, vacant milky eyes, dressed in burial shrouds or whatever it died wearing',
    behavioral_descriptors: 'mindless, driven by hunger for living flesh, slow but persistent, uncreative, immune to pain and reason',
    sensory_clues: 'the smell of rotting meat, wet dragging footsteps, moaning that carries for miles, flies swarming in cold air',
    spoor_clues: 'trails of decayed flesh, graves dug up from the inside, clawed-at doors and windows, partially eaten corpses that begin to twitch',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Undead Fortitude', text: 'If damage reduces the zombie to 0 hit points, it makes a CON save with DC 5 + damage taken, unless the damage is radiant or a critical hit. On a success, it drops to 1 hit point instead.' }
    ]),
    actions: JSON.stringify([
      { name: 'Slam', text: '+3 to hit, 4 (1d6 + 1) bludgeoning damage.' }
    ]),
    description: 'Zombies are the shambling reanimated corpses of the dead, raised by necromancy to serve as mindless minions. They are slow and dull but disturbingly resilient.',
    lore_summary: 'A walking corpse that refuses to stay down. Zombies are slow, stupid, and grotesque — but they are also nearly impossible to put down permanently. Bludgeoning works. Dismemberment works better.',
    source: 'SRD'
  },
  {
    name: 'Kobold', type: 'humanoid', subtype: '', size: 'small', challenge: 0.125,
    alignment: 'lawful evil', armor_class: 12, hit_points: 5,
    speed: '30 ft.', senses: 'darkvision 60 ft., passive Perception 8',
    languages: 'Common, Draconic', damage_types: '',
    habitats: 'caves, warrens, dragon lairs, underground tunnel networks',
    movement_modes: 'walking',
    physical_descriptors: 'diminutive reptilian humanoid, scaly hide in brown to rust tones, a snout with small horns, a rat-like tail, yellow reptilian eyes',
    behavioral_descriptors: 'cowardly individually, ingenious in groups, master trapmakers, worship dragons, industrious miners and tunnelers',
    sensory_clues: 'distant chittering in draconic, the smell of wet reptile and lamp oil, tripwires nearly invisible in dim light, shifting tunnel walls',
    spoor_clues: 'elaborate trap mechanisms, narrow tunnels barely two feet wide, stolen shiny objects hoarded in nests, dragon-worship shrines',
    status_effects: '',
    traits: JSON.stringify([
      { name: 'Pack Tactics', text: 'The kobold has advantage on attack rolls against a creature if at least one of its allies is within 5 feet and not incapacitated.' },
      { name: 'Sunlight Sensitivity', text: 'The kobold has disadvantage on attack rolls and Perception checks in direct sunlight.' }
    ]),
    actions: JSON.stringify([
      { name: 'Dagger', text: '+4 to hit, 4 (1d4 + 2) piercing damage.' },
      { name: 'Sling', text: '+4 to hit, 4 (1d4 + 2) bludgeoning damage.' }
    ]),
    description: 'Kobolds are small reptilian humanoids who dwell in warrens and serve dragons with cult-like devotion. What they lack in individual might they compensate for with traps, tunnels, and overwhelming numbers.',
    lore_summary: 'Tiny reptilian trap-makers who worship dragons. Kobolds are pathetic alone but lethal in their tunnels — every corridor is trapped, every shadow hides a sling stone, and they never fight without a numbers advantage.',
    source: 'SRD'
  }
];

export function seedCreatures(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM creatures').get() as { count: number };
  if (count.count > 0) return;

  const insert = db.prepare(`INSERT INTO creatures (name, type, subtype, size, challenge, alignment, armor_class, hit_points, speed, senses, languages, damage_types, habitats, movement_modes, physical_descriptors, behavioral_descriptors, sensory_clues, spoor_clues, status_effects, traits, actions, description, lore_summary, source) VALUES (@name, @type, @subtype, @size, @challenge, @alignment, @armor_class, @hit_points, @speed, @senses, @languages, @damage_types, @habitats, @movement_modes, @physical_descriptors, @behavioral_descriptors, @sensory_clues, @spoor_clues, @status_effects, @traits, @actions, @description, @lore_summary, @source)`);

  const tx = db.transaction(() => {
    for (const c of SEED_CREATURES) {
      insert.run(c);
    }
  });

  tx();
  console.log(`Seeded ${SEED_CREATURES.length} creatures into the journal.`);
}
