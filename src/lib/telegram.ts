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
}) {
  const lines = [
    '有新的充值订单需要处理',
    `订单号: ${order.orderNo}`,
    order.username ? `用户: ${order.username}` : null,
    `方案: ${order.plan}`,
    `金额: ${order.amount} ${order.currency}`,
  ].filter(Boolean);

  return sendTelegramMessage(lines.join('\n'));
}
