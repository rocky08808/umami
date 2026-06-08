import { IconLabel } from '@/components/common/IconLabel';
import { NavMenu } from '@/components/common/NavMenu';
import { useAdminNavItems } from '@/components/hooks/useAdminNavItems';
import { useMessages, useNavigation } from '@/components/hooks';
import { ArrowLeft } from '@/components/icons';
import { Column, Focusable, Row, Tooltip, TooltipTrigger } from '@umami/react-zen';
import Link from '@/components/common/Link';

export function AdminNav({ onItemClick }: { onItemClick?: () => void }) {
  const { t, labels } = useMessages();
  const { pathname, renderUrl } = useNavigation();
  const navItems = useAdminNavItems();

  const items =
    navItems.length > 0
      ? [
          {
            label: t(labels.manage),
            items: navItems,
          },
        ]
      : [];

  const selectedKey = navItems.find(({ path }) => pathname.startsWith(path))?.id;

  return (
    <Column gap="2">
      <Link href={renderUrl('/websites', false)} role="button" onClick={onItemClick}>
        <TooltipTrigger delay={0}>
          <Focusable>
            <Row
              alignItems="center"
              hover={{ backgroundColor: 'surface-sunken' }}
              borderRadius
              minHeight="40px"
            >
              <IconLabel icon={<ArrowLeft />} label={t(labels.back)} padding />
            </Row>
          </Focusable>
          <Tooltip placement="right">{t(labels.back)}</Tooltip>
        </TooltipTrigger>
      </Link>
      {items.length > 0 && (
        <NavMenu
          items={items}
          selectedKey={selectedKey}
          allowMinimize={false}
          onItemClick={onItemClick}
        />
      )}
    </Column>
  );
}
