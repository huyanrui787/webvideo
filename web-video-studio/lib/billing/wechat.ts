// ═══════════════════════════════════════════════════════════════════════════════
// WeChat Pay API v3 — Native (scan-to-pay) mode
// Env vars:
//   WECHAT_PAY_MCHID, WECHAT_PAY_APPID, WECHAT_PAY_API_V3_KEY,
//   WECHAT_PAY_SERIAL_NO, WECHAT_PAY_PRIVATE_KEY_PATH, WECHAT_PAY_NOTIFY_URL
// ═══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { paymentOrders } from "@/lib/db/schema";
import type { BillingCycle, PaymentStatus } from "./types";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";
import fs from "fs";

const now = () => Math.floor(Date.now() / 1000);

function getConfig() {
  return {
    mchid: process.env.WECHAT_PAY_MCHID ?? "",
    appid: process.env.WECHAT_PAY_APPID ?? "",
    apiKeyV3: process.env.WECHAT_PAY_API_V3_KEY ?? "",
    serialNo: process.env.WECHAT_PAY_SERIAL_NO ?? "",
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH ?? "",
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL ?? "",
  };
}

export function isConfigured(): boolean {
  const c = getConfig();
  return !!(c.mchid && c.appid && c.apiKeyV3 && c.serialNo);
}

// ─── Create Native Payment Order ─────────────────────────────────────────────────

export interface WechatOrderResult {
  codeUrl: string;    // QR code content for scan-to-pay
  orderNo: string;    // Internal order ID
  expiresIn: number;  // Seconds until expiry (default 300)
}

