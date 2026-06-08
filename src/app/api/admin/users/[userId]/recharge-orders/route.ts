import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, notFound, unauthorized } from '@/lib/response';
import { pagingParams } from '@/lib/schema';
import { canViewUsers } from '@/permissions';
import { getRechargeOrders } from '@/queries/prisma/recharge';
import { getUser } from '@/queries/prisma/user';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const schema = z.object({
    ...pagingParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    return notFound();
  }

  const orders = await getRechargeOrders({
    userId,
    page: query.page,
    pageSize: query.pageSize,
  });

  return json(orders);
}
