import { Prisma } from '@/generated/prisma/client';
import { uuid } from '@/lib/crypto';
import prisma from '@/lib/prisma';
import {
  createWalletTransaction,
  getOrCreateUserWallet,
  getWalletTransactionByReference,
  getWalletTransactions,
  updateWalletBalance,
} from '@/queries/prisma/wallet';
import { WALLET_REFERENCE_TYPE, WALLET_TRANSACTION_TYPE } from '@/lib/wallet-constants';

export { WALLET_REFERENCE_TYPE, WALLET_TRANSACTION_TYPE };

export function toWalletAmount(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value);
}

export function formatWalletAmount(value: Prisma.Decimal | number | string) {
  return Number(toWalletAmount(value).toFixed(2));
}

export async function getUserWalletSummary(userId: string, limit = 20) {
  const wallet = await getOrCreateUserWallet(userId);
  const transactions = await getWalletTransactions(userId, limit);

  return {
    balance: formatWalletAmount(wallet.balance),
    currency: wallet.currency,
    transactions: transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: formatWalletAmount(transaction.amount),
      balanceAfter: formatWalletAmount(transaction.balanceAfter),
      currency: transaction.currency,
      description: transaction.description,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      createdAt: transaction.createdAt?.toISOString() ?? null,
    })),
  };
}

interface WalletMutationOptions {
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

export async function creditWallet(
  userId: string,
  amount: number | Prisma.Decimal,
  options: WalletMutationOptions = {},
) {
  const creditAmount = toWalletAmount(amount);

  if (creditAmount.lte(0)) {
    throw new Error('Credit amount must be greater than zero.');
  }

  if (options.referenceType && options.referenceId) {
    const existing = await getWalletTransactionByReference(
      options.referenceType,
      options.referenceId,
    );

    if (existing) {
      return existing;
    }
  }

  return prisma.client.$transaction(async tx => {
    const wallet = await getOrCreateUserWallet(userId, tx);
    const nextBalance = wallet.balance.add(creditAmount);

    await updateWalletBalance(wallet.id, nextBalance, tx);

    return createWalletTransaction(
      {
        id: uuid(),
        userId,
        walletId: wallet.id,
        type: WALLET_TRANSACTION_TYPE.credit,
        amount: creditAmount,
        balanceAfter: nextBalance,
        currency: wallet.currency,
        description: options.description,
        referenceType: options.referenceType,
        referenceId: options.referenceId,
      },
      tx,
    );
  });
}

export async function debitWallet(
  userId: string,
  amount: number | Prisma.Decimal,
  options: WalletMutationOptions = {},
) {
  const debitAmount = toWalletAmount(amount);

  if (debitAmount.lte(0)) {
    throw new Error('Debit amount must be greater than zero.');
  }

  return prisma.client.$transaction(async tx => {
    const wallet = await getOrCreateUserWallet(userId, tx);

    if (wallet.balance.lt(debitAmount)) {
      throw new Error('Insufficient balance.');
    }

    const nextBalance = wallet.balance.sub(debitAmount);

    await updateWalletBalance(wallet.id, nextBalance, tx);

    return createWalletTransaction(
      {
        id: uuid(),
        userId,
        walletId: wallet.id,
        type: WALLET_TRANSACTION_TYPE.debit,
        amount: debitAmount,
        balanceAfter: nextBalance,
        currency: wallet.currency,
        description: options.description,
        referenceType: options.referenceType,
        referenceId: options.referenceId,
      },
      tx,
    );
  });
}
