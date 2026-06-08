import { processAutoRechargeOrders } from '@/lib/recharge-auto';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';

export async function POST(request: Request) {
  const { error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const result = await processAutoRechargeOrders();

  return json(result);
}
