import { processAutoRechargeOrders } from '@/lib/recharge-auto';
import { json, unauthorized } from '@/lib/response';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get('secret') || request.headers.get('x-cron-secret');

  if (!secret || provided !== secret) {
    return unauthorized();
  }

  const result = await processAutoRechargeOrders();

  return json(result);
}
