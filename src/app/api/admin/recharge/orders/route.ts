import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { pagingParams, searchParams } from '@/lib/schema';
import { canViewUsers } from '@/permissions';
import { getRechargeOrders } from '@/queries/prisma/recharge';

export async function GET(request: Request) {
  const schema = z.object({
    ...pagingParams,
    ...searchParams,
    status: z.string().optional(),
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canViewUsers(auth))) {
    return unauthorized();
  }

  const orders = await getRechargeOrders(query);

  return json(orders);
}
