export interface StyleConfig {
  activePreset: string;
  customPresets?: Record<string, CustomPreset>;
}

export interface CustomPreset {
  name: string;
  visualDna: string;
  characterDescription: string;
}

export interface PresetParts {
  label: string;
  characterName: string;
  visualDna: string;
  characterDescription: string;
  colorGuidance: string;
  labelStyle: string;
  spaceRule: string;
  structureHints: Record<string, string>;
}

export function resolveActiveStyle(
  styleConfig: StyleConfig | null | undefined,
  presetOverrides?: { visualDna?: string; characterDescription?: string },
): PresetParts {
  if (presetOverrides?.visualDna && presetOverrides?.characterDescription) {
    return {
      ...STYLE_PRESETS[DEFAULT_PRESET],
      label: "自定义",
      characterName: "the main character",
      visualDna: presetOverrides.visualDna,
      characterDescription: presetOverrides.characterDescription,
    };
  }

  const cfg = styleConfig ?? { activePreset: DEFAULT_PRESET };
  const presetId = cfg.activePreset || DEFAULT_PRESET;

  if (presetId.startsWith("custom-") && cfg.customPresets?.[presetId]) {
    const cp = cfg.customPresets[presetId];
    return {
      ...STYLE_PRESETS[DEFAULT_PRESET],
      label: cp.name,
      characterName: "the main character",
      visualDna: cp.visualDna,
      characterDescription: cp.characterDescription,
    };
  }

  if (STYLE_PRESETS[presetId]) {
    return STYLE_PRESETS[presetId];
  }

  return STYLE_PRESETS[DEFAULT_PRESET];
}

let _counter = 0;
export function generateCustomPresetId(): string {
  _counter++;
  return `custom-${Date.now().toString(36)}-${_counter}`;
}

