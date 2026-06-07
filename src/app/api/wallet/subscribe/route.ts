import type { PlanId } from '@/lib/billing';
import { uuid } from '@/lib/crypto';
import { isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import {
  RECHARGE_OPTIONS,
  RECHARGE_SUBSCRIPTION_DAYS,
  getRechargeOption,
} from '@/lib/recharge';
import { activateSubscription } from '@/lib/subscription';
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

  await activateSubscription(auth.user.id, option.plan, RECHARGE_SUBSCRIPTION_DAYS);

  return json({
    plan: option.plan,
    amount: option.amount,
    currency: 'USDT',
    periodDays: RECHARGE_SUBSCRIPTION_DAYS,
    plans: RECHARGE_OPTIONS.map(item => item.plan),
  });
}
