export type PlanId = 'hobby' | 'pro' | 'business' | 'enterprise';

export interface PlanConfig {
  id: PlanId;
  nameKey: string;
  price: string;
  priceSuffixKey?: string;
  introKey?: string;
  featureKeys: string[];
  actionKey?: string;
  trialKey?: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'hobby',
    nameKey: 'billing.plan-hobby',
    price: '$0',
    priceSuffixKey: 'billing.per-month',
    introKey: 'billing.get-started',
    featureKeys: [
      'billing.hobby-events',
      'billing.hobby-websites',
      'billing.hobby-retention',
      'billing.hobby-support',
    ],
  },
  {
    id: 'pro',
    nameKey: 'billing.plan-pro',
    price: '$20',
    priceSuffixKey: 'billing.per-month',
    introKey: 'billing.everything-in-hobby',
    featureKeys: [
      'billing.pro-events',
      'billing.pro-overages',
      'billing.pro-websites',
      'billing.pro-members',
      'billing.pro-retention',
      'billing.pro-support',
    ],
    actionKey: 'billing.upgrade-to-pro',
    trialKey: 'billing.free-trial',
  },
  {
    id: 'business',
    nameKey: 'billing.plan-business',
    price: '$200',
    priceSuffixKey: 'billing.per-month',
    introKey: 'billing.everything-in-pro',
    featureKeys: [
      'billing.business-events',
      'billing.business-overages',
      'billing.business-websites',
      'billing.business-members',
      'billing.business-retention',
      'billing.business-replays',
      'billing.business-white-label',
      'billing.business-streaming-api',
      'billing.business-support',
    ],
    actionKey: 'billing.upgrade-to-business',
    trialKey: 'billing.free-trial',
  },
  {
    id: 'enterprise',
    nameKey: 'billing.plan-enterprise',
    price: 'billing.custom',
    introKey: 'billing.everything-in-business',
    featureKeys: [
      'billing.enterprise-sso',
      'billing.enterprise-onboarding',
      'billing.enterprise-sla',
      'billing.enterprise-pricing',
      'billing.enterprise-retention',
      'billing.enterprise-invoicing',
      'billing.enterprise-support',
    ],
    actionKey: 'billing.contact-us',
  },
];

export function getCurrentPlanId({
  isBusiness,
  isPro,
}: {
  isBusiness: boolean;
  isPro: boolean;
}): PlanId {
  if (isBusiness) {
    return 'business';
  }

  if (isPro) {
    return 'pro';
  }

  return 'hobby';
}
