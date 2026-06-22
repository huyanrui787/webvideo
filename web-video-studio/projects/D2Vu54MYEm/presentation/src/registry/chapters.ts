import type { ChapterDef } from "./types";

import Coldopen from "../chapters/01-coldopen/Coldopen";
import { coldopenNarrations } from "../chapters/01-coldopen/narrations";
import Naming from "../chapters/02-naming/Naming";
import { namingNarrations } from "../chapters/02-naming/narrations";
import Benchmark from "../chapters/03-benchmark/Benchmark";
import { benchmarkNarrations } from "../chapters/03-benchmark/narrations";
import Partner from "../chapters/04-partner/Partner";
import { partnerNarrations } from "../chapters/04-partner/narrations";
import Demos from "../chapters/05-demos/Demos";
import { demosNarrations } from "../chapters/05-demos/narrations";
import Science from "../chapters/06-science/Science";
import { scienceNarrations } from "../chapters/06-science/narrations";
import Pause from "../chapters/07-pause/Pause";
import { pauseNarrations } from "../chapters/07-pause/narrations";
import Throne from "../chapters/08-throne/Throne";
import { throneNarrations } from "../chapters/08-throne/narrations";

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
    title: "太危险的模型解封了",
    narrations: coldopenNarrations,
    stepDurations: [5.110, 2.660, 1.840, 8.320, 8.240],
    Component: Coldopen,
  },
  {
    id: "naming",
    title: "寓言与神话同源",
    narrations: namingNarrations,
    stepDurations: [10.620, 2.700, 3.890, 5.760, 8.460, 4.900, 11.410],
    Component: Naming,
  },
  {
    id: "benchmark",
    title: "跑分碾压",
    narrations: benchmarkNarrations,
    stepDurations: [13.030, 7.670, 9.650, 9.610, 7.990, 5.440],
    Component: Benchmark,
  },
  {
    id: "partner",
    title: "不像工具，像伙伴",
    narrations: partnerNarrations,
    stepDurations: [4.000, 5.540, 11.020, 8.420, 10.120, 8.960],
    Component: Partner,
  },
  {
    id: "demos",
    title: "自己造物",
    narrations: demosNarrations,
    stepDurations: [4.100, 4.640, 7.160, 4.900, 9.830, 11.840, 6.160],
    Component: Demos,
  },
  {
    id: "science",
    title: "AI 当科学家",
    narrations: scienceNarrations,
    stepDurations: [5.940, 7.780, 4.000, 10.040, 8.320, 3.170],
    Component: Science,
  },
  {
    id: "pause",
    title: "问题被重写了",
    narrations: pauseNarrations,
    stepDurations: [3.600, 5.400],
    Component: Pause,
  },
  {
    id: "throne",
    title: "神话开场",
    narrations: throneNarrations,
    stepDurations: [13.640, 9.940, 8.680, 9.830, 6.700],
    Component: Throne,
  },
];
