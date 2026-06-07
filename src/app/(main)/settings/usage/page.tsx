import type { Metadata } from 'next';
import { UsagePage } from './UsagePage';

export default function () {
  return <UsagePage />;
}

export const metadata: Metadata = {
  title: 'Usage',
};
