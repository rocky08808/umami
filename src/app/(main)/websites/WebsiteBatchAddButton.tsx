import { useToast } from '@umami/react-zen';
import { useMessages, useModified } from '@/components/hooks';
import { ListPlus } from '@/components/icons';
import { DialogButton } from '@/components/input/DialogButton';
import { WebsiteBatchAddForm } from './WebsiteBatchAddForm';

export function WebsiteBatchAddButton({ teamId, onSave }: { teamId?: string; onSave?: () => void }) {
  const { t, labels, messages } = useMessages();
  const { toast } = useToast();
  const { touch } = useModified();

  const handleSave = async () => {
    toast(t(messages.saved));
    touch('websites');
    onSave?.();
  };

  return (
    <DialogButton
      icon={<ListPlus />}
      label={t(labels.batchAddWebsite)}
      variant="outline"
      width="560px"
    >
      {({ close }) => (
        <WebsiteBatchAddForm teamId={teamId} onSave={handleSave} onClose={close} />
      )}
    </DialogButton>
  );
}
