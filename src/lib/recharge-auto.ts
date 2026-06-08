import { addMinutes } from 'date-fns';
import { uuid } from '@/lib/crypto';
import {
  RECHARGE_AUTO_EXPIRE_MINUTES,
  RECHARGE_AUTO_TX_PREFIX,
  RECHARGE_BALANCE_PLAN,
  RECHARGE_ORDER_STATUS,
  roundPayAmount,
} from '@/lib/recharge';
import { approveRechargeOrder } from '@/lib/recharge-approve';
import { notifyRechargeOrderApproved } from '@/lib/telegram';
import { fetchIncomingUsdtTransfers } from '@/lib/tron';
import prisma from '@/lib/prisma';
import {
  createRechargeOrder,
  getRechargeOrderByTxId,
  updateRechargeOrder,
} from '@/queries/prisma/recharge';

function getWalletAddress() {
  return process.env.USDT_WALLET_ADDRESS?.trim() || '';
}

function amountsMatch(expected: number, actual: number) {
  return Math.abs(expected - actual) < 0.001;
}

export async function generateUniquePayAmount(creditAmount: number) {
  const now = new Date();

  for (let suffix = 1; suffix <= 99; suffix += 1) {
    const payAmount = roundPayAmount(creditAmount + suffix / 100);
    const conflict = await prisma.client.rechargeOrder.findFirst({
      where: {
        status: RECHARGE_ORDER_STATUS.pending,
        payAmount,
        expiresAt: { gt: now },
      },
    });

    if (!conflict) {
      return payAmount;
    }
  }

  throw new Error('Unable to allocate unique payment amount.');
}

export async function createAutoRechargeOrder({
  userId,
  amount,
  network,
}: {
  userId: string;
  amount: number;
  network: string;
}) {
  const orderId = uuid();
  const payAmount = await generateUniquePayAmount(amount);
  const expiresAt = addMinutes(new Date(), RECHARGE_AUTO_EXPIRE_MINUTES);

  return createRechargeOrder({
    id: orderId,
    userId,
    plan: RECHARGE_BALANCE_PLAN,
    amount,
    payAmount,
    currency: 'USDT',
    network,
    txId: `${RECHARGE_AUTO_TX_PREFIX}${orderId}`,
    periodDays: 0,
    expiresAt,
  });
}

export async function expireStaleAutoRechargeOrders() {
  const now = new Date();

  await prisma.client.rechargeOrder.updateMany({
    where: {
      status: RECHARGE_ORDER_STATUS.pending,
      expiresAt: { lte: now },
      txId: { startsWith: RECHARGE_AUTO_TX_PREFIX },
    },
    data: {
      status: RECHARGE_ORDER_STATUS.rejected,
      adminNote: 'Order expired.',
      reviewedAt: now,
    },
  });
}

export async function processAutoRechargeOrders() {
  const walletAddress = getWalletAddress();

  if (!walletAddress) {
    return { matched: 0, expired: 0 };
  }

  await expireStaleAutoRechargeOrders();

  const pendingOrders = await prisma.client.rechargeOrder.findMany({
    where: {
      status: RECHARGE_ORDER_STATUS.pending,
      txId: { startsWith: RECHARGE_AUTO_TX_PREFIX },
      expiresAt: { gt: new Date() },
      payAmount: { not: null },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!pendingOrders.length) {
    return { matched: 0, expired: 0 };
  }

  const oldestCreatedAt = pendingOrders.reduce((min, order) => {
    const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : min;
    return Math.min(min, createdAt);
  }, Date.now());

  const transfers = await fetchIncomingUsdtTransfers(walletAddress, oldestCreatedAt - 60_000);
  let matched = 0;

  for (const order of pendingOrders) {
    const payAmount = Number(order.payAmount);
    const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : 0;
    const expiresAt = order.expiresAt ? new Date(order.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;

    const transfer = transfers.find(item => {
      return (
        item.to.toLowerCase() === walletAddress.toLowerCase()
        && amountsMatch(payAmount, item.amount)
        && item.blockTimestamp >= createdAt - 60_000
        && item.blockTimestamp <= expiresAt
      );
    });

    if (!transfer) {
      continue;
    }

    const existing = await getRechargeOrderByTxId(transfer.transactionId);

    if (existing && existing.id !== order.id) {
      continue;
    }

    const updated = await approveRechargeOrder(order.id, {
      txId: transfer.transactionId,
      adminNote: 'Auto approved.',
    });

    void notifyRechargeOrderApproved({
      orderNo: updated.orderNo,
      amount: Number(updated.amount),
      currency: updated.currency,
      username: updated.user?.username,
      txId: transfer.transactionId,
      auto: true,
    });

    matched += 1;
  }

  return { matched, expired: 0 };
}

export async function getUserActiveAutoRechargeOrder(userId: string) {
  return prisma.client.rechargeOrder.findFirst({
    where: {
      userId,
      status: RECHARGE_ORDER_STATUS.pending,
      txId: { startsWith: RECHARGE_AUTO_TX_PREFIX },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}
