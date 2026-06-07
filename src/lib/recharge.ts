import type { PlanId } from '@/lib/billing';

export interface RechargeOption {
  plan: Exclude<PlanId, 'hobby' | 'enterprise'>;
  amount: number;
  nameKey: string;
}

export const RECHARGE_OPTIONS: RechargeOption[] = [
  {
    plan: 'pro',
    amount: 20,
    nameKey: 'billing.plan-pro',
  },
  {
    plan: 'business',
    amount: 200,
    nameKey: 'billing.plan-business',
  },
];

export const RECHARGE_SUBSCRIPTION_DAYS = 30;

export const RECHARGE_MAX_PENDING_ORDERS_PER_USER = 2;

export const RECHARGE_ORDER_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export function getRechargeOption(plan: string) {
  return RECHARGE_OPTIONS.find(option => option.plan === plan);
}

export function normalizeTxId(value: string) {
  const trimmed = value.trim();

  const urlMatch = trimmed.match(/transaction\/([a-fA-F0-9]{64})/i);
  if (urlMatch) {
    return urlMatch[1].toLowerCase();
  }

  const hashMatch = trimmed.match(/[a-fA-F0-9]{64}/);
  if (hashMatch) {
    return hashMatch[0].toLowerCase();
  }

  return trimmed;
}
