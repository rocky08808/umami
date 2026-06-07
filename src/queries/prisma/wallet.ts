import type { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';

type PrismaClient = typeof prisma.client;

export async function getOrCreateUserWallet(userId: string, tx: PrismaClient = prisma.client) {
  const existing = await tx.userWallet.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return tx.userWallet.create({
    data: {
      id: uuid(),
      userId,
    },
  });
}

export async function updateWalletBalance(
  walletId: string,
  balance: Prisma.Decimal,
  tx: PrismaClient = prisma.client,
) {
  return tx.userWallet.update({
    where: { id: walletId },
    data: { balance },
  });
}

export async function createWalletTransaction(
  data: {
    id: string;
    userId: string;
    walletId: string;
    type: string;
    amount: Prisma.Decimal;
    balanceAfter: Prisma.Decimal;
    currency: string;
    description?: string;
    referenceType?: string;
    referenceId?: string;
  },
  tx: PrismaClient = prisma.client,
) {
  return tx.walletTransaction.create({
    data,
  });
}

export async function getWalletTransactionByReference(
  referenceType: string,
  referenceId: string,
) {
  return prisma.client.walletTransaction.findUnique({
    where: {
      referenceType_referenceId: {
        referenceType,
        referenceId,
      },
    },
  });
}

export async function getWalletTransactions(userId: string, limit = 20) {
  return prisma.client.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
