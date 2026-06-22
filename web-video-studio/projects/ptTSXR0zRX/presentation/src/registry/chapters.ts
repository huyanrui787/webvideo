import AColdopen from "../chapters/a-coldopen/AColdopen";
import { narrations as aColdopenNarrations } from "../chapters/a-coldopen/narrations";
import BWaveParticle from "../chapters/b-wave-particle/BWaveParticle";
import { narrations as bWaveParticleNarrations } from "../chapters/b-wave-particle/narrations";
import CElectronShock from "../chapters/c-electron-shock/CElectronShock";
import { narrations as cElectronShockNarrations } from "../chapters/c-electron-shock/narrations";
import DCatSuperposition from "../chapters/d-cat-superposition/DCatSuperposition";
import { narrations as dCatSuperpositionNarrations } from "../chapters/d-cat-superposition/narrations";
import EUncertaintyEntanglement from "../chapters/e-uncertainty-entanglement/EUncertaintyEntanglement";
import { narrations as eUncertaintyEntanglementNarrations } from "../chapters/e-uncertainty-entanglement/narrations";
import FQuantumApps from "../chapters/f-quantum-apps/FQuantumApps";
import { narrations as fQuantumAppsNarrations } from "../chapters/f-quantum-apps/narrations";
import GEmbrace from "../chapters/g-embrace/GEmbrace";
import { narrations as gEmbraceNarrations } from "../chapters/g-embrace/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "a-coldopen", title: "A Coldopen", narrations: aColdopenNarrations, Component: AColdopen },
  { id: "b-wave-particle", title: "B Wave Particle", narrations: bWaveParticleNarrations, Component: BWaveParticle },
  { id: "c-electron-shock", title: "C Electron Shock", narrations: cElectronShockNarrations, Component: CElectronShock },
  { id: "d-cat-superposition", title: "D Cat Superposition", narrations: dCatSuperpositionNarrations, Component: DCatSuperposition },
  { id: "e-uncertainty-entanglement", title: "E Uncertainty Entanglement", narrations: eUncertaintyEntanglementNarrations, Component: EUncertaintyEntanglement },
  { id: "f-quantum-apps", title: "F Quantum Apps", narrations: fQuantumAppsNarrations, Component: FQuantumApps },
  { id: "g-embrace", title: "G Embrace", narrations: gEmbraceNarrations, Component: GEmbrace },
];
