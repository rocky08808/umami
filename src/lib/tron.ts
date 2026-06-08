import { USDT_TRC20_CONTRACT, USDT_TRC20_DECIMALS } from '@/lib/recharge';

export type TronTrc20Transfer = {
  transactionId: string;
  blockTimestamp: number;
  from: string;
  to: string;
  amount: number;
};

type TronTrc20ApiItem = {
  transaction_id?: string;
  block_timestamp?: number;
  from?: string;
  to?: string;
  value?: string;
};

function getTronApiHeaders() {
  const apiKey = process.env.TRON_API_KEY;

  return apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {};
}

function toUsdtAmount(value: string) {
  return Number(value) / 10 ** USDT_TRC20_DECIMALS;
}

export async function fetchIncomingUsdtTransfers(
  address: string,
  minTimestamp?: number,
): Promise<TronTrc20Transfer[]> {
  const baseUrl = process.env.TRON_API_URL || 'https://api.trongrid.io';
  const contract = process.env.USDT_TRC20_CONTRACT || USDT_TRC20_CONTRACT;
  const params = new URLSearchParams({
    only_to: 'true',
    limit: '100',
    contract_address: contract,
  });

  if (minTimestamp) {
    params.set('min_timestamp', String(minTimestamp));
  }

  const response = await fetch(
    `${baseUrl}/v1/accounts/${address}/transactions/trc20?${params.toString()}`,
    {
      headers: getTronApiHeaders(),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Tron API request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const items = (payload?.data || []) as TronTrc20ApiItem[];

  return items
    .filter(item => item.transaction_id && item.value && item.to)
    .map(item => ({
      transactionId: item.transaction_id!.toLowerCase(),
      blockTimestamp: Number(item.block_timestamp || 0),
      from: item.from || '',
      to: item.to || '',
      amount: toUsdtAmount(item.value!),
    }));
}
