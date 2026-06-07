import { z } from 'zod';
import type { PlanId } from '@/lib/billing';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import { activateSubscription } from '@/lib/subscription';
import { creditWallet, debitWallet, WALLET_REFERENCE_TYPE } from '@/lib/wallet';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound, unauthorized } from '@/lib/response';
import { getRechargeOrder, updateRechargeOrder } from '@/queries/prisma/recharge';
import { canViewUsers } from '@/permissions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const schema = z.object({
    adminNote: z.string().max(500).optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const { orderId } = await params;
  const order = await getRechargeOrder(orderId);

  if (!order) {
    return notFound();
  }

  if (order.status !== RECHARGE_ORDER_STATUS.pending) {
    return badRequest({ message: 'Only pending orders can be approved.' });
  }

  await creditWallet(order.userId, order.amount, {
    description: `Recharge order ${order.orderNo}`,
    referenceType: WALLET_REFERENCE_TYPE.rechargeOrder,
    referenceId: order.id,
  });

  await debitWallet(order.userId, order.amount, {
    description: `Subscribe to ${order.plan}`,
    referenceType: WALLET_REFERENCE_TYPE.subscription,
    referenceId: `${order.id}:subscribe`,
  });

  await activateSubscription(order.userId, order.plan as PlanId, order.periodDays);

  const updated = await updateRechargeOrder(orderId, {
    status: RECHARGE_ORDER_STATUS.approved,
    adminNote: body.adminNote,
    reviewedBy: auth.user.id,
    reviewedAt: new Date(),
  });

  return json(updated);
}
