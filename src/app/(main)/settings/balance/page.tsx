import type { Metadata } from 'next';
import { BalancePage } from './BalancePage';

export default function () {
  return <BalancePage />;
}

export const metadata: Metadata = {
  title: 'Balance',
};