export const STYLE_PRESETS: Record<string, PresetParts> = {
  // ── 1. 小黑手绘 ─────────────────────────────────────────────
  xiaobei: {
    label: "小黑手绘",
    characterName: "小黑",
    visualDna: "Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.",
    characterDescription: "小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.",
    colorGuidance: "Black hand-drawn line art with sparse accents: red for emphasis, orange for arrows/flow, blue for secondary annotations. No other colors. No fills, no gradients.",
    labelStyle: "Sparse handwritten Chinese labels in red or blue ink, tilted slightly, small font. At most 5-8 labels. No printed fonts, no English labels.",
    spaceRule: "At least 35% empty white space. Main subject 40-60% of frame. No title in corner. No structure type label. No formal chart. No reused examples.",
    structureHints: {
      Workflow: "left-to-right flow with orange arrows",
      "系统局部": "3-5 core modules, 小黑 interacting with one key module",
      "前后对比": "left chaos vs right order, orange arrow between",
      "角色状态": "2-4 small state icons, one short label each",
      "概念隐喻": "one large absurd object or machine, few inputs, one output",
      "方法分层": "stacked layers, 小黑 carrying bricks beside it",
      "地图路线": "one winding path, few nodes, 小黑 walking or leading",
      "小漫画分镜": "2-4 small comic panels, fail-to-success arc",
    },
  },

  // ── 2. 水彩淡墨 ─────────────────────────────────────────────
  shuicai: {
    label: "水彩淡墨",
    characterName: "水墨人物",
    visualDna: "Traditional Chinese ink wash painting style. Watercolor texture on xuan paper. Soft color bleeding edges. Gentle ink gradients with subtle color washes (indigo, ochre, vermillion). Organic brush strokes. Atmospheric perspective. No harsh lines, no flat vector fills, no commercial digital art. Elegant, contemplative mood.",
    characterDescription: "A minimalist ink-wash character with simple brush-stroke body, round ink-dot eyes, slender limbs suggested by faint ink lines. The character blends into the watercolor environment naturally. Expressive through posture and position within the composition. Gentle, poetic, not cartoonish.",
    colorGuidance: "Monochrome ink black as primary, with subtle color washes: indigo blue for distance, ochre for warmth, vermillion for small accent marks. Colors bleed softly at edges. No pure white — use cream xuan paper tone.",
    labelStyle: "Red seal/chop stamp impression in corner. Minimal text — at most 2-3 poetic Chinese characters as seal marks. No handwritten scribbles, no printed fonts.",
    spaceRule: "Generous negative space inspired by Chinese landscape painting. Main subject offset to one side. At least 40% empty space with atmospheric wash fading to edge. No hard borders.",
    structureHints: {
      Workflow: "horizontal scroll-like left-to-right flow, ink wash separating sections",
      "系统局部": "2-3 modules connected by faint ink wash, ink-dot markers",
      "前后对比": "left misty/chaotic, right clear/ordered, a vermillion seal between",
      "角色状态": "characters arranged vertically like hanging scroll, ink dots for states",
      "概念隐喻": "one central symbolic object rendered in detailed ink wash",
      "方法分层": "stacked horizontal bands like landscape layers",
      "地图路线": "a winding ink line path through misty mountains",
      "小漫画分镜": "2-4 panels separated by faint ink brush strokes",
    },
  },

  // ── 3. 扁平矢量 ─────────────────────────────────────────────
  flat: {
    label: "扁平矢量",
    characterName: "几何形象",
    visualDna: "Clean flat vector illustration style. Solid color backgrounds with harmonious pastel palette. Crisp geometric shapes with slight rounded corners. Soft consistent shadows in one direction. No gradients, no textures, no hand-drawn wobble. Modern infographic aesthetic. Minimalist with purposeful color blocking.",
    characterDescription: "A simple geometric character with a round head, solid-color body, minimal facial features (two dot eyes, no mouth). Clean vector silhouette with flat colors. Friendly but neutral expression. Modern and professional, not childish.",
    colorGuidance: "Flat solid fills only. Pastel palette: dusty blue, warm beige, sage green, pale pink, soft coral. One accent color (coral or teal) for key elements. No black outlines — shapes defined by color contrast.",
    labelStyle: "Minimal clean sans-serif labels in dark grey. At most 3-4 short labels. Aligned horizontally. No handwriting style, no seals, no decorative text.",
    spaceRule: "Clean structured composition. Elements aligned to invisible grid. 30% breathing room around main subject. Symmetric or balanced asymmetric layout. No overlapping elements.",
    structureHints: {
      Workflow: "horizontal flow with rounded arrows in accent color",
      "系统局部": "3-5 rounded rectangular modules with connecting lines",
      "前后对比": "two panels side by side, accent-colored arrow between",
      "角色状态": "character with small circular status indicators below",
      "概念隐喻": "central abstract symbol in rounded container",
      "方法分层": "horizontal layered rectangles with decreasing opacity",
      "地图路线": "simplified path with dot markers and dashed connector",
      "小漫画分镜": "2-4 equal rectangular panels with thin gaps",
    },
  },

  // ── 4. 赛博霓虹 ─────────────────────────────────────────────
  cyber: {
    label: "赛博霓虹",
    characterName: "霓虹剪影",
    visualDna: "Dark background with neon glow effects. Cyberpunk aesthetic with magenta, cyan, and electric blue highlights. Hard geometric lines mixed with holographic grid elements. Pixel-dust particle effects. Subtle scan-line texture. High contrast. Futuristic urban atmosphere. No organic textures, no paper, no pastels.",
    characterDescription: "A hooded silhouette figure with glowing cyan eyes and neon-outlined body. Digital/cyberpunk aesthetic. The figure stands out against dark backgrounds with rim lighting. Mysterious and cool, not cute.",
    colorGuidance: "Dark navy/purple background. Neon cyan for primary elements, magenta for highlights, electric blue for secondary. White for text and sharp details. Strong glow effects with outer glow blur. No warm colors, no earth tones.",
    labelStyle: "Terminal-style monospace digital labels in cyan or white. Glowing effect on text. Optional hexadecimal or code-like annotations. No handwriting, no seals.",
    spaceRule: "Dense layered composition. Grid overlay pattern. Main subject centered with radial glow behind. Elements can overlap with transparency. 15-20% negative space for breathing.",
    structureHints: {
      Workflow: "diagonal flow with neon dotted trails",
      "系统局部": "holographic floating modules with data stream connections",
      "前后对比": "two panels with digital static transition effect",
      "角色状态": "character surrounded by floating data readouts",
      "概念隐喻": "central object radiating neon wireframe structures",
      "方法分层": "transparent overlapping layers with grid overlay",
      "地图路线": "glowing path with waypoint nodes and scan lines",
      "小漫画分镜": "glitch-separated panels with chromatic aberration",
    },
  },

  // ── 5. 故事绘本 ─────────────────────────────────────────────
  storybook: {
    label: "故事绘本",
    characterName: "绘本小动物",
    visualDna: "Warm colored-pencil illustration style on cream paper. Soft edges and cross-hatch shading. Warm earthy color palette (sienna, olive, ochre, warm grey). Gentle vignette borders. Storybook charm with visible pencil texture. No sharp digital lines, no flat colors, no stark white backgrounds. Cozy and inviting.",
    characterDescription: "A soft rounded character with button eyes, woolly texture, and expressive posture. Hand-drawn colored-pencil style. Warm and friendly. The character has gentle curves and lives in a cozy storybook world. Lovable but not saccharine.",
    colorGuidance: "Warm earthy palette: burnt sienna, olive green, golden ochre, warm grey, cream. Colored-pencil texture visible in all fills. Soft vignette darkens toward edges. No pure saturated colors, no cool blues.",
    labelStyle: "Hand-lettered storybook text in warm brown or dark ochre. Slight bounce in baseline. At most 2-3 short phrases integrated into the illustration as story elements. No seals, no digital fonts.",
    spaceRule: "Cozy framed composition. Soft vignette border. Main subject at center or slightly offset. 25% margin space with warm atmospheric fade. Elements arranged for narrative flow.",
    structureHints: {
      Workflow: "path through a storybook landscape with dotted trail",
      "系统局部": "3-4 elements arranged like story vignettes",
      "前后对比": "before scene on left page, after on right page",
      "角色状态": "character with thought bubble showing inner world",
      "概念隐喻": "central metaphor as a whimsical storybook object",
      "方法分层": "stacked like picture book pages with decorative borders",
      "地图路线": "storybook map with compass rose and dotted path",
      "小漫画分镜": "2-4 panels with decorative storybook borders",
    },
  },

  // ── 6. 浮世绘 ───────────────────────────────────────────────
  ukiyoe: {
    label: "浮世绘",
    characterName: "浮世绘人物",
    visualDna: "Ukiyo-e Japanese woodblock print style. Strong black contour lines. Flat areas of color (indigo, vermillion, skin, pale yellow). Wood grain texture visible in backgrounds. Wave and cloud patterns. No perspective depth — flat decorative composition. No shading, no gradients. Traditional Edo-period aesthetic.",
    characterDescription: "A stylized character in ukiyo-e costume with exaggerated expressive face, thick black outlines, flat skin tone, and dynamic pose. The character fits within a decorative bordered composition like traditional Japanese prints. Dramatic, theatrical, not modern.",
    colorGuidance: "Traditional woodblock palette: indigo (ai), vermillion (beni), pale yellow (ki), skin tone (niku), black (sumi). Flat unmodulated color areas separated by thick black lines. No blending, no gradients.",
    labelStyle: "Vertical Japanese-style text cartouche in corner. Black text on pale yellow or white rectangular cartouche. At most 2-3 characters as title. No English, no handwritten scribbles.",
    spaceRule: "Flat decorative composition filling most of the frame. Decorative border elements (clouds, waves) at edges. No deep perspective — elements arranged vertically. 10-15% negative space.",
    structureHints: {
      Workflow: "horizontal scroll-like sequence with cloud borders",
      "系统局部": "2-3 figures in traditional composition, separated by decorative borders",
      "前后对比": "left panel (before) and right panel (after) with cloud divide",
      "角色状态": "single figure with expressive kabuki-style pose",
      "概念隐喻": "central symbolic object surrounded by decorative wave pattern",
      "方法分层": "vertical stacking like traditional scroll",
      "地图路线": "Tokaido-style road with stations as small vignettes",
      "小漫画分镜": "2-4 panels arranged vertically like emakimono scroll",
    },
  },

  // ── 7. 像素复古 ─────────────────────────────────────────────
  pixel: {
    label: "像素复古",
    characterName: "像素小人",
    visualDna: "Retro 8-bit pixel art style. Low resolution with visible square pixels (approx 32x32 grid). Limited color palette (8-12 colors). No anti-aliasing, no smooth curves, no gradients. Chiptune-era game aesthetic. Blocky shadows and highlights. Nostalgic gameboy or NES-era feel.",
    characterDescription: "A pixel-art character built from colored squares with blocky proportions, large head relative to body, expressive pixel eyes (2x2 white dots). Simple animation-ready pose. Retro game protagonist feel. Charming in its simplicity.",
    colorGuidance: "NES-inspired limited palette: white, black, grey, red, blue, yellow, green, brown. Each color used as solid pixel blocks. No smooth transitions. Dithering allowed for shading with checkerboard pixel patterns.",
    labelStyle: "Pixel font text in white against dark background. At most 3-4 characters per label. Simple blocky letters. No anti-aliasing. Title in a small text box at top or bottom.",
    spaceRule: "Full-frame composition that fills the pixel grid. Main subject 50-70% of frame. Simple background with 2-3 colors. No empty areas — all pixels filled.",
    structureHints: {
      Workflow: "left-to-right platformer level layout with pixel arrows",
      "系统局部": "2-4 item inventory-style boxes with pixel icons",
      "前后对比": "side-by-side like before/after screenshots",
      "角色状态": "character with 2-3 small status icons overhead",
      "概念隐喻": "central pixel object with sparkle effects",
      "方法分层": "stacked horizontal bars like health bars",
      "地图路线": "top-down pixel map with blinking dot markers",
      "小漫画分镜": "2-4 panels like game instruction manual panels",
    },
  },

  // ── 8. 蒸汽波 ───────────────────────────────────────────────
  vaporwave: {
    label: "蒸汽波",
    characterName: "复古剪影",
    visualDna: "Vaporwave aesthetic. Neon pink and cyan on deep purple night sky. Grid lines receding into infinity. Glitch effects, chromatic aberration. Classical bust statues with glitch overlays. Sunset gradients with horizontal scan lines. Retro 80s/90s computer graphics feel with CRT monitor glow. Dreamy, nostalgic, surreal.",
    characterDescription: "A retro-stylized character with neon-outlined silhouette, wearing 90s-inspired clothing (windbreaker, sunglasses). The character is partially transparent with glitch effects on edges. Cool, detached expression. Stands against a grid-lined neon sunset background.",
    colorGuidance: "Vaporwave signature palette: deep purple/blue background, neon pink, cyan, pale yellow for sun. Strong horizontal gradient (sunset). Chromatic aberration (RGB split) on edges. Scanline overlay.",
    labelStyle: "Retro computer terminal text in cyan or pink. Japanese characters mixed with English. Glitch effect on text edges. At most 3-4 short phrases. No handwriting, no seals.",
    spaceRule: "Strong perspective grid receding to vanishing point. Main subject centered at lower third. Large sun/moon at upper center. 20% negative space as gradient sky.",
    structureHints: {
      Workflow: "grid-path with neon arrows and glitch markers",
      "系统局部": "floating windows with retro UI borders",
      "前后对比": "CRT scan-line divide between two eras",
      "角色状态": "character with glitchy duplicate effect showing states",
      "概念隐喻": "central object with neon grid reflection below",
      "方法分层": "floating platforms with retro computer aesthetics",
      "地图路线": "grid-based map with neon outline paths",
      "小漫画分镜": "VHS tracking glitch effect between panels",
    },
  },

  // ── 9. 极简线条 ─────────────────────────────────────────────
  "minimal-line": {
    label: "极简线条",
    characterName: "线条人物",
    visualDna: "Minimalist continuous line drawing. Single unbroken black line on pure white background. No fill colors, no shading, no details — only essential outlines. Flowing, elegant curves. Large areas of negative space. A single accent color (red or blue) for one small element. Inspired by Matisse line drawings.",
    characterDescription: "A continuous-line figure drawn with one flowing black stroke. Minimal features — a single line suggests the nose, chin, and posture. The body is suggested through elegant curves rather than filled shapes. Graceful, abstract, modern. No face details, just the essential contour.",
    colorGuidance: "Pure black (#000) for the continuous line on pure white (#FFF) background. One single small accent element in either solid red or solid blue. No shades of grey. No additional colors.",
    labelStyle: "No text labels. Any annotation must be visual only — a simple arrow or dot in the accent color. Text would break the purity of the line drawing.",
    spaceRule: "At least 60% negative space. The line should use only 30-40% of the canvas area. Centered composition with generous margins. The line should never touch the edges.",
    structureHints: {
      Workflow: "single flowing line connecting abstract stages",
      "系统局部": "minimal circles connected by one continuous line",
      "前后对比": "one line looping back on itself to show two states",
      "角色状态": "single line figure with an accent dot indicating state",
      "概念隐喻": "one continuous line forming the metaphorical shape",
      "方法分层": "one line weaving through horizontal levels",
      "地图路线": "single winding line path, no markers needed",
      "小漫画分镜": "one unbroken line separating into 2-4 figure outlines",
    },
  },

  // ── 10. 油画厚涂 ────────────────────────────────────────────
  "oil-painting": {
    label: "油画厚涂",
    characterName: "油画人物",
    visualDna: "Thick oil paint impasto technique. Visible brush strokes and palette knife texture. Rich saturated colors with strong contrast. Deep shadows and bright highlights. Canvas texture visible. Classical portrait lighting (Rembrandt style). Warm amber and umber tones mixed with vibrant accents. Painterly, not photorealistic.",
    characterDescription: "A painterly figure with textured brush-stroke features, warm skin tones with visible paint layers, deep-set eyes suggested through shadow rather than lines. Classical portrait composition. The character emerges from a dark background with dramatic side lighting. Timeless, artistic.",
    colorGuidance: "Warm palette: amber, burnt umber, sienna, ochre, warm white, deep brown. Strong contrast with dark brown/black shadows and bright warm highlights. Canvas tone visible through thin paint areas. No flat colors, no clean lines.",
    labelStyle: "No text labels. If annotation is needed, integrate it as a painted element (e.g., a painted banner with rough lettering). At most 2-3 words, painted in the same impasto style.",
    spaceRule: "Dense composition filling 70-80% of canvas. Main subject occupying most of the frame. Dark atmospheric background. Tight crop around subject. Minimal empty space.",
    structureHints: {
      Workflow: "triptych-like three-panel composition",
      "系统局部": "dramatic lighting separating areas of the composition",
      "前后对比": "dark side vs light side of the same canvas",
      "角色状态": "single figure under dramatic Rembrandt lighting",
      "概念隐喻": "central symbolic object in a still-life arrangement",
      "方法分层": "layers receding into darkness like museum diorama",
      "地图路线": "path indicated by light and shadow across the canvas",
      "小漫画分镜": "polyptych panels separated by painted frames",
    },
  },

  // ── 11. 水墨禅意 ────────────────────────────────────────────
  "zen-ink": {
    label: "水墨禅意",
    characterName: "禅意人物",
    visualDna: "Zen-inspired monochrome ink wash. Pure black ink on white or very light cream rice paper. Spontaneous brush strokes with varied ink density (dry brush, splash ink, layered wash). Large areas of untouched white space. Asymmetric composition inspired by sumi-e. No colors except black ink. Meditative, spontaneous, minimal.",
    characterDescription: "A figure suggested through swift, expressive ink brush strokes — not detailed, but capturing the essence and movement. Face suggested with a few dots and curves. The body is implied through ink wash shapes rather than outlines. Zen-like calm. The character is partly dissolving into the white space.",
    colorGuidance: "Pure black ink only. Varied ink density: deep black for focus points, grey washes for atmosphere, dry brush for texture, splash ink for spontaneity. On white/cream rice paper. No colors whatsoever.",
    labelStyle: "No text labels or annotations. A single small seal stamp in vermillion red is the only allowed non-ink element. At most one seal. Text would break the purity.",
    spaceRule: "At least 50% negative space. Asymmetric composition following the rule of thirds. Main subject in lower or side third. Empty space is as important as inked areas.",
    structureHints: {
      Workflow: "horizontal progression like a handscroll unfolding",
      "系统局部": "elements scattered across blank space like constellations",
      "前后对比": "empty space vs filled space as the contrast mechanism",
      "角色状态": "single figure in meditative pose, negative space around",
      "概念隐喻": "one central symbolic brush stroke suggesting the metaphor",
      "方法分层": "ink density gradient from deep black to faint grey to white",
      "地图路线": "faint ink wash path disappearing into white space",
      "小漫画分镜": "2-4 panels with generous white space between them",
    },
  },

  // ── 12. 漫画网点 ────────────────────────────────────────────
  manga: {
    label: "漫画网点",
    characterName: "漫画人物",
    visualDna: "Japanese manga comic style. Clean black ink lines with varying thickness. Halftone screentone textures for shading (dot patterns, diagonal lines). Speed lines and action marks. White speech bubbles with black text. Panel borders with gutter spaces. High contrast black and white with possibly one accent color (red).",
    characterDescription: "A manga-style character with large expressive eyes (sparkle highlights), small nose, simple mouth. Angular chin and spiky or flowing hair drawn with dramatic ink lines. Dynamic pose with action lines. Emotional expression exaggerated. Shojo or shonen style.",
    colorGuidance: "High contrast black and white as base. Optional single accent color — pure red for dramatic elements (blood, blush, important objects). Black ink lines with screentone grey areas. No full color.",
    labelStyle: "Onomatopoeic sound effects (SFX) as part of the art. Speech bubbles with black text. At most 1-2 labels as dramatic text overlays. Japanese-influenced typography for SFX.",
    spaceRule: "Dynamic panel layout. Speed lines and action lines filling motion areas. Close-up shots with dramatic angles. Main subject 60-80% of panel. Gutters between panels if multi-panel.",
    structureHints: {
      Workflow: "sequential panel flow like manga page",
      "系统局部": "2-3 related panels showing system components",
      "前后对比": "before panel (screened) vs after panel (clear)",
      "角色状态": "character close-ups with emotional expression lines",
      "概念隐喻": "metaphor as dramatic splash page illustration",
      "方法分层": "layers separated by speed lines and action marks",
      "地图路线": "panels connected by arrow paths like adventure map",
      "小漫画分镜": "2-4 panel manga page layout with gutters",
    },
  },

  // ── 13. 蜡笔涂鸦 ────────────────────────────────────────────
  crayon: {
    label: "蜡笔涂鸦",
    characterName: "蜡笔小人",
    visualDna: "Children's crayon drawing style on manila paper. Thick uneven wax crayon strokes. Visible paper grain. Colors are slightly outside the lines intentionally. Scribble texture for shading. Naive perspective with tilted horizons. Warm, nostalgic, handmade feel. No straight lines — all lines have organic wobble. No digital perfection.",
    characterDescription: "A childlike crayon-drawn figure with uneven limbs, oversized round head, dot eyes, and a wide simple smile. Drawn with thick colorful crayon strokes, slightly messy. The character has charming imperfections — one leg shorter, one eye bigger. Joyful, innocent, handmade feel.",
    colorGuidance: "Bold primary crayon colors: bright red, blue, yellow, green, orange, purple. Thick waxy application. Colors overlapping and slightly outside lines. White manila/construction paper tone showing through. Scribbled texture for shaded areas.",
    labelStyle: "Handwritten-style labels in thick crayon. Irregular letter sizes and wobbly baselines. At most 2-3 short words. Labels look like a child wrote them. No printed fonts, no seals.",
    spaceRule: "Full and lively composition. Main subject 50-70% of frame. Everything slightly tilted for naive perspective. Background fully colored with crayon. No empty white areas — fill with scribble or sky.",
    structureHints: {
      Workflow: "crayon-drawn arrows connecting wobbly boxes",
      "系统局部": "2-4 items arranged like a child's drawing of a house",
      "前后对比": "left side with frown, right side with smile",
      "角色状态": "character with 2-3 crayon-drawn emotion bubbles",
      "概念隐喻": "a crayon drawing of the metaphorical idea",
      "方法分层": "stacked like a child's drawing of a building",
      "地图路线": "a squiggly crayon path with X markers",
      "小漫画分镜": "2-4 panels like a child's comic strip on construction paper",
    },
  },

  // ── 14. 光影素描 ────────────────────────────────────────────
  charcoal: {
    label: "光影素描",
    characterName: "素描人物",
    visualDna: "Dramatic charcoal sketch on off-white paper. Heavy black charcoal with smudged shading. Strong chiaroscuro with deep blacks and bright white highlights (erased charcoal). Visible paper tooth texture. Loose sketchy lines mixed with dense packed charcoal areas. Atmospheric and moody. Grayscale only, no color.",
    characterDescription: "A figure emerging from dark charcoal shadows with strong side lighting. Face partially in shadow, one side brightly lit. Features suggested through value contrast rather than lines. Hair drawn with swift charcoal strokes. The figure has a contemplative, intense presence. Artistic, dramatic.",
    colorGuidance: "Grayscale only — pure black charcoal, various grey tones from smudging, and paper white as highlight. No colors. Dark midtones dominate. Highlights are erased-back paper white.",
    labelStyle: "No text labels. Annotations should be visual — arrows or highlights created by erasing charcoal. At most 1-2 simple directional marks.",
    spaceRule: "Atmospheric composition with large shadow areas. Main subject emerging from darkness. 30-40% deep shadow, 10-15% bright highlight, rest midtones. Heavy moody feel.",
    structureHints: {
      Workflow: "diagonal beams of light separating stages",
      "系统局部": "elements emerging from darkness at different depths",
      "前后对比": "dark side vs light side with dramatic shadow divide",
      "角色状态": "single figure illuminated by dramatic side light",
      "概念隐喻": "a single object under spotlight against dark void",
      "方法分层": "layers receding into darkness with less contrast",
      "地图路线": "a path of light across a dark landscape",
      "小漫画分镜": "panels separated by stark shadow lines",
    },
  },

  // ── 15. 波普艺术 ────────────────────────────────────────────
  "pop-art": {
    label: "波普艺术",
    characterName: "波普人物",
    visualDna: "Pop art comic book style. Thick black outlines (Ben Day dots). Bold primary colors (red, yellow, blue, magenta). Halftone dot pattern for shading. Comic-style action words in burst shapes. High contrast with saturated colors. Inspired by Roy Lichtenstein and Andy Warhol. Flat colors with dot-screen shadows.",
    characterDescription: "A comic-book style character with thick black outlines, dot-screen shaded skin, wide eyes with small pupils, and an exaggerated expression (surprise, determination, or dramatic sadness). Retro 1960s pop-art comic aesthetic. The character looks like they belong in a romance or war comic panel.",
    colorGuidance: "Bold primaries: pure red (CMYK), bright yellow, cyan blue, magenta, black. Halftone dot patterns for shading (not smooth gradients). Ben Day dots in primary colors. High contrast — no subtle tones.",
    labelStyle: "Comic-style onomatopoeia in burst shapes. Bold uppercase sans-serif in black or white. POW, WOW, ZAP style sound words. At most 1-2 dramatic words per piece. Action words integrated into art.",
    spaceRule: "Bold graphic composition filling the frame. Main subject large and centered with cropped edges (Warhol style). 10-15% negative space. Strong diagonals and dynamic angles.",
    structureHints: {
      Workflow: "comic strip panels with bold borders",
      "系统局部": "repeated grid like Warhol's Campbell's soup cans",
      "前后对比": "two contrasting color versions side by side",
      "角色状态": "triptych of same character in different emotional states",
      "概念隐喻": "single bold object as pop icon",
      "方法分层": "stacked comic panels with decreasing dot screen",
      "地图路线": "comic-style map with dotted path and X marks",
      "小漫画分镜": "comic book page layout with Ben Day dots",
    },
  },

  // ── 16. 剪纸拼贴 ────────────────────────────────────────────
  "paper-cut": {
    label: "剪纸拼贴",
    characterName: "剪纸人物",
    visualDna: "Chinese paper-cut (jianzhi) collage style. Flat shapes cut from colored paper layered on a neutral background. Clean cut edges with slight paper shadow. No lines — shapes defined by contrast between paper layers. Folk art aesthetic with auspicious symbols. Warm color palette (red, gold, dark blue, white). Decorative borders.",
    characterDescription: "A paper-cut figure with flat geometric body, stylized traditional clothing suggested through layered paper shapes. Round face with simple cut-out features. The figure is composed of separate paper pieces layered together. Folk art charm. Decorative and symbolic rather than realistic.",
    colorGuidance: "Traditional Chinese paper-cut palette: Chinese red (#CC0000), gold/yellow, dark blue, white. Each color as a separate paper layer. No mixing or blending. Shadows between layers (thin dark grey offset).",
    labelStyle: "Chinese characters cut from red or gold paper as decorative elements. At most 2-4 characters. Traditional seal script or regular script style. Characters are part of the composition, not annotations.",
    spaceRule: "Decorative symmetrical or balanced composition. Circular or diamond framing common. Border decorations (clouds, flowers, geometric patterns). 15-20% negative space as the background paper showing through.",
    structureHints: {
      Workflow: "horizontal scroll of paper-cut panels",
      "系统局部": "paper-cut elements arranged in a decorative circle",
      "前后对比": "red paper-cut before vs gold paper-cut after",
      "角色状态": "paper-cut figure in traditional opera pose",
      "概念隐喻": "auspicious symbol as paper-cut centerpiece",
      "方法分层": "layered paper-cut panels with shadow depth",
      "地图路线": "paper-cut path with auspicious cloud markers",
      "小漫画分镜": "paper-cut window lattice dividing scenes",
    },
  },

  // ── 17. 水粉插画 ────────────────────────────────────────────
  gouache: {
    label: "水粉插画",
    characterName: "水粉人物",
    visualDna: "Opaque gouache illustration. Matt finish with soft, chalky texture. Gentle color transitions with visible brush strokes. Muted sophisticated palette (dusty rose, sage, slate, cream, terracotta). Soft edges with occasional crisp details. Atmospheric backgrounds with layered washes. Calm, editorial illustration feel.",
    characterDescription: "A softly rendered figure with gouache-painted features — rounded forms, gentle facial features with minimal detail, soft hair suggested through broad brush strokes. The character wears muted-toned clothing that blends harmoniously with the background. Serene, contemplative mood. Editorial illustration style.",
    colorGuidance: "Muted sophisticated palette: dusty rose, sage green, slate blue, warm cream, terracotta, charcoal. Matt opaque finish. Colors layered wet-on-wet for soft transitions. No pure bright colors.",
    labelStyle: "Editorial-style text in a clean sans-serif, small size, integrated as part of the layout. At most 1-2 short lines. Text in dark slate color. No decorative seals, no handwriting.",
    spaceRule: "Breathing room with atmospheric background. Main subject 40-50% of frame. Generous margins for editorial layout feel. Soft background washes filling empty space.",
    structureHints: {
      Workflow: "horizontal progression with soft color blocks",
      "系统局部": "2-3 elements connected by gentle color gradients",
      "前后对比": "soft dissolve between two scenes",
      "角色状态": "single figure in contemplative pose, atmospheric background",
      "概念隐喻": "a single object rendered in detailed gouache texture",
      "方法分层": "gentle horizontal bands of muted color",
      "地图路线": "a winding path through soft gouache landscape",
      "小漫画分镜": "2-4 panels separated by soft color blocks",
    },
  },

  // ── 18. 北欧简约 ────────────────────────────────────────────
  scandi: {
    label: "北欧简约",
    characterName: "北欧人物",
    visualDna: "Scandinavian minimalist design. Clean, uncluttered composition with generous white space. Muted pastel palette (pale pink, dusty blue, warm beige, sage green). Simple geometric forms with rounded organic shapes. No decorations, no textures, no patterns. One small accent element in a brighter color. Hygge-inspired warmth and simplicity.",
    characterDescription: "A minimalist Scandinavian-style figure composed of simple rounded shapes — a circular head, oval body, simple dot features. Limited color palette (2-3 colors max). The character stands in a clean environment with a single everyday object. Calm, friendly, understated. IKEA-catalog aesthetic.",
    colorGuidance: "Muted pastel palette: pale pink, dusty blue, warm beige, sage green, cream. One small accent element in a warm coral or mustard. No black — use dark charcoal for outlines if needed. No bright saturated colors.",
    labelStyle: "Minimal text in clean sans-serif, light grey or dark charcoal. At most 1-2 words. Text aligned cleanly. No decorative elements around text.",
    spaceRule: "At least 50% negative space. Clean uncluttered composition. Single main element centered or in golden ratio position. Everything has room to breathe.",
    structureHints: {
      Workflow: "simple horizontal progression with small accent dots",
      "系统局部": "2-3 simple geometric elements with connecting lines",
      "前后对比": "one simple scene with/without the accent element",
      "角色状态": "character with a single simple everyday object",
      "概念隐喻": "one minimalist object representing the idea",
      "方法分层": "simple stacked rectangles in muted tones",
      "地图路线": "minimal line with small circle markers",
      "小漫画分镜": "2-4 panels with generous white space between",
    },
  },

  // ── 19. 复古木刻 ────────────────────────────────────────────
  woodcut: {
    label: "复古木刻",
    characterName: "木刻人物",
    visualDna: "Vintage woodcut engraving style. Thick bold black lines with white carved-out areas. Parallel hatching and cross-hatching for shading. High contrast black and white. Slightly rough edges mimicking carved wood texture. Medieval or Renaissance print aesthetic. No smooth lines — all lines have jagged or carved quality. No color.",
    characterDescription: "A woodcut-engraved figure with bold black outlines and hatched shading. Stylized medieval proportions — head slightly too large, exaggerated hands. The figure's clothing is rendered with parallel line patterns. Face has a serious, timeless expression. Old-world craftsmanship feel. Woodblock print aesthetic.",
    colorGuidance: "Pure black ink on off-white/cream paper. No color. All shading through parallel hatching and cross-hatching with white lines carved into black areas. High contrast — no grey tones, only black and white.",
    labelStyle: "Blackletter or medieval-style text labels carved into white banners. At most 1-2 short words. Text integrated into the composition as carved banners or title ribbons. No modern fonts.",
    spaceRule: "Dense composition filling 80% of the frame. Decorative borders and ornamental corners in woodcut style. Minimal empty space — fill with hatching or decorative elements.",
    structureHints: {
      Workflow: "horizontal progression like a medieval frieze",
      "系统局部": "elements separated by decorative carved borders",
      "前后对比": "left panel (bad) vs right panel (good) with carved divide",
      "角色状态": "single figure in dramatic medieval pose",
      "概念隐喻": "a woodcut emblem or coat of arms representing the idea",
      "方法分层": "carved layers with ornamental corner pieces",
      "地图路线": "an antique map style path with compass rose",
      "小漫画分镜": "panels separated by carved woodcut borders",
    },
  },

  // ── 20. 科幻光绘 ────────────────────────────────────────────
  "sci-fi-glow": {
    label: "科幻光绘",
    characterName: "全息投影",
    visualDna: "Sci-fi holographic light painting. Pitch black background with luminous glow elements. Neon bright lines (cyan, magenta, white) forming wireframe structures and data streams. Light trails and particle effects. Holographic transparent surfaces with grid overlays. Futuristic UI elements floating in space. Clean, cold, high-tech aesthetic.",
    characterDescription: "A holographic figure made of luminous wireframe lines and glowing particles. The figure is semi-transparent with digital grid lines tracing the body contours. Cyan and magenta rim light. The face is suggested through light points rather than solid features. Digital entity, not human. Futuristic and ethereal.",
    colorGuidance: "Pure black (#000) background. Neon cyan (#00FFFF) for primary lines, magenta (#FF00FF) for highlights, white for data points. Glow effects with Gaussian blur on light sources. No shadow, no solid fills — everything is light-based.",
    labelStyle: "HUD-style digital readouts in cyan monospace font. Floating UI panels with transparent backgrounds and thin borders. Data point labels, coordinates, or metrics. At most 2-3 small data readouts.",
    spaceRule: "Dark void with light elements floating in space. Main subject 40-60% of frame. Elements at various depths with different glow intensities. 40-50% black void around the subject.",
    structureHints: {
      Workflow: "flow represented by particle trails and data stream lines",
      "系统局部": "holographic panels with wireframe connections",
      "前后对比": "two holographic projections side by side",
      "角色状态": "wireframe figure with pulsing data readouts",
      "概念隐喻": "a holographic projection of the metaphorical object",
      "方法分层": "transparent holographic panels at different depths",
      "地图路线": "glowing navigation path with waypoint coordinates",
      "小漫画分镜": "holographic screen transitions between panels",
    },
  },
};

export const STYLE_PRESET_IDS = Object.keys(STYLE_PRESETS);
export const DEFAULT_PRESET = "xiaobei";
