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

export const RECHARGE_BALANCE_PLAN = 'balance';

export const RECHARGE_AMOUNT_OPTIONS = [
  {
    amount: 20,
    labelKey: 'recharge.amount-option-pro',
  },
  {
    amount: 200,
    labelKey: 'recharge.amount-option-business',
  },
  {
    amount: 500,
    labelKey: 'recharge.amount-option-500',
  },
  {
    amount: 1000,
    labelKey: 'recharge.amount-option-1000',
  },
] as const;

export const DEFAULT_RECHARGE_AMOUNT = 200;

export const RECHARGE_MIN_AMOUNT = 1;
export const RECHARGE_MAX_AMOUNT = 100_000;

export const RECHARGE_SUBSCRIPTION_DAYS = 30;

export const PRO_TO_BUSINESS_BONUS_DAYS = 3;

export function isProToBusinessUpgrade(
  current: { plan: PlanId; expired?: boolean },
  targetPlan: PlanId,
) {
  return current.plan === 'pro' && targetPlan === 'business' && !current.expired;
}

export function getProToBusinessUpgradeBreakdown() {
  return {
    businessDays: RECHARGE_SUBSCRIPTION_DAYS,
    proConvertedDays: PRO_TO_BUSINESS_BONUS_DAYS,
    totalDays: RECHARGE_SUBSCRIPTION_DAYS + PRO_TO_BUSINESS_BONUS_DAYS,
  };
}

export function getSubscriptionPeriodDays(
  current: { plan: PlanId; expired?: boolean },
  targetPlan: PlanId,
) {
  if (isProToBusinessUpgrade(current, targetPlan)) {
    return getProToBusinessUpgradeBreakdown().totalDays;
  }

  return RECHARGE_SUBSCRIPTION_DAYS;
}

export const RECHARGE_MAX_PENDING_ORDERS_PER_USER = 1;
export const RECHARGE_AUTO_EXPIRE_MINUTES = 30;
export const RECHARGE_AUTO_TX_PREFIX = 'auto:pending:';
export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
export const USDT_TRC20_DECIMALS = 6;

export function isAutoRechargeTxId(txId: string) {
  return txId.startsWith(RECHARGE_AUTO_TX_PREFIX);
}

export function formatPayAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  return amount.toFixed(2);
}

export function roundPayAmount(value: number) {
  return Math.round(value * 100) / 100;
}

export const RECHARGE_ORDER_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;

export function getRechargeOption(plan: string) {
  return RECHARGE_OPTIONS.find(option => option.plan === plan);
}

export function getRechargeAmountOption(amount: number) {
  return RECHARGE_AMOUNT_OPTIONS.find(option => option.amount === amount);
}

export function roundAmount(value: number) {
  return Math.trunc(value);
}

export function sanitizeRechargeAmountInput(value: string) {
  return value.replace(/\D/g, '');
}

export function formatAmountDisplay(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  return String(roundAmount(amount));
}

export function parseRechargeAmount(value: unknown) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return null;
    }

    if (value < RECHARGE_MIN_AMOUNT || value > RECHARGE_MAX_AMOUNT) {
      return null;
    }

    return value;
  }

  const trimmed = String(value ?? '').trim();

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const amount = Number(trimmed);

  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return null;
  }

  if (amount < RECHARGE_MIN_AMOUNT || amount > RECHARGE_MAX_AMOUNT) {
    return null;
  }

  return amount;
}

export function planToRechargeAmount(plan: string) {
  return getRechargeOption(plan)?.amount;
}

export function getRechargeOrderLabelKey(plan: string) {
  if (plan === RECHARGE_BALANCE_PLAN) {
    return 'recharge.type-balance';
  }

  return `billing.plan-${plan}`;
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
