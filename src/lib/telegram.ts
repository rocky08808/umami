export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function notifyRechargeOrderSubmitted(order: {
  orderNo: string;
  plan: string;
  amount: number;
  currency: string;
  username?: string;
  auto?: boolean;
}) {
  const lines = [
    order.auto ? '有新的自动充值订单' : '有新的充值订单需要处理',
    `订单号: ${order.orderNo}`,
    order.username ? `用户: ${order.username}` : null,
    `方案: ${order.plan}`,
    order.auto ? `请转账: ${order.amount} ${order.currency}` : `金额: ${order.amount} ${order.currency}`,
    order.auto ? '系统将自动匹配链上到账' : null,
  ].filter(Boolean);

  return sendTelegramMessage(lines.join('\n'));
}

export async function notifyRechargeOrderApproved(order: {
  orderNo: string;
  amount: number;
  currency: string;
  username?: string;
  txId?: string;
  auto?: boolean;
}) {
  const lines = [
    order.auto ? '自动充值已到账' : '充值订单已通过',
    `订单号: ${order.orderNo}`,
    order.username ? `用户: ${order.username}` : null,
    `到账: ${order.amount} ${order.currency}`,
    order.txId ? `交易: ${order.txId}` : null,
  ].filter(Boolean);

  return sendTelegramMessage(lines.join('\n'));
}
