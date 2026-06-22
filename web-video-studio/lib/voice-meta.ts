/** Display metadata for known voice IDs. Unlisted voices show raw ID. */
export const VOICE_META: Record<string, { zh: string; gender: "male" | "female" | "neutral"; style: string }> = {
  // ─── MiniMax 精品中文音色 ─────────────────────────────────────────
  "male-qn-qingse":           { zh: "青涩青年",   gender: "male",    style: "普通话" },
  "male-qn-jingying":         { zh: "精英青年",   gender: "male",    style: "普通话" },
  "male-qn-badao":            { zh: "霸道青年",   gender: "male",    style: "普通话" },
  "male-qn-daxuesheng":       { zh: "青年大学生", gender: "male",    style: "普通话" },
  "female-shaonv":             { zh: "少女",       gender: "female",  style: "普通话" },
  "female-yujie":              { zh: "御姐",       gender: "female",  style: "普通话" },
  "female-chengshu":           { zh: "成熟女性",   gender: "female",  style: "普通话" },
  "female-tianmei":            { zh: "甜美女性",   gender: "female",  style: "普通话" },
  "male-qn-qingse-jingpin":   { zh: "青涩青年·精品", gender: "male", style: "普通话" },
  "male-qn-jingying-jingpin": { zh: "精英青年·精品", gender: "male", style: "普通话" },
  "male-qn-badao-jingpin":    { zh: "霸道青年·精品", gender: "male", style: "普通话" },
  "male-qn-daxuesheng-jingpin":{ zh: "大学生·精品", gender: "male", style: "普通话" },
  "female-shaonv-jingpin":    { zh: "少女·精品",   gender: "female",  style: "普通话" },
  "female-yujie-jingpin":     { zh: "御姐·精品",   gender: "female",  style: "普通话" },
  "female-chengshu-jingpin":  { zh: "成熟女性·精品",gender: "female", style: "普通话" },
  "female-tianmei-jingpin":   { zh: "甜美女性·精品",gender: "female", style: "普通话" },
  // ─── MiniMax 中文角色音色 ────────────────────────────────────────
  "bingjiao_didi":   { zh: "冰娇弟弟",   gender: "male",   style: "角色" },
  "junlang_nanyou":  { zh: "俊朗男友",   gender: "male",   style: "角色" },
  "chunzhen_xuedi":  { zh: "纯真学弟",   gender: "male",   style: "角色" },
  "lengdan_xiongzhang":{ zh: "冷淡兄长", gender: "male",   style: "角色" },
  "badao_shaoye":    { zh: "霸道少爷",   gender: "male",   style: "角色" },
  "tianxin_xiaoling":{ zh: "甜心小玲",   gender: "female", style: "角色" },
  "qiaopi_mengmei":  { zh: "俏皮萌妹",   gender: "female", style: "角色" },
  "wumei_yujie":     { zh: "妩媚御姐",   gender: "female", style: "角色" },
  "diadia_xuemei":   { zh: "嗲嗲学妹",   gender: "female", style: "角色" },
  "danya_xuejie":    { zh: "淡雅学姐",   gender: "female", style: "角色" },
  "clever_boy":      { zh: "聪明男孩",   gender: "male",   style: "角色" },
  "cute_boy":        { zh: "可爱男孩",   gender: "male",   style: "角色" },
  "lovely_girl":     { zh: "可爱女孩",   gender: "female", style: "角色" },
  // ─── MiniMax 播报/专业音色 ─────────────────────────────────────────
  "Chinese (Mandarin)_News_Anchor":         { zh: "新闻播音",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Reliable_Executive":  { zh: "可靠高管",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Male_Announcer":      { zh: "男播音员",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Radio_Host":          { zh: "电台主持",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Mature_Woman":        { zh: "成熟女性",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Sweet_Lady":          { zh: "甜美女士",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Warm_Bestie":         { zh: "温暖闺蜜",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Gentle_Youth":        { zh: "温柔青年",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Warm_Girl":           { zh: "温暖女声",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Lyrical_Voice":       { zh: "抒情嗓音",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Crisp_Girl":          { zh: "清脆女声",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Soft_Girl":           { zh: "柔美女声",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Gentleman":           { zh: "绅士男声",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Straightforward_Boy": { zh: "直爽男孩",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Wise_Women":          { zh: "智慧女性",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Humorous_Elder":      { zh: "幽默长者",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Kind-hearted_Antie":  { zh: "亲切阿姨",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Southern_Young_Man":  { zh: "南方少年",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_HK_Flight_Attendant": { zh: "港式空姐",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Kind-hearted_Elder":  { zh: "慈祥长者",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Sincere_Adult":       { zh: "诚恳成年",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Cute_Spirit":         { zh: "可爱精灵",   gender: "female",  style: "播报" },
  "Chinese (Mandarin)_Pure-hearted_Boy":    { zh: "纯心少年",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Stubborn_Friend":     { zh: "固执朋友",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Gentle_Senior":       { zh: "温柔学长",   gender: "male",    style: "播报" },
  "Chinese (Mandarin)_Unrestrained_Young_Man":{ zh: "不羁青年", gender: "male",    style: "播报" },
  // ─── OpenAI ───────────────────────────────────────────────────────
  "alloy":   { zh: "Alloy（中性）",  gender: "neutral", style: "OpenAI" },
  "echo":    { zh: "Echo（男声）",   gender: "male",    style: "OpenAI" },
  "fable":   { zh: "Fable（叙事）",  gender: "neutral", style: "OpenAI" },
  "onyx":    { zh: "Onyx（低沉）",   gender: "male",    style: "OpenAI" },
  "nova":    { zh: "Nova（女声）",   gender: "female",  style: "OpenAI" },
  "shimmer": { zh: "Shimmer（轻柔）",gender: "female",  style: "OpenAI" },
};

export const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

// Curated Chinese-first list for display (hide the 200+ English-only voices by default)
export const MINIMAX_FEATURED = [
  "female-chengshu", "female-yujie", "female-tianmei", "female-shaonv",
  "male-qn-jingying", "male-qn-daxuesheng", "male-qn-qingse", "male-qn-badao",
  "Chinese (Mandarin)_News_Anchor", "Chinese (Mandarin)_Radio_Host",
  "Chinese (Mandarin)_Reliable_Executive", "Chinese (Mandarin)_Lyrical_Voice",
  "female-chengshu-jingpin", "female-yujie-jingpin",
  "male-qn-jingying-jingpin", "male-qn-badao-jingpin",
  "bingjiao_didi", "junlang_nanyou", "tianxin_xiaoling", "qiaopi_mengmei",
  "Chinese (Mandarin)_Warm_Girl", "Chinese (Mandarin)_Sweet_Lady",
  "Chinese (Mandarin)_Gentle_Youth", "Chinese (Mandarin)_Humorous_Elder",
];

// ─── System defaults: used when user hasn't explicitly configured ────
export const DEFAULT_TTS_PROVIDER = "minimax";
export const DEFAULT_TTS_VOICE = "male-qn-jingying"; // 精英青年 — clear professional Mandarin
export const DEFAULT_BGM_TRACK_ID = "gentle-narration"; // 轻快叙事 — guitar + light percussion
export const DEFAULT_BGM_VOLUME = 0.22; // slightly lower than manual pick (28%) to ensure voice clarity
