import DarkSide from "../chapters/dark-side/DarkSide";
import { narrations as darkSideNarrations } from "../chapters/dark-side/narrations";
import Genesis from "../chapters/genesis/Genesis";
import { narrations as genesisNarrations } from "../chapters/genesis/narrations";
import IronChain from "../chapters/iron-chain/IronChain";
import { narrations as ironChainNarrations } from "../chapters/iron-chain/narrations";
import MiningWar from "../chapters/mining-war/MiningWar";
import { narrations as miningWarNarrations } from "../chapters/mining-war/narrations";
import NeverStops from "../chapters/never-stops/NeverStops";
import { narrations as neverStopsNarrations } from "../chapters/never-stops/narrations";
import NoBossLedger from "../chapters/no-boss-ledger/NoBossLedger";
import { narrations as noBossLedgerNarrations } from "../chapters/no-boss-ledger/narrations";
import WhyValue from "../chapters/why-value/WhyValue";
import { narrations as whyValueNarrations } from "../chapters/why-value/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "dark-side", title: "Dark Side", narrations: darkSideNarrations,
    stepDurations: [9.140, 9.360, 5.220], Component: DarkSide },
  { id: "genesis", title: "Genesis", narrations: genesisNarrations,
    stepDurations: [9.040, 5.110, 10.300, 3.890], Component: Genesis },
  { id: "iron-chain", title: "Iron Chain", narrations: ironChainNarrations,
    stepDurations: [8.320, 7.920, 9.320, 13.640, 5.720], Component: IronChain },
  { id: "mining-war", title: "Mining War", narrations: miningWarNarrations,
    stepDurations: [5.110, 4.970, 7.340, 6.590, 3.280, 6.660], Component: MiningWar },
  { id: "never-stops", title: "Never Stops", narrations: neverStopsNarrations,
    stepDurations: [5.580, 6.010, 9.000, 4.860], Component: NeverStops },
  { id: "no-boss-ledger", title: "No Boss Ledger", narrations: noBossLedgerNarrations,
    stepDurations: [11.660, 9.760, 9.940, 7.740, 8.210], Component: NoBossLedger },
  { id: "why-value", title: "Why Value", narrations: whyValueNarrations,
    stepDurations: [4.500, 6.840, 7.130, 5.760, 7.810], Component: WhyValue },
];
