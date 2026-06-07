import { getOwnerMonthlyEventUsage } from '@/lib/billing-events';
import { getOwnerWebsiteUsage, isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return json({ events: null, websites: null });
  }

  const [events, websites] = await Promise.all([
    getOwnerMonthlyEventUsage(auth.user.id),
    getOwnerWebsiteUsage(auth.user.id),
  ]);

  return json({ events, websites });
}
