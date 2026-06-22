import Closing from "../chapters/closing/Closing";
import { narrations as closingNarrations } from "../chapters/closing/narrations";
import Coldopen from "../chapters/coldopen/Coldopen";
import { narrations as coldopenNarrations } from "../chapters/coldopen/narrations";
import GpsProof from "../chapters/gps-proof/GpsProof";
import { narrations as gpsProofNarrations } from "../chapters/gps-proof/narrations";
import LengthContraction from "../chapters/length-contraction/LengthContraction";
import { narrations as lengthContractionNarrations } from "../chapters/length-contraction/narrations";
import MassEnergy from "../chapters/mass-energy/MassEnergy";
import { narrations as massEnergyNarrations } from "../chapters/mass-energy/narrations";
import SpacetimeCurve from "../chapters/spacetime-curve/SpacetimeCurve";
import { narrations as spacetimeCurveNarrations } from "../chapters/spacetime-curve/narrations";
import TimeDilation from "../chapters/time-dilation/TimeDilation";
import { narrations as timeDilationNarrations } from "../chapters/time-dilation/narrations";
import TwinParadox from "../chapters/twin-paradox/TwinParadox";
import { narrations as twinParadoxNarrations } from "../chapters/twin-paradox/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "closing", title: "Closing", narrations: closingNarrations, Component: Closing },
  { id: "coldopen", title: "Coldopen", narrations: coldopenNarrations, Component: Coldopen },
  { id: "gps-proof", title: "Gps Proof", narrations: gpsProofNarrations, Component: GpsProof },
  { id: "length-contraction", title: "Length Contraction", narrations: lengthContractionNarrations, Component: LengthContraction },
  { id: "mass-energy", title: "Mass Energy", narrations: massEnergyNarrations, Component: MassEnergy },
  { id: "spacetime-curve", title: "Spacetime Curve", narrations: spacetimeCurveNarrations, Component: SpacetimeCurve },
  { id: "time-dilation", title: "Time Dilation", narrations: timeDilationNarrations, Component: TimeDilation },
  { id: "twin-paradox", title: "Twin Paradox", narrations: twinParadoxNarrations, Component: TwinParadox },
];
