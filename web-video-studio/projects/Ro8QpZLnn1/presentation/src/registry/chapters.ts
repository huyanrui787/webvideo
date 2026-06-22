import Closing from "../chapters/closing/Closing";
import { narrations as closingNarrations } from "../chapters/closing/narrations";
import Coldopen from "../chapters/coldopen/Coldopen";
import { narrations as coldopenNarrations } from "../chapters/coldopen/narrations";
import HallucinationSecurity from "../chapters/hallucination-security/HallucinationSecurity";
import { narrations as hallucinationSecurityNarrations } from "../chapters/hallucination-security/narrations";
import HowItWorks from "../chapters/how-it-works/HowItWorks";
import { narrations as howItWorksNarrations } from "../chapters/how-it-works/narrations";
import LogicBias from "../chapters/logic-bias/LogicBias";
import { narrations as logicBiasNarrations } from "../chapters/logic-bias/narrations";
import WhatIsCodex from "../chapters/what-is-codex/WhatIsCodex";
import { narrations as whatIsCodexNarrations } from "../chapters/what-is-codex/narrations";
import WhatItCanDo from "../chapters/what-it-can-do/WhatItCanDo";
import { narrations as whatItCanDoNarrations } from "../chapters/what-it-can-do/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "closing", title: "Closing", narrations: closingNarrations, Component: Closing },
  { id: "coldopen", title: "Coldopen", narrations: coldopenNarrations, Component: Coldopen },
  { id: "hallucination-security", title: "Hallucination Security", narrations: hallucinationSecurityNarrations, Component: HallucinationSecurity },
  { id: "how-it-works", title: "How It Works", narrations: howItWorksNarrations, Component: HowItWorks },
  { id: "logic-bias", title: "Logic Bias", narrations: logicBiasNarrations, Component: LogicBias },
  { id: "what-is-codex", title: "What Is Codex", narrations: whatIsCodexNarrations, Component: WhatIsCodex },
  { id: "what-it-can-do", title: "What It Can Do", narrations: whatItCanDoNarrations, Component: WhatItCanDo },
];
