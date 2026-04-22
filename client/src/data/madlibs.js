// Each Mad Lib owns its own `imagePrompt` template tuned to a visual style
// that naturally avoids rendering text labels. {slotId} placeholders get
// substituted with the collected word at image-request time. Bullet-style
// structure is deliberate — narrative prompts get rendered AS text by DALL-E 3.

export const MAD_LIBS = [
  {
    id: 'metamorphosis',
    codename: 'Operation Metamorphosis',
    theme: 'creature',
    imagePrompt: `
A single fantasy creature, centered in the frame, full body shown.

Overall appearance: {adj1}.
Body form: resembles a {noun1}.
Primary feature: {adj2} {noun2}.
Secondary feature: {adj3} {noun3}.
Setting: standing in {noun4}, shown from a cinematic angle.

Art style: vibrant digital fantasy creature concept art, painterly illustration, dramatic lighting, rich saturated colors, in the tradition of professional creature design for games and film. NOT a storybook illustration. NOT a page from a book.

Absolute constraints: zero text, zero letters, zero words, zero captions, zero labels, zero writing, zero typography, zero numbers anywhere in the image. Purely pictorial.
`.trim(),
    slots: [
      { id: 'adj1',  type: 'APPEARANCE', hint: 'how it looks overall',     examples: ['glowing', 'lumpy', 'invisible'] },
      { id: 'noun1', type: 'THING',      hint: 'an animal or object',      examples: ['lizard', 'octopus', 'refrigerator'] },
      { id: 'adj2',  type: 'TEXTURE',    hint: 'describes a surface',      examples: ['slimy', 'enormous', 'see-through'] },
      { id: 'noun2', type: 'THING',      hint: 'a noun — anything',        examples: ['wings', 'horns', 'spaghetti'] },
      { id: 'adj3',  type: 'ADJECTIVE',  hint: 'any descriptor',           examples: ['electric', 'fuzzy', 'metallic'] },
      { id: 'noun3', type: 'THING',      hint: 'another noun',             examples: ['eyes', 'scales', 'lawnmowers'] },
      { id: 'verb1', type: 'MOVEMENT',   hint: 'how it gets around',       examples: ['slithers', 'teleports', 'somersaults'] },
      { id: 'noun4', type: 'PLACE',      hint: 'a location',               examples: ['volcano', 'swamp', 'the moon'] },
      { id: 'verb2', type: 'ACTION',     hint: 'what it does when scared', examples: ['explodes', 'hibernates', 'cries'] },
      { id: 'noun5', type: 'THING',      hint: 'its favorite snack',       examples: ['spaghetti', 'batteries', 'sadness'] },
      { id: 'adj4',  type: 'SOUND',      hint: 'a type of sound',          examples: ['melodic', 'deafening', 'squeaky'] },
    ],
    template: [
      { type: 'text', value: 'A ' },
      { type: 'slot', slotId: 'adj1' },
      { type: 'text', value: ' ' },
      { type: 'slot', slotId: 'noun1' },
      { type: 'text', value: ' creature with ' },
      { type: 'slot', slotId: 'adj2' },
      { type: 'text', value: ' ' },
      { type: 'slot', slotId: 'noun2' },
      { type: 'text', value: ' and ' },
      { type: 'slot', slotId: 'adj3' },
      { type: 'text', value: ' ' },
      { type: 'slot', slotId: 'noun3' },
      { type: 'text', value: '. It ' },
      { type: 'slot', slotId: 'verb1' },
      { type: 'text', value: ' through ' },
      { type: 'slot', slotId: 'noun4' },
      { type: 'text', value: ' and ' },
      { type: 'slot', slotId: 'verb2' },
      { type: 'text', value: ' when threatened. Its favorite food is ' },
      { type: 'slot', slotId: 'noun5' },
      { type: 'text', value: ' and it makes a ' },
      { type: 'slot', slotId: 'adj4' },
      { type: 'text', value: ' sound.' },
    ],
  },

  {
    id: 'spatial-recalibration',
    codename: 'Spatial Recalibration',
    theme: 'office',
    imagePrompt: `
An impossible, whimsical open-plan office interior — wide shot from inside the room.

Walls: {adj1} and {adj2}.
Every corner contains: {noun1}.
Hanging from the ceiling: {noun2}.
Break room area visible in the background, featuring: {noun3} and {noun4}.
Desks in the foreground: made of {noun5}, {adj3}, with {noun6} sitting on top.
Lobby installation visible through a doorway: a {adj4} {noun7}.

Art style: surreal architectural concept rendering, bright, colorful, whimsical, painterly. NOT a technical drawing. NOT a blueprint. NOT a floor plan.

Absolute constraints: zero text, zero signage, zero logos, zero words, zero writing, zero labels, zero numbers anywhere in the image — no branded elements, no signs on walls, no writing on any surface. Purely pictorial.
`.trim(),
    slots: [
      { id: 'adj1',  type: 'COLOR',     hint: 'a color or pattern',      examples: ['neon', 'polka-dotted', 'holographic'] },
      { id: 'adj2',  type: 'TEXTURE',   hint: 'a surface quality',       examples: ['bouncy', 'transparent', 'furry'] },
      { id: 'noun1', type: 'THING',     hint: 'an object or creature',   examples: ['volcanoes', 'trampolines', 'statues'] },
      { id: 'noun2', type: 'THING',     hint: 'any noun',                examples: ['surfboards', 'dinosaurs', 'chandeliers'] },
      { id: 'noun3', type: 'THING',     hint: 'any noun',                examples: ['a roller coaster', 'a waterfall', 'a dragon'] },
      { id: 'noun4', type: 'THING',     hint: 'another noun',            examples: ['a swimming pool', 'a jungle gym', 'clouds'] },
      { id: 'noun5', type: 'MATERIAL',  hint: 'a material or substance', examples: ['ice', 'cheese', 'rainbows'] },
      { id: 'adj3',  type: 'ADJECTIVE', hint: 'any descriptor',          examples: ['singing', 'invisible', 'edible'] },
      { id: 'noun6', type: 'THING',     hint: 'any noun',                examples: ['jetpacks', 'a portal', 'a potted cactus'] },
      { id: 'adj4',  type: 'STYLE',     hint: 'a style or quality',      examples: ['rotating', 'melting', 'musical'] },
      { id: 'noun7', type: 'THING',     hint: 'any noun',                examples: ['statue', 'fountain', 'black hole'] },
    ],
    template: [
      { type: 'text', value: 'Our new office has ' },
      { type: 'slot', slotId: 'adj1' },
      { type: 'text', value: ' and ' },
      { type: 'slot', slotId: 'adj2' },
      { type: 'text', value: ' walls. ' },
      { type: 'slot', slotId: 'noun1' },
      { type: 'text', value: ' in every corner. ' },
      { type: 'slot', slotId: 'noun2' },
      { type: 'text', value: ' hanging from the ceiling. The break room features ' },
      { type: 'slot', slotId: 'noun3' },
      { type: 'text', value: ' and ' },
      { type: 'slot', slotId: 'noun4' },
      { type: 'text', value: '. Desks made of ' },
      { type: 'slot', slotId: 'noun5' },
      { type: 'text', value: ', ' },
      { type: 'slot', slotId: 'adj3' },
      { type: 'text', value: ' with ' },
      { type: 'slot', slotId: 'noun6' },
      { type: 'text', value: ' on top. The lobby has a ' },
      { type: 'slot', slotId: 'adj4' },
      { type: 'text', value: ' ' },
      { type: 'slot', slotId: 'noun7' },
      { type: 'text', value: ' installation.' },
    ],
  },

  {
    id: 'patent-pending',
    codename: 'Patent Pending',
    theme: 'device',
    // NOTE: we deliberately avoid "patent drawing / blueprint / engineering
    // diagram with labels" styling — those styles are inseparable from text
    // labels in DALL-E 3's training data and always produce gibberish captions.
    // Instead, depict the invention as a museum-display object.
    imagePrompt: `
A single impossible invention, centered in the frame, displayed on a wooden pedestal like a museum artifact.

The invention is called the "{noun1}" — render ONLY the device, do NOT write the name anywhere.
It is designed to {verb1} a {noun2} (imply this visually).
Mechanism: a {verb2} component, a {verb3} component, and a {verb4} component all working together simultaneously.
Construction hints at {adj1} technology.
A visible effect around the device: {noun3} emanating from it.
The device is in its activated state: {verb5} outwardly.
Aesthetic echo: something that would {verb5} and suggest the presence of a {noun4}.

Art style: ornate steampunk-Victorian oil painting, rich warm tones, brass and copper mechanics, dramatic candlelit inventor's workshop, painterly chiaroscuro. NOT a patent drawing. NOT a blueprint. NOT a technical sketch. NOT a diagram. NOT on parchment. NOT in sepia ink.

Absolute constraints: zero text, zero labels, zero writing, zero annotations, zero numbers, zero callouts, zero lettering, zero typography, zero words anywhere in the image — no name plates, no signage, no labels on the device, no captions, no titles. Purely pictorial oil painting.
`.trim(),
    slots: [
      { id: 'noun1', type: 'NAME',      hint: 'make up a name',              examples: ['Turbo-Blaster', 'The Snorkelizer', 'Mega-Scooper'] },
      { id: 'verb1', type: 'ACTION',    hint: 'any action verb',             examples: ['inflates', 'dissolves', 'harmonizes'] },
      { id: 'noun2', type: 'THING',     hint: 'a person or object',          examples: ['homework', 'your left shoe', 'your little brother'] },
      { id: 'verb2', type: 'ACTION',    hint: 'any action verb',             examples: ['spins', 'hums', 'levitates'] },
      { id: 'verb3', type: 'ACTION',    hint: 'another action verb',         examples: ['predicts', 'wobbles', 'apologizes'] },
      { id: 'verb4', type: 'ACTION',    hint: 'one more action verb',        examples: ['calculates', 'sneezes', 'multiplies'] },
      { id: 'adj1',  type: 'ADJECTIVE', hint: 'any descriptor',              examples: ['quantum', 'artisanal', 'underwater'] },
      { id: 'noun3', type: 'THING',     hint: 'any noun',                    examples: ['rainbows', 'confusion', 'cheese'] },
      { id: 'verb5', type: 'ACTION',    hint: 'what it does when turned on', examples: ['vibrates', 'glows', 'recites poetry'] },
      { id: 'noun4', type: 'SOUND',     hint: 'a type of sound',             examples: ['a foghorn', 'a hamster', 'a jazz band'] },
    ],
    template: [
      { type: 'text', value: 'We invented a device called the ' },
      { type: 'slot', slotId: 'noun1' },
      { type: 'text', value: ' that ' },
      { type: 'slot', slotId: 'verb1' },
      { type: 'text', value: ' your ' },
      { type: 'slot', slotId: 'noun2' },
      { type: 'text', value: '. It ' },
      { type: 'slot', slotId: 'verb2' },
      { type: 'text', value: ', ' },
      { type: 'slot', slotId: 'verb3' },
      { type: 'text', value: ', and ' },
      { type: 'slot', slotId: 'verb4' },
      { type: 'text', value: ' simultaneously. It uses ' },
      { type: 'slot', slotId: 'adj1' },
      { type: 'text', value: ' technology and produces ' },
      { type: 'slot', slotId: 'noun3' },
      { type: 'text', value: ' as a side effect. When activated, it ' },
      { type: 'slot', slotId: 'verb5' },
      { type: 'text', value: ' and sounds like a ' },
      { type: 'slot', slotId: 'noun4' },
      { type: 'text', value: '.' },
    ],
  },
];
