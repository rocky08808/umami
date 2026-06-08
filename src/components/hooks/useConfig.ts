import { useEffect } from 'react';
import { useApi } from '@/components/hooks/useApi';
import type { CustomerServiceConfig } from '@/lib/customer-service';
import { setConfig, useApp } from '@/store/app';

export type Config = {
  cloudMode: boolean;
  faviconUrl?: string;
  linksUrl?: string;
  pixelsUrl?: string;
  privateMode: boolean;
  telemetryDisabled: boolean;
  trackerScriptName?: string;
  updatesDisabled: boolean;
  usdtWalletAddress?: string;
  usdtNetwork?: string;
  customerService?: CustomerServiceConfig | null;
  allowRegistration?: boolean;
};

export function useConfig(): Config {
  const { config } = useApp();
  const { get } = useApi();

  async function loadConfig() {
    const data = await get(`/config`);

    setConfig(data);
  }

  useEffect(() => {
    if (!config) {
      loadConfig();
    }
  }, []);

  return config;
}
