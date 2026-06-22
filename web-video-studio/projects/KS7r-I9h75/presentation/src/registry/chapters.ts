import CatOrNot from "../chapters/cat-or-not/CatOrNot";
import { narrations as catOrNotNarrations } from "../chapters/cat-or-not/narrations";
import GradientDescent from "../chapters/gradient-descent/GradientDescent";
import { narrations as gradientDescentNarrations } from "../chapters/gradient-descent/narrations";
import LayerMagic from "../chapters/layer-magic/LayerMagic";
import { narrations as layerMagicNarrations } from "../chapters/layer-magic/narrations";
import LayerRefine from "../chapters/layer-refine/LayerRefine";
import { narrations as layerRefineNarrations } from "../chapters/layer-refine/narrations";
import LearningLoop from "../chapters/learning-loop/LearningLoop";
import { narrations as learningLoopNarrations } from "../chapters/learning-loop/narrations";
import NeuronFaucet from "../chapters/neuron-faucet/NeuronFaucet";
import { narrations as neuronFaucetNarrations } from "../chapters/neuron-faucet/narrations";
import TheBrainGap from "../chapters/the-brain-gap/TheBrainGap";
import { narrations as theBrainGapNarrations } from "../chapters/the-brain-gap/narrations";
import WhyNow from "../chapters/why-now/WhyNow";
import { narrations as whyNowNarrations } from "../chapters/why-now/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "cat-or-not", title: "Cat Or Not", narrations: catOrNotNarrations, Component: CatOrNot },
  { id: "gradient-descent", title: "Gradient Descent", narrations: gradientDescentNarrations, Component: GradientDescent },
  { id: "layer-magic", title: "Layer Magic", narrations: layerMagicNarrations, Component: LayerMagic },
  { id: "layer-refine", title: "Layer Refine", narrations: layerRefineNarrations, Component: LayerRefine },
  { id: "learning-loop", title: "Learning Loop", narrations: learningLoopNarrations, Component: LearningLoop },
  { id: "neuron-faucet", title: "Neuron Faucet", narrations: neuronFaucetNarrations, Component: NeuronFaucet },
  { id: "the-brain-gap", title: "The Brain Gap", narrations: theBrainGapNarrations, Component: TheBrainGap },
  { id: "why-now", title: "Why Now", narrations: whyNowNarrations, Component: WhyNow },
];
