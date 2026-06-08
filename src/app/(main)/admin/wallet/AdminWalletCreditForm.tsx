'use client';
import {
  Button,
  Column,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Text,
  TextField,
  useToast,
} from '@umami/react-zen';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { UserSelect } from '@/components/input/UserSelect';
import { useAdminUserWalletQuery, useUpdateQuery } from '@/components/hooks';
import {
  RECHARGE_MAX_AMOUNT,
  RECHARGE_MIN_AMOUNT,
  formatAmountDisplay,
  parseRechargeAmount,
  sanitizeRechargeAmountInput,
} from '@/lib/recharge';

function WalletBalanceDisplay({ userId }: { userId?: string }) {
  const t = useTranslations();
  const { data: wallet, isFetching } = useAdminUserWalletQuery(userId);

  if (!userId) {
    return null;
  }

  return (
    <Text color="muted">
      {isFetching
        ? t('admin.wallet-credit-loading-balance')
        : t('admin.wallet-credit-current-balance', {
            balance: formatAmountDisplay(wallet?.balance ?? 0),
            currency: wallet?.currency || 'USDT',
          })}
    </Text>
  );
}

export function AdminWalletCreditForm() {
  const t = useTranslations();
  const { toast } = useToast();
  const { mutateAsync, isPending, error, touch } = useUpdateQuery('/admin/wallet/credit');
  const [amountInput, setAmountInput] = useState('');

  const handleSubmit = async (data: { userId?: string; note?: string }) => {
    const amount = parseRechargeAmount(amountInput);

    if (!data.userId || amount == null) {
      return;
    }

    await mutateAsync(
      {
        userId: data.userId,
        amount,
        note: data.note,
      },
      {
        onSuccess: async result => {
          toast(
            t('admin.wallet-credit-success', {
              username: result.username,
              amount: result.amount,
              balance: result.balanceAfter,
            }),
          );
          setAmountInput('');
          touch('users');
        },
      },
    );
  };

  const handleQuickAmount = (amount: number) => {
    setAmountInput(String(amount));
  };

  return (
    <Form onSubmit={handleSubmit} error={error?.message}>
      {({ watch }) => {
        const selectedUserId = watch('userId') as string | undefined;
        const canSubmit = !!selectedUserId && parseRechargeAmount(amountInput) != null && !isPending;

        return (
          <Column gap="4" style={{ maxWidth: 520 }}>
            <FormField
              label={t('admin.wallet-credit-user')}
              name="userId"
              rules={{ required: t('label.required') }}
            >
              {({ field }) => <UserSelect value={field.value} onChange={field.onChange} />}
            </FormField>

            <WalletBalanceDisplay userId={selectedUserId} />

            <Column gap="2">
              <Text weight="bold">{t('admin.wallet-credit-amount')}</Text>
              <TextField
                value={amountInput}
                onChange={value => setAmountInput(sanitizeRechargeAmountInput(value))}
                placeholder={t('admin.wallet-credit-amount-placeholder')}
              />
              <Text color="muted" size="sm">
                {t('admin.wallet-credit-amount-range', {
                  min: RECHARGE_MIN_AMOUNT,
                  max: RECHARGE_MAX_AMOUNT,
                })}
              </Text>
              <Column gap="2">
                <Text color="muted" size="sm">
                  {t('recharge.quick-amounts')}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[20, 200, 500, 1000].map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      onPress={() => handleQuickAmount(amount)}
                    >
                      {amount} USDT
                    </Button>
                  ))}
                </div>
              </Column>
            </Column>

            <FormField label={t('admin.wallet-credit-note')} name="note">
              <TextField placeholder={t('admin.wallet-credit-note-placeholder')} />
            </FormField>

            <FormButtons>
              <FormSubmitButton variant="primary" isDisabled={!canSubmit}>
                {t('admin.wallet-credit-submit')}
              </FormSubmitButton>
            </FormButtons>
          </Column>
        );
      }}
    </Form>
  );
}
