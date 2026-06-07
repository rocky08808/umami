import type { Metadata } from 'next';
import { RechargePage } from './RechargePage';

export default function () {
  return <RechargePage />;
}

export const metadata: Metadata = {
  title: 'Recharge',
};
