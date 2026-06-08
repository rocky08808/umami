import {
  RECHARGE_MAX_PENDING_ORDERS_PER_USER,
  parseRechargeAmount,
  planToRechargeAmount,
} from '@/lib/recharge';
import { createAutoRechargeOrder } from '@/lib/recharge-auto';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { notifyRechargeOrderSubmitted } from '@/lib/telegram';
import {
  countUserPendingRechargeOrders,
  getUserRechargeOrders,
} from '@/queries/prisma/recharge';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const orders = await getUserRechargeOrders(auth.user.id);

  return json(orders);
}

export async function POST(request: Request) {
  const { auth, body, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const rawAmount = body?.amount != null ? body.amount : planToRechargeAmount(String(body?.plan || ''));
  const amount = parseRechargeAmount(rawAmount);

  if (amount == null) {
    return badRequest({ message: 'Invalid amount.', code: 'invalid-amount' });
  }

  if (!process.env.USDT_WALLET_ADDRESS?.trim()) {
    return badRequest({ message: 'Wallet address is not configured.', code: 'wallet-not-configured' });
  }

  const pendingOrderCount = await countUserPendingRechargeOrders(auth.user.id);

  if (pendingOrderCount >= RECHARGE_MAX_PENDING_ORDERS_PER_USER) {
    return badRequest({
      message: 'Pending order limit reached.',
      code: 'order-limit-reached',
    });
  }

  const order = await createAutoRechargeOrder({
    userId: auth.user.id,
    amount,
    network: body?.network || process.env.USDT_NETWORK || 'TRC20',
  });

  void notifyRechargeOrderSubmitted({
    orderNo: order.orderNo,
    plan: order.plan,
    amount: Number(order.payAmount ?? order.amount),
    currency: order.currency,
    username: order.user?.username,
    auto: true,
  });

  return json(order);
}
