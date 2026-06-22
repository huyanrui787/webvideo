import BankCrisis from "../chapters/bank-crisis/BankCrisis";
import { narrations as bankCrisisNarrations } from "../chapters/bank-crisis/narrations";
import BlockchainCore from "../chapters/blockchain-core/BlockchainCore";
import { narrations as blockchainCoreNarrations } from "../chapters/blockchain-core/narrations";
import ColdOpen from "../chapters/cold-open/ColdOpen";
import { narrations as coldOpenNarrations } from "../chapters/cold-open/narrations";
import DigitalGold from "../chapters/digital-gold/DigitalGold";
import { narrations as digitalGoldNarrations } from "../chapters/digital-gold/narrations";
import MiningRace from "../chapters/mining-race/MiningRace";
import { narrations as miningRaceNarrations } from "../chapters/mining-race/narrations";
import RealChallenges from "../chapters/real-challenges/RealChallenges";
import { narrations as realChallengesNarrations } from "../chapters/real-challenges/narrations";
import SocialExperiment from "../chapters/social-experiment/SocialExperiment";
import { narrations as socialExperimentNarrations } from "../chapters/social-experiment/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "bank-crisis", title: "Bank Crisis", narrations: bankCrisisNarrations, Component: BankCrisis },
  { id: "blockchain-core", title: "Blockchain Core", narrations: blockchainCoreNarrations, Component: BlockchainCore },
  { id: "cold-open", title: "Cold Open", narrations: coldOpenNarrations, Component: ColdOpen },
  { id: "digital-gold", title: "Digital Gold", narrations: digitalGoldNarrations, Component: DigitalGold },
  { id: "mining-race", title: "Mining Race", narrations: miningRaceNarrations, Component: MiningRace },
  { id: "real-challenges", title: "Real Challenges", narrations: realChallengesNarrations, Component: RealChallenges },
  { id: "social-experiment", title: "Social Experiment", narrations: socialExperimentNarrations, Component: SocialExperiment },
];
