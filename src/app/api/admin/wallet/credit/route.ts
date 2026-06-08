import { z } from 'zod';
import { isSelfHostedBilling } from '@/lib/billing-limits';
import { uuid } from '@/lib/crypto';
import { parseRechargeAmount } from '@/lib/recharge';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound, unauthorized } from '@/lib/response';
import { creditWallet, formatWalletAmount, WALLET_REFERENCE_TYPE } from '@/lib/wallet';
import { canViewUsers } from '@/permissions';
import { getUser } from '@/queries/prisma/user';

export async function POST(request: Request) {
  const schema = z.object({
    userId: z.string().uuid(),
    amount: z.union([z.number(), z.string()]),
    note: z.string().max(500).optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  if (!isSelfHostedBilling()) {
    return unauthorized();
  }

  const amount = parseRechargeAmount(body.amount);

  if (amount == null) {
    return badRequest({ message: 'Invalid amount.', code: 'invalid-amount' });
  }

  const user = await getUser(body.userId);

  if (!user) {
    return notFound();
  }

  const note = body.note?.trim();
  const description = note
    ? `Admin credit (${auth.user.username}): ${note}`
    : `Admin credit (${auth.user.username})`;

  const transaction = await creditWallet(user.id, amount, {
    description,
    referenceType: WALLET_REFERENCE_TYPE.adminCredit,
    referenceId: uuid(),
  });

  return json({
    userId: user.id,
    username: user.username,
    amount: formatWalletAmount(transaction.amount),
    balanceAfter: formatWalletAmount(transaction.balanceAfter),
    currency: transaction.currency,
    description: transaction.description,
    createdAt: transaction.createdAt?.toISOString() ?? null,
  });
}
