import { ListItem, Select, type SelectProps, Text } from '@umami/react-zen';
import { useEffect, useState } from 'react';
import { Empty } from '@/components/common/Empty';
import {
  useMessages,
  useTeamAvailableUsersQuery,
  useUsersQuery,
} from '@/components/hooks';

export function UserSelect({
  teamId,
  userId,
  onChange,
  value,
  ...props
}: {
  teamId?: string;
  userId?: string;
} & SelectProps) {
  const { t, messages, labels } = useMessages();
  const selectedId = userId ?? (typeof value === 'string' ? value : undefined);
  const [username, setUsername] = useState<string>();
  const [search, setSearch] = useState('');

  const { data: adminUsers, isLoading: adminUsersLoading } = useUsersQuery({
    enabled: !teamId,
  });
  const { data: teamUsers, isLoading: teamUsersLoading } = useTeamAvailableUsersQuery(
    teamId,
    { search, pageSize: 20 },
    { enabled: !!teamId },
  );

  const listItems = (teamId ? teamUsers : adminUsers)?.data || [];
  const isLoading = teamId ? teamUsersLoading : adminUsersLoading;

  useEffect(() => {
    if (!selectedId) {
      setUsername(undefined);
      return;
    }

    const found = listItems.find(item => item.id === selectedId);

    if (found?.username) {
      setUsername(found.username);
    }
  }, [selectedId, listItems]);

  const handleOpenChange = () => {
    setSearch('');
  };

  const handleChange = (id: string) => {
    setUsername(listItems.find(item => item.id === id)?.username);
    onChange?.(id);
  };

  const renderValue = () => {
    const display = username || props.placeholder || t(labels.username);

    return (
      <Text truncate color={username ? undefined : 'muted'}>
        {display}
      </Text>
    );
  };

  return (
    <Select
      {...props}
      value={selectedId}
      isLoading={isLoading}
      allowSearch={true}
      searchValue={search}
      onSearch={setSearch}
      onChange={handleChange}
      onOpenChange={handleOpenChange}
      renderValue={renderValue}
      listProps={{
        renderEmptyState: () => <Empty message={t(messages.noResultsFound)} />,
        style: { maxHeight: 'calc(42vh - 65px)' },
      }}
    >
      {listItems.map(({ id, username: itemUsername }) => (
        <ListItem key={id} id={id}>
          {itemUsername}
        </ListItem>
      ))}
    </Select>
  );
}
