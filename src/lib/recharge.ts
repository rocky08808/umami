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

export function getRechargeOption(plan: string) {
  return RECHARGE_OPTIONS.find(option => option.plan === plan);
}
