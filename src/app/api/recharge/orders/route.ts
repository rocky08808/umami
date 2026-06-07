import {
  RECHARGE_BALANCE_PLAN,
  RECHARGE_MAX_PENDING_ORDERS_PER_USER,
  normalizeTxId,
  parseRechargeAmount,
  planToRechargeAmount,
} from '@/lib/recharge';
import { parseRequest } from '@/lib/request';
import { badRequest, json } from '@/lib/response';
import { notifyRechargeOrderSubmitted } from '@/lib/telegram';
import {
  countUserPendingRechargeOrders,
  createRechargeOrder,
  getRechargeOrderByTxId,
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

  const txId = normalizeTxId(String(body?.txId || ''));

  if (!txId) {
    return badRequest({ message: 'Transaction ID is required.', code: 'tx-id-required' });
  }

  if (txId.length < 8) {
    return badRequest({ message: 'Transaction ID is too short.', code: 'tx-id-invalid' });
  }

  if (txId.length > 255) {
    return badRequest({ message: 'Transaction ID is too long.', code: 'tx-id-invalid' });
  }

  const existing = await getRechargeOrderByTxId(txId);

  if (existing) {
    return badRequest({
      message: 'Transaction ID already submitted.',
      code: 'tx-id-duplicate',
    });
  }

  const pendingOrderCount = await countUserPendingRechargeOrders(auth.user.id);

  if (pendingOrderCount >= RECHARGE_MAX_PENDING_ORDERS_PER_USER) {
    return badRequest({
      message: 'Pending order limit reached.',
      code: 'order-limit-reached',
    });
  }

  const order = await createRechargeOrder({
    userId: auth.user.id,
    plan: RECHARGE_BALANCE_PLAN,
    amount,
    currency: 'USDT',
    network: body?.network || process.env.USDT_NETWORK || 'TRC20',
    txId,
    periodDays: 0,
  });

  void notifyRechargeOrderSubmitted({
    orderNo: order.orderNo,
    plan: order.plan,
    amount: order.amount,
    currency: order.currency,
    username: order.user?.username,
  });

  return json(order);
}
