import BeyondCurrency from "../chapters/beyond-currency/BeyondCurrency";
import { narrations as beyondCurrencyNarrations } from "../chapters/beyond-currency/narrations";
import NotPerfect from "../chapters/not-perfect/NotPerfect";
import { narrations as notPerfectNarrations } from "../chapters/not-perfect/narrations";
import TamperProof from "../chapters/tamper-proof/TamperProof";
import { narrations as tamperProofNarrations } from "../chapters/tamper-proof/narrations";
import VillageLedger from "../chapters/village-ledger/VillageLedger";
import { narrations as villageLedgerNarrations } from "../chapters/village-ledger/narrations";
import WhoKeepsLedger from "../chapters/who-keeps-ledger/WhoKeepsLedger";
import { narrations as whoKeepsLedgerNarrations } from "../chapters/who-keeps-ledger/narrations";
import WhySpecial from "../chapters/why-special/WhySpecial";
import { narrations as whySpecialNarrations } from "../chapters/why-special/narrations";

import type { ChapterDef } from "./types";

export const CHAPTERS: ChapterDef[] = [
  { id: "beyond-currency", title: "Beyond Currency", narrations: beyondCurrencyNarrations, Component: BeyondCurrency },
  { id: "not-perfect", title: "Not Perfect", narrations: notPerfectNarrations, Component: NotPerfect },
  { id: "tamper-proof", title: "Tamper Proof", narrations: tamperProofNarrations, Component: TamperProof },
  { id: "village-ledger", title: "Village Ledger", narrations: villageLedgerNarrations, Component: VillageLedger },
  { id: "who-keeps-ledger", title: "Who Keeps Ledger", narrations: whoKeepsLedgerNarrations, Component: WhoKeepsLedger },
  { id: "why-special", title: "Why Special", narrations: whySpecialNarrations, Component: WhySpecial },
];
