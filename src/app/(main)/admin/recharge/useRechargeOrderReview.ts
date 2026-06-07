import { useToast } from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useApi, useModified } from '@/components/hooks';

export function useRechargeOrderReview() {
  const t = useTranslations();
  const { post } = useApi();
  const { toast } = useToast();
  const { touch } = useModified('admin-recharge-orders');
  const [note, setNote] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function reviewOrder(orderId: string, action: 'approve' | 'reject') {
    setLoadingId(orderId);

    try {
      await post(`/admin/recharge/orders/${orderId}/${action}`, {
        adminNote: note[orderId],
      });
      toast(t(action === 'approve' ? 'recharge.order-approved' : 'recharge.order-rejected'));
      touch('admin-recharge-orders');
      if (action === 'approve') {
        touch('wallet');
      }
      setNote(current => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (e: any) {
      toast((e.code && t(`recharge.${e.code}`)) || e.message || t('recharge.order-error'));
    } finally {
      setLoadingId(null);
    }
  }

  return {
    note,
    setNote,
    loadingId,
    reviewOrder,
  };
}
