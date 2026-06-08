const DEFAULT_POLL_INTERVAL_MS = 60_000;

let autoRechargePollerStarted = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (!process.env.USDT_WALLET_ADDRESS?.trim()) {
    return;
  }

  if (autoRechargePollerStarted) {
    return;
  }

  autoRechargePollerStarted = true;

  const intervalMs = Number(process.env.RECHARGE_AUTO_POLL_MS || DEFAULT_POLL_INTERVAL_MS);

  if (!Number.isFinite(intervalMs) || intervalMs < 15_000) {
    return;
  }

  const { processAutoRechargeOrders } = await import('@/lib/recharge-auto');

  const run = () => {
    void processAutoRechargeOrders().catch(() => {
      // Ignore background polling errors.
    });
  };

  run();
  setInterval(run, intervalMs);
}
