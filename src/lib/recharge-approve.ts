import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import { creditWallet, WALLET_REFERENCE_TYPE } from '@/lib/wallet';
import { getRechargeOrder, updateRechargeOrder } from '@/queries/prisma/recharge';

export async function approveRechargeOrder(
  orderId: string,
  {
    reviewedBy,
    adminNote,
    txId,
  }: {
    reviewedBy?: string;
    adminNote?: string;
    txId?: string;
  } = {},
) {
  const order = await getRechargeOrder(orderId);

  if (!order) {
    throw new Error('Recharge order not found.');
  }

  if (order.status !== RECHARGE_ORDER_STATUS.pending) {
    throw new Error('Only pending orders can be approved.');
  }

  await creditWallet(order.userId, order.amount, {
    description: `Recharge order ${order.orderNo}`,
    referenceType: WALLET_REFERENCE_TYPE.rechargeOrder,
    referenceId: order.id,
  });

  return updateRechargeOrder(orderId, {
    status: RECHARGE_ORDER_STATUS.approved,
    adminNote,
    reviewedBy,
    reviewedAt: new Date(),
    ...(txId ? { txId } : {}),
  });
}
