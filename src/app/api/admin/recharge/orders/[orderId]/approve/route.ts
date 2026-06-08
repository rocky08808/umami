import { z } from 'zod';
import { RECHARGE_ORDER_STATUS } from '@/lib/recharge';
import { approveRechargeOrder } from '@/lib/recharge-approve';
import { parseRequest } from '@/lib/request';
import { badRequest, json, notFound, unauthorized } from '@/lib/response';
import { getRechargeOrder } from '@/queries/prisma/recharge';
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

  const updated = await approveRechargeOrder(orderId, {
    adminNote: body.adminNote,
    reviewedBy: auth.user.id,
  });

  return json(updated);
}
