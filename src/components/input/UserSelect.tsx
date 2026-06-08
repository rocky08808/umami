import { ListItem, Select, type SelectProps } from '@umami/react-zen';
import { useState } from 'react';
import { Empty } from '@/components/common/Empty';
import {
  useMessages,
  useTeamAvailableUsersQuery,
  useUsersQuery,
} from '@/components/hooks';

export function UserSelect({
  teamId,
  onChange,
  ...props
}: {
  teamId?: string;
} & SelectProps) {
  const { t, messages } = useMessages();
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

  const handleOpenChange = () => {
    setSearch('');
  };

  const handleChange = (id: string) => {
    setUsername(listItems.find(item => item.id === id)?.username);
    onChange(id);
  };

  return (
    <Select
      {...props}
      value={username}
      isLoading={isLoading}
      allowSearch={true}
      searchValue={search}
      onSearch={setSearch}
      onChange={handleChange}
      onOpenChange={handleOpenChange}
      listProps={{
        renderEmptyState: () => <Empty message={t(messages.noResultsFound)} />,
        style: { maxHeight: 'calc(42vh - 65px)' },
      }}
    >
      {listItems.map(({ id, username }) => (
        <ListItem key={id} id={id}>
          {username}
        </ListItem>
      ))}
    </Select>
  );
}
