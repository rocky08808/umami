import { canSubscribeToPlan, type PlanId } from '@/lib/billing';
import { uuid } from '@/lib/crypto';
import { isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { RECHARGE_OPTIONS, getRechargeOption } from '@/lib/recharge';
import {
  activateSubscription,
  getSubscriptionPeriodDays,
  getUserSubscriptionDetails,
} from '@/lib/subscription';
import { debitWallet, WALLET_REFERENCE_TYPE } from '@/lib/wallet';

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return badRequest({ message: 'Wallet is not available.', code: 'wallet-unavailable' });
  }

  const plan = body?.plan as PlanId | undefined;
  const option = plan ? getRechargeOption(plan) : undefined;

  if (!option) {
    return badRequest({ message: 'Invalid plan.', code: 'invalid-plan' });
  }

  const subscription = await getUserSubscriptionDetails(auth.user.id);

  if (!canSubscribeToPlan(subscription, option.plan)) {
    return badRequest({
      message: 'Business plan must expire before subscribing to Pro.',
      code: 'business-active',
    });
  }

  try {
    await debitWallet(auth.user.id, option.amount, {
      description: `Subscribe to ${option.plan}`,
      referenceType: WALLET_REFERENCE_TYPE.subscription,
      referenceId: uuid(),
    });
  } catch (e: any) {
    if (e?.message === 'Insufficient balance.') {
      return badRequest({ message: 'Insufficient balance.', code: 'insufficient-balance' });
    }

    throw e;
  }

  const periodDays = getSubscriptionPeriodDays(subscription, option.plan);

  await activateSubscription(auth.user.id, option.plan, periodDays);

  return json({
    plan: option.plan,
    amount: option.amount,
    currency: 'USDT',
    periodDays,
    plans: RECHARGE_OPTIONS.map(item => item.plan),
  });
}
