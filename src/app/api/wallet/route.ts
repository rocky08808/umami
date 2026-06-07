import { isSelfHostedBilling } from '@/lib/billing-limits';
import { parseRequest } from '@/lib/request';
import { json } from '@/lib/response';
import { getUserWalletSummary } from '@/lib/wallet';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!isSelfHostedBilling()) {
    return json({
      balance: 0,
      currency: 'USDT',
      transactions: [],
    });
  }

  const wallet = await getUserWalletSummary(auth.user.id);

  return json(wallet);
}
