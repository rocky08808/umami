import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';
import { getRandomChars } from '@/lib/generate';

export function createRechargeOrderNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RC${date}${getRandomChars(6).toUpperCase()}`;
}

export async function getUserSubscriptionRecord(userId: string) {
  return prisma.client.userSubscription.findUnique({
    where: { userId },
  });
}

export async function upsertUserSubscription(
  userId: string,
  data: { plan: string; expiresAt: Date },
) {
  return prisma.client.userSubscription.upsert({
    where: { userId },
    create: {
      id: uuid(),
      userId,
      plan: data.plan,
      expiresAt: data.expiresAt,
    },
    update: {
      plan: data.plan,
      expiresAt: data.expiresAt,
    },
  });
}

export async function createRechargeOrder(data: {
  id?: string;
  userId: string;
  plan: string;
  amount: number;
  payAmount?: number;
  currency: string;
  network: string;
  txId: string;
  periodDays: number;
  expiresAt?: Date;
}) {
  return prisma.client.rechargeOrder.create({
    data: {
      id: data.id || uuid(),
      orderNo: createRechargeOrderNo(),
      userId: data.userId,
      plan: data.plan,
      amount: data.amount,
      payAmount: data.payAmount ?? data.amount,
      currency: data.currency,
      network: data.network,
      txId: data.txId,
      periodDays: data.periodDays,
      expiresAt: data.expiresAt,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });
}

export async function getRechargeOrder(orderId: string) {
  return prisma.client.rechargeOrder.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });
}

export async function getRechargeOrderByTxId(txId: string) {
  return prisma.client.rechargeOrder.findFirst({
    where: {
      txId,
      status: { in: ['pending', 'approved'] },
    },
  });
}

export async function getUserRechargeOrders(userId: string) {
  return prisma.client.rechargeOrder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function countUserPendingRechargeOrders(userId: string) {
  return prisma.client.rechargeOrder.count({
    where: { userId, status: 'pending' },
  });
}

export async function getRechargeOrders(filters: {
  status?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { status, userId, page = 1, pageSize = 20, search } = filters;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNo: { contains: search, mode: 'insensitive' } },
      { txId: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, count] = await Promise.all([
    prisma.client.rechargeOrder.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.rechargeOrder.count({ where }),
  ]);

  return { data, count, page, pageSize };
}

export async function updateRechargeOrder(
  orderId: string,
  data: {
    status?: string;
    adminNote?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    txId?: string;
  },
) {
  return prisma.client.rechargeOrder.update({
    where: { id: orderId },
    data,
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });
}
