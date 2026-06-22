import type { ChapterDef } from "./types";

import Coldopen from "../chapters/01-coldopen/Coldopen";
import { narrations as coldopenNarrations } from "../chapters/01-coldopen/narrations";
import Twins from "../chapters/02-twins/Twins";
import { narrations as twinsNarrations } from "../chapters/02-twins/narrations";
import Benchmarks from "../chapters/03-benchmarks/Benchmarks";
import { narrations as benchmarksNarrations } from "../chapters/03-benchmarks/narrations";
import Stripe from "../chapters/04-stripe/Stripe";
import { narrations as stripeNarrations } from "../chapters/04-stripe/narrations";
import Symphony from "../chapters/05-symphony/Symphony";
import { narrations as symphonyNarrations } from "../chapters/05-symphony/narrations";
import Science from "../chapters/06-science/Science";
import { narrations as scienceNarrations } from "../chapters/06-science/narrations";
import Mythos from "../chapters/07-mythos/Mythos";
import { narrations as mythosNarrations } from "../chapters/07-mythos/narrations";

/**
 * Order = order of presentation.
 *
 * Each chapter MUST provide a `narrations: Narration[]` array. Its length
 * is the chapter's step count — there is no `totalSteps` to maintain
 * separately. This guarantees the audio synthesis pipeline, the runtime
 * stepper, and the chapter `.tsx` switch on `step` cannot drift apart.
 *
 * Visual styling (color, fonts) comes entirely from the active theme —
 * chapters never hard-code palette / font names. See THEMES.md.
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: "coldopen",
    title: "太危险不能公开",
    narrations: coldopenNarrations,
    Component: Coldopen,
  },
  {
    id: "twins",
    title: "寓言与神话",
    narrations: twinsNarrations,
    Component: Twins,
  },
  {
    id: "benchmarks",
    title: "跑分碾压",
    narrations: benchmarksNarrations,
    Component: Benchmarks,
  },
  {
    id: "stripe",
    title: "一天 vs 两个月",
    narrations: stripeNarrations,
    Component: Stripe,
  },
  {
    id: "symphony",
    title: "用代码写贝多芬",
    narrations: symphonyNarrations,
    Component: Symphony,
  },
  {
    id: "science",
    title: "裸眼通关到当科学家",
    narrations: scienceNarrations,
    Component: Science,
  },
  {
    id: "mythos",
    title: "神话开场",
    narrations: mythosNarrations,
    Component: Mythos,
  },
];
