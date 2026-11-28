// Payment gateway boundary. Screens and the store only talk to this file.
// Today it answers locally after a short delay. To go live, replace the bodies with calls to the serverless API
// (POST /api/payments/create, GET /api/payments/:billId, and the webhook that settles the payment).
// The secret key must stay on the server and never ship in the app bundle.
import type { OnlineMethod } from '../types';

export const ONLINE_METHODS: OnlineMethod[] = ['GCash', 'Maya', 'Card', 'QR Ph'];
export const METHOD_LABEL: Record<OnlineMethod, string> = { GCash: 'GCash', Maya: 'Maya', Card: 'Credit or debit card', 'QR Ph': 'QR Ph' };
export const METHOD_SUB: Record<OnlineMethod, string> = {
  GCash: 'Approve in your GCash app', Maya: 'Approve in your Maya app', Card: 'Visa or Mastercard', 'QR Ph': 'Scan with any bank or e-wallet app',
};
export const isOnline = (m: string): m is OnlineMethod => (ONLINE_METHODS as string[]).includes(m);

/** Gateway fee per method: a percentage plus a fixed amount, in pesos. */
const FEES: Record<OnlineMethod, { pct: number; fixed: number }> = {
  GCash: { pct: 0.025, fixed: 0 }, Maya: { pct: 0.02, fixed: 0 }, Card: { pct: 0.035, fixed: 15 }, 'QR Ph': { pct: 0.015, fixed: 0 },
};
/** Fee rates for display on the admin Setup screen. */
export const FEE_PCT = Object.fromEntries(Object.entries(FEES).map(([k, v]) => [k, v.pct])) as Record<OnlineMethod, number>;
export const FEE_FIXED = Object.fromEntries(Object.entries(FEES).map(([k, v]) => [k, v.fixed])) as Record<OnlineMethod, number>;
const round2 = (n: number) => Math.round(n * 100) / 100;
export const feeFor = (method: OnlineMethod, amount: number) => round2(amount * FEES[method].pct + FEES[method].fixed);
/** Amounts go to the gateway in centavos. */
export const toCentavos = (pesos: number) => Math.round(pesos * 100);

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const rand = (n: number) => Array.from({ length: n }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const between = (a: number, b: number) => a + Math.random() * (b - a);

/** Next clinic reference, for example VCP-20261127-000123. The counter continues from the highest one already used. */
export function nextRef(used: string[], now = new Date()): string {
  const top = used.map(r => /^VCP-\d{8}-(\d+)$/.exec(r || '')).reduce((m, x) => Math.max(m, x ? Number(x[1]) : 0), 122);
  return `VCP-${stamp(now)}-${pad(top + 1, 6)}`;
}

export const CHECKOUT_MINUTES = 30;
export interface Checkout {
  billId: string; method: OnlineMethod; amount: number; fee: number; net: number;
  /** Clinic reference shown to the owner and the clinic. */
  ref: string; sessionId: string; createdAt: number; expiresAt: number;
}
export type Outcome =
  | { status: 'paid'; providerRef: string; paidAt: number }
  | { status: 'failed'; providerRef: string; paidAt: number; reason: string }
  | { status: 'expired'; providerRef: string; paidAt: number; reason: string };

const FAIL_REASONS: Record<OnlineMethod, string[]> = {
  GCash: ['Insufficient GCash balance', 'The payment was not approved in GCash'],
  Maya: ['Insufficient Maya balance', 'The payment was not approved in Maya'],
  Card: ['The card was declined by the issuer', 'The card could not be verified (3-D Secure failed)'],
  'QR Ph': ['The bank app reported the transfer as unsuccessful'],
};

export const paymentService = {
  /** Opens a checkout for a bill. */
  async createCheckout(input: { billId: string; method: OnlineMethod; amount: number; usedRefs: string[] }): Promise<Checkout> {
    await wait(between(500, 900));
    const now = Date.now(); const fee = feeFor(input.method, input.amount);
    return {
      billId: input.billId, method: input.method, amount: input.amount, fee, net: round2(input.amount - fee),
      ref: nextRef(input.usedRefs), sessionId: `cs_${rand(24)}`, createdAt: now, expiresAt: now + CHECKOUT_MINUTES * 60_000,
    };
  },
  /** Owner approves the payment. Resolves with the final result after a realistic wait. */
  async pay(c: Checkout, opts: { fast?: boolean } = {}): Promise<Outcome> {
    await wait(opts.fast ? between(700, 1200) : between(2200, 3800));
    const providerRef = `pay_${rand(24)}`; const paidAt = Date.now(); const roll = Math.random();
    if (roll < 0.08) return { status: 'expired', providerRef, paidAt, reason: 'The checkout expired before the payment was completed' };
    if (roll < 0.22) { const r = FAIL_REASONS[c.method]; return { status: 'failed', providerRef, paidAt, reason: r[Math.floor(Math.random() * r.length)] }; }
    return { status: 'paid', providerRef, paidAt };
  },
  /** Refund of a paid online payment. */
  async refund(): Promise<{ refundedAt: number }> {
    await wait(between(700, 1200));
    return { refundedAt: Date.now() };
  },
};
