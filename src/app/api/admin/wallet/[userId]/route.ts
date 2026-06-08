import { z } from 'zod';
import { isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json, notFound, unauthorized } from '@/lib/response';
import { getUserWalletSummary } from '@/lib/wallet';
import { canViewUsers } from '@/permissions';
import { getUser } from '@/queries/prisma/user';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const schema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  if (!isSelfHostedBilling()) {
    return unauthorized();
  }

  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    return notFound();
  }

  const wallet = await getUserWalletSummary(userId, query.limit ?? 50);

  return json({
    userId: user.id,
    username: user.username,
    ...wallet,
  });
}
