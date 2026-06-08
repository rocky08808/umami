import type { Metadata } from 'next';
import { AdminWalletPage } from './AdminWalletPage';

export default function () {
  return <AdminWalletPage />;
}

export const metadata: Metadata = {
  title: 'Wallet Credit',
};
