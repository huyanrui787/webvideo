import type { ChapterDef } from "./types";

import ColdopenChapter from "../chapters/01-coldopen/ColdopenChapter";
import { coldopenNarrations } from "../chapters/01-coldopen/narrations";
import WritingChapter from "../chapters/02-writing/WritingChapter";
import { writingNarrations } from "../chapters/02-writing/narrations";
import ImageChapter from "../chapters/03-image/ImageChapter";
import { imageNarrations } from "../chapters/03-image/narrations";
import CastChapter from "../chapters/04-cast/CastChapter";
import { castNarrations } from "../chapters/04-cast/narrations";
import WebLearnChapter from "../chapters/05-web-learn/WebLearnChapter";
import { webLearnNarrations } from "../chapters/05-web-learn/narrations";
import SkillSpriteChapter from "../chapters/06-skill-sprite/SkillSpriteChapter";
import { skillSpriteNarrations } from "../chapters/06-skill-sprite/narrations";
import PlatformOutroChapter from "../chapters/07-platform-outro/PlatformOutroChapter";
import { platformOutroNarrations } from "../chapters/07-platform-outro/narrations";

/**
 * Order = order of presentation.
 *
 * Each chapter MUST provide a `narrations: Narration[]` array. Its length
 * is the chapter's step count.
 *
 * stepDurations ≈ 中文字数 / 4 + 0.8s 余量，作为 seek/render 模式时长。
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: "coldopen",
    title: "一眼 AI",
    narrations: coldopenNarrations,
    Component: ColdopenChapter,
    stepDurations: [4, 4.5, 3.5, 3.5, 4, 4],
  },
  {
    id: "writing",
    title: "写作升级",
    narrations: writingNarrations,
    Component: WritingChapter,
    stepDurations: [3.5, 6, 5, 5, 4, 4.5],
  },
  {
    id: "image",
    title: "生图与幻灯片",
    narrations: imageNarrations,
    Component: ImageChapter,
    stepDurations: [4, 4, 4.5, 4, 4, 4, 4],
  },
  {
    id: "cast",
    title: "音视频 · Cast",
    narrations: castNarrations,
    Component: CastChapter,
    stepDurations: [4, 4, 4.5, 4.5, 4, 4, 6, 5],
  },
  {
    id: "web-learn",
    title: "网页与学习",
    narrations: webLearnNarrations,
    Component: WebLearnChapter,
    stepDurations: [4, 4.5, 5, 4, 7],
  },
  {
    id: "skill-sprite",
    title: "激励计划与精灵",
    narrations: skillSpriteNarrations,
    Component: SkillSpriteChapter,
    stepDurations: [4, 6.5, 5.5, 6, 5.5, 5.5],
  },
  {
    id: "platform-outro",
    title: "多端 · API · 结尾",
    narrations: platformOutroNarrations,
    Component: PlatformOutroChapter,
    stepDurations: [4.5, 5.5, 5.5, 5.5, 6.5, 5],
  },
];
