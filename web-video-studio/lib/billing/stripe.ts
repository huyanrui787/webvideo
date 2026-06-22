// ═══════════════════════════════════════════════════════════════════════════════
// Stripe integration — Checkout Sessions, Customer Portal, Webhooks
// Requires: npm install stripe
// Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { users, subscriptions, paymentOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { addCredits } from "./credits";
import { getPlan } from "./plans";
import type { PlanCode, BillingCycle } from "./types";

// Lazy-loaded Stripe client — avoids import error if package not installed
let _stripe: any = null;
function getStripe(): any {
  if (!_stripe) {
    const Stripe = require("stripe");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_dummy", {
      apiVersion: "2025-06-16.acacia" as any,
    });
  }
  return _stripe;
}

const now = () => Math.floor(Date.now() / 1000);

// ─── Checkout Session ───────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a subscription or credit package purchase.
 * Returns the URL to redirect the user to.
 */
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  planCode?: PlanCode;
  billingCycle?: BillingCycle;
  creditPackageId?: string;
  creditAmount?: number;
  creditPriceCents?: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe is not configured" };
  }

  const {
    userId, userEmail,
    planCode, billingCycle = "monthly",
    creditPackageId, creditAmount, creditPriceCents,
    successUrl, cancelUrl,
  } = params;

  // ── Get or create Stripe customer ──
  let customerId = await getStripeCustomerId(userId);
  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail, metadata: { userId } });
    customerId = customer.id;
    await db.update(users)
      .set({ stripeCustomerId: customerId, updatedAt: now() })
      .where(eq(users.id, userId));
  }

  const ts = now();
  const orderId = nanoid(10);

  if (planCode) {
    // ── Subscription checkout ──
    const plan = await getPlan(planCode);
    if (!plan) return { error: `Unknown plan: ${planCode}` };
    const priceCents = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

    // Create payment order record
    await db.insert(paymentOrders).values({
      id: orderId,
      userId,
      provider: "stripe",
      orderType: "subscription",
      amountCents: priceCents,
      currency: "USD",
      planCode,
      billingCycle,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Web Video Studio – ${plan.name} (${billingCycle})` },
          unit_amount: priceCents,
          recurring: billingCycle === "annual" ? { interval: "year" } : { interval: "month" },
        },
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { orderId, userId, planCode, billingCycle },
    });

    // Update order with session ID
    await db.update(paymentOrders)
      .set({ providerSessionId: session.id, providerPayload: JSON.stringify(session), updatedAt: now() })
      .where(eq(paymentOrders.id, orderId));

    return { url: session.url! };
  } else if (creditPackageId && creditAmount && creditPriceCents) {
    // ── Credit package checkout ──
    await db.insert(paymentOrders).values({
      id: orderId,
      userId,
      provider: "stripe",
      orderType: "credits",
      amountCents: creditPriceCents,
      currency: "USD",
      creditPackageId,
      creditsAmount: creditAmount,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `Web Video Studio – ${creditAmount} Credits` },
          unit_amount: creditPriceCents,
        },
        quantity: 1,
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { orderId, userId, creditPackageId, creditAmount: String(creditAmount) },
    });

    await db.update(paymentOrders)
      .set({ providerSessionId: session.id, providerPayload: JSON.stringify(session), updatedAt: now() })
      .where(eq(paymentOrders.id, orderId));

    return { url: session.url! };
  }

  return { error: "Invalid checkout params" };
}

// ─── Customer Portal ────────────────────────────────────────────────────────────

export async function createPortalSession(
  userId: string,
  returnUrl: string,
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe is not configured" };
  }

  const customerId = await getStripeCustomerId(userId);
  if (!customerId) return { error: "No Stripe customer found" };

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// ─── Webhook Handler ───────────────────────────────────────────────────────────

export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<{ received: true } | { error: string }> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return { error: "STRIPE_WEBHOOK_SECRET not configured" };

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe] webhook signature verification failed:", err.message);
    return { error: `Webhook signature invalid: ${err.message}` };
  }

  const ts = now();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { orderId, userId, planCode, billingCycle, creditPackageId, creditAmount } = session.metadata ?? {};

      if (!orderId) break;

      // Mark payment order as paid
      await db.update(paymentOrders)
        .set({
          status: "paid",
          providerOrderId: session.payment_intent as string,
          paidAt: ts,
          updatedAt: ts,
        })
        .where(eq(paymentOrders.id, orderId));

      if (planCode && userId) {
        // ── Activate subscription ──
        const plan = await getPlan(planCode as PlanCode);
        if (!plan) break;

        const periodEnd = ts + (billingCycle === "annual" ? 365 : 30) * 24 * 60 * 60;

        // Upsert subscription
        const existing = await db.query.subscriptions.findFirst({
          where: (s, { eq }) => eq(s.userId, userId as string),
        });

        if (existing) {
          await db.update(subscriptions)
            .set({
              planCode: planCode as PlanCode,
              billingCycle: billingCycle as BillingCycle,
              status: "active",
              currentPeriodStart: ts,
              currentPeriodEnd: periodEnd,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: ts,
            })
            .where(eq(subscriptions.id, existing.id));
        } else {
          await db.insert(subscriptions).values({
            id: nanoid(10),
            userId,
            planCode: planCode as PlanCode,
            billingCycle: billingCycle as BillingCycle,
            status: "active",
            currentPeriodStart: ts,
            currentPeriodEnd: periodEnd,
            stripeSubscriptionId: session.subscription as string,
          });
        }

        // Update users table plan_code
        await db.update(users)
          .set({ planCode: planCode as PlanCode, updatedAt: ts })
          .where(eq(users.id, userId));

        // Grant subscription activation credits
        await addCredits({
          userId,
          amount: plan.monthlyCredits,
          type: "earn",
          operation: "subscription_grant",
          description: `订阅激活赠送积分 — ${plan.name}`,
          refId: orderId,
        });
      } else if (creditPackageId && creditAmount && userId) {
        // ── Grant purchased credits ──
        await addCredits({
          userId,
          amount: parseInt(creditAmount),
          type: "earn",
          operation: "package_purchase",
          description: `积分包购买: ${creditAmount} 积分`,
          refId: orderId,
          metadata: { creditPackageId },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = sub.customer as string;

      // Find user by Stripe customer ID
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.stripeCustomerId, customerId),
      });
      if (!user) break;

      // Cancel subscription at period end
      await db.update(subscriptions)
        .set({ cancelAtPeriodEnd: true, updatedAt: ts })
        .where(eq(subscriptions.userId, user.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.stripeCustomerId, customerId),
      });
      if (!user) break;

      await db.update(subscriptions)
        .set({ status: "past_due", updatedAt: ts })
        .where(eq(subscriptions.userId, user.id));
      break;
    }
  }

  return { received: true };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function getStripeCustomerId(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  return user?.stripeCustomerId ?? null;
}