export async function createWechatOrder(params: {
  userId: string;
  amountCents: number;       // Amount in USD cents — converted to CNY at ~7.2 rate
  description: string;
  planCode?: string;
  billingCycle?: string;
  creditPackageId?: string;
  creditsAmount?: number;
}): Promise<WechatOrderResult | { error: string }> {
  const config = getConfig();
  if (!isConfigured()) return { error: "WeChat Pay is not configured" };

  const { userId, amountCents, description, planCode, billingCycle, creditPackageId, creditsAmount } = params;

  // Convert USD cents to CNY fen (× 7.2 approximate rate, integrator rounds)
  const amountFen = Math.round(amountCents * 7.2);

  const orderId = nanoid(10);
  const ts = now();
  const expireSeconds = 300;

  // 1. Store payment order in DB
  await db.insert(paymentOrders).values({
    id: orderId,
    userId,
    provider: "wechat",
    orderType: planCode ? "subscription" : "credits",
    amountCents,
    currency: "CNY",
    planCode: planCode ?? null,
    billingCycle: (billingCycle as BillingCycle) ?? null,
    creditPackageId: creditPackageId ?? null,
    creditsAmount: creditsAmount ?? null,
    status: "pending",
  });

  // 2. Build WeChat Pay API request
  const outTradeNo = `wvs_${ts}_${orderId}`;
  const body = JSON.stringify({
    appid: config.appid,
    mchid: config.mchid,
    description: description.slice(0, 127),
    out_trade_no: outTradeNo,
    time_expire: new Date((ts + expireSeconds) * 1000).toISOString(),
    notify_url: config.notifyUrl,
    amount: { total: amountFen, currency: "CNY" },
  });

  try {
    const { url, headers } = await signRequest("POST", "/v3/pay/transactions/native", body);
    const res = await fetch(url, { method: "POST", headers, body });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[wechat] create order failed:", res.status, errText);
      await db.update(paymentOrders)
        .set({ status: "failed", updatedAt: ts })
        .where(eq(paymentOrders.id, orderId));
      return { error: `WeChat Pay error ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json() as { code_url: string };

    // 3. Save code_url to order
    await db.update(paymentOrders)
      .set({
        wxCodeUrl: data.code_url,
        providerOrderId: outTradeNo,
        providerPayload: JSON.stringify(data),
        updatedAt: ts,
      })
      .where(eq(paymentOrders.id, orderId));

    return { codeUrl: data.code_url, orderNo: orderId, expiresIn: expireSeconds };
  } catch (err: any) {
    console.error("[wechat] create order exception:", err.message);
    return { error: `WeChat Pay error: ${err.message}` };
  }
}

// ─── Query Payment Status ───────────────────────────────────────────────────────

export async function queryOrder(orderId: string): Promise<{
  status: string;
  transactionId?: string;
}> {
  const order = await db.query.paymentOrders.findFirst({
    where: (o, { eq }) => eq(o.id, orderId),
  });

  if (!order || order.provider !== "wechat") {
    return { status: "not_found" };
  }

  if (order.status === "paid") {
    return { status: "paid", transactionId: order.wxTransactionId ?? undefined };
  }

  // If local status is still pending, query WeChat
  if (!isConfigured() || !order.providerOrderId) {
    return { status: order.status };
  }

  const outTradeNo = order.providerOrderId;
  try {
    const { url, headers } = await signRequest(
      "GET",
      `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${getConfig().mchid}`,
    );

    const res = await fetch(url, { headers });
    if (!res.ok) return { status: "pending" };

    const data = await res.json() as { trade_state: string; transaction_id?: string };
    const stateMap: Partial<Record<string, PaymentStatus>> = {
      SUCCESS: "paid",
      REFUND: "cancelled",
      NOTPAY: "pending",
      CLOSED: "expired",
      USERPAYING: "pending",
    };
    let mappedStatus: PaymentStatus = stateMap[data.trade_state] ?? "pending";

    // Update local status if changed (order.status is known not "paid" due to early return above)
    if (mappedStatus === "paid") {
      const ts = now();
      await db.update(paymentOrders)
        .set({
          status: "paid",
          wxTransactionId: data.transaction_id,
          paidAt: ts,
          updatedAt: ts,
        })
        .where(eq(paymentOrders.id, orderId));

      // Post-payment processing
      await processPaidOrder(orderId, order.userId, order.orderType, order.planCode, order.creditPackageId, order.creditsAmount);
    }

    return { status: mappedStatus, transactionId: data.transaction_id };
  } catch (err: any) {
    console.error("[wechat] query order error:", err.message);
    return { status: "error" };
  }
}

// ─── Notification (Webhook) Handler ────────────────────────────────────────────

export async function handleWechatNotify(
  headers: Headers,
  body: string,
): Promise<{ code: "SUCCESS" | "FAIL"; message?: string }> {
  const config = getConfig();

  // 1. Verify signature
  const wechatTimestamp = headers.get("wechatpay-timestamp") ?? "";
  const wechatNonce = headers.get("wechatpay-nonce") ?? "";
  const wechatSignature = headers.get("wechatpay-signature") ?? "";
  const wechatSerial = headers.get("wechatpay-serial") ?? "";

  const message = `${wechatTimestamp}\n${wechatNonce}\n${body}\n`;
  const verified = verifySignature(message, wechatSignature, wechatSerial);
  if (!verified) {
    console.error("[wechat] notify signature verification failed");
    return { code: "FAIL", message: "Signature verification failed" };
  }

  // 2. Decrypt resource
  let resource: any;
  try {
    const payload = JSON.parse(body);
    resource = decryptResource(
      payload.resource.nonce,
      payload.resource.ciphertext,
      payload.resource.associated_data,
    );
  } catch (err: any) {
    console.error("[wechat] decrypt resource failed:", err.message);
    return { code: "FAIL", message: "Decrypt failed" };
  }

  const outTradeNo = resource.out_trade_no;
  const transactionId = resource.transaction_id;
  const tradeState = resource.trade_state;
  const ts = now();

  // 3. Find and update the order
  const order = await db.query.paymentOrders.findFirst({
    where: (o, { eq }) => eq(o.providerOrderId, outTradeNo),
  });

  if (!order) {
    console.error("[wechat] notify: order not found for out_trade_no:", outTradeNo);
    return { code: "FAIL", message: "Order not found" };
  }

  if (tradeState === "SUCCESS" && order.status !== "paid") {
    await db.update(paymentOrders)
      .set({
        status: "paid",
        wxTransactionId: transactionId,
        paidAt: ts,
        updatedAt: ts,
      })
      .where(eq(paymentOrders.id, order.id));

    await processPaidOrder(order.id, order.userId, order.orderType, order.planCode, order.creditPackageId, order.creditsAmount);
  }

  return { code: "SUCCESS" };
}

// ─── Post-payment processing ───────────────────────────────────────────────────

async function processPaidOrder(
  orderId: string,
  userId: string,
  orderType: "subscription" | "credits",
  planCode: string | null,
  creditPackageId: string | null,
  creditsAmount: number | null,
): Promise<void> {
  const ts = now();

  if (orderType === "subscription" && planCode) {
    const { getPlan } = await import("./plans");
    const plan = await getPlan(planCode as import("./types").PlanCode);
    if (!plan) return;

    const periodEnd = ts + 30 * 24 * 60 * 60; // 30 days (monthly)
    const { users, subscriptions } = await import("@/lib/db/schema");

    // Upsert subscription
    const existing = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    if (existing) {
      await db.update(subscriptions)
        .set({
          planCode,
          status: "active",
          currentPeriodStart: ts,
          currentPeriodEnd: periodEnd,
          updatedAt: ts,
        })
        .where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values({
        id: nanoid(10),
        userId,
        planCode,
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: ts,
        currentPeriodEnd: periodEnd,
      });
    }

    await db.update(users)
      .set({ planCode: planCode as any, updatedAt: ts })
      .where(eq(users.id, userId));

    // Grant subscription activation credits
    const { addCredits: addCreditsFn } = await import("./credits");
    await addCreditsFn({
      userId,
      amount: plan.monthlyCredits,
      type: "earn",
      operation: "subscription_grant",
      description: `微信支付订阅激活 — ${plan.name}`,
      refId: orderId,
    });
  } else if (orderType === "credits" && creditsAmount) {
    const { addCredits: addCreditsFn } = await import("./credits");
    await addCreditsFn({
      userId,
      amount: creditsAmount,
      type: "earn",
      operation: "package_purchase",
      description: `微信支付积分购买: ${creditsAmount} 积分`,
      refId: orderId,
    });
  }
}

// ─── Crypto helpers ────────────────────────────────────────────────────────────

function loadPrivateKey(): string {
  const path = getConfig().privateKeyPath;
  if (!path || !fs.existsSync(path)) {
    throw new Error("WeChat Pay private key not found at " + path);
  }
  return fs.readFileSync(path, "utf-8");
}

async function signRequest(
  method: string,
  path: string,
  body?: string,
): Promise<{ url: string; headers: Record<string, string> }> {
  const config = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const signMessage = `${method}\n${path}\n${timestamp}\n${nonce}\n${body ?? ""}\n`;

  const privateKey = loadPrivateKey();
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signMessage);
  const signature = sign.sign(privateKey, "base64");

  const authHeader =
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${config.mchid}",` +
    `nonce_str="${nonce}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${config.serialNo}",` +
    `signature="${signature}"`;

  return {
    url: `https://api.mch.weixin.qq.com${path}`,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authHeader,
    },
  };
}

function verifySignature(message: string, signature: string, serialNo: string): boolean {
  try {
    // WeChat notification signatures use the WeChat PAYMENT platform certificate
    // (NOT the merchant's own certificate). Load from WECHAT_PLATFORM_CERT env var.
    const platformCert = process.env.WECHAT_PLATFORM_CERT;
    if (!platformCert) {
      console.warn("[wechat] WECHAT_PLATFORM_CERT not set — cannot verify notification signature");
      // In production, fetch from: GET https://api.mch.weixin.qq.com/v3/certificates
      return false;
    }
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(message);
    const publicKey = crypto.createPublicKey({ key: Buffer.from(platformCert, "base64"), format: "der", type: "spki" }).export({ type: "spki", format: "pem" });
    return verify.verify(publicKey, signature, "base64");
  } catch (err) {
    console.error("[wechat] verify signature error:", err);
    return false;
  }
}

function decryptResource(
  nonce: string,
  ciphertext: string,
  associatedData: string,
): any {
  const key = getConfig().apiKeyV3;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key),
    Buffer.from(nonce),
  );
  decipher.setAAD(Buffer.from(associatedData));
  const tag = Buffer.from(ciphertext.slice(-32), "hex"); // last 16 bytes are the auth tag
  const encrypted = Buffer.from(ciphertext.slice(0, -32), "hex");
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf-8"));
}
