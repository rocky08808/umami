import { getOwnerMonthlyEventUsage } from '@/lib/billing-events';
import { getOwnerWebsiteUsage, isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';
import { getUserSubscriptionDetails } from '@/lib/subscription';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return json({ subscription: null, events: null, websites: null });
  }

  const [subscription, events, websites] = await Promise.all([
    getUserSubscriptionDetails(auth.user.id),
    getOwnerMonthlyEventUsage(auth.user.id),
    getOwnerWebsiteUsage(auth.user.id),
  ]);

  return json({ subscription, events, websites });
}
