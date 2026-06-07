import { Button, ListItem, Row, Select } from '@umami/react-zen';
import { useState } from 'react';
import { useLocale, useMessages } from '@/components/hooks';
import { DEFAULT_LOCALE, LOCALE_CONFIG } from '@/lib/constants';
import { getBrowserLocale, languages } from '@/lib/lang';
import { removeItem } from '@/lib/storage';

export function LanguageSetting() {
  const [search, setSearch] = useState('');
  const { t, labels } = useMessages();
  const { locale, saveLocale } = useLocale();
  const items = search
    ? Object.keys(languages).filter(n => {
        return (
          n.toLowerCase().includes(search.toLowerCase()) ||
          languages[n].label.toLowerCase().includes(search.toLowerCase())
        );
      })
    : Object.keys(languages);

  const handleReset = () => {
    removeItem(LOCALE_CONFIG);
    saveLocale(process.env.defaultLocale || getBrowserLocale(DEFAULT_LOCALE));
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSearch('');
    }
  };

  return (
    <Row gap>
      <Select
        value={locale}
        onChange={val => saveLocale(val as string)}
        allowSearch
        onSearch={setSearch}
        onOpenChange={handleOpen}
        listProps={{ style: { maxHeight: 300 } }}
        style={{ minWidth: '250px' }}
      >
        {items.map(item => (
          <ListItem key={item} id={item}>
            {languages[item].label}
          </ListItem>
        ))}
        {!items.length && <ListItem></ListItem>}
      </Select>
      <Button onPress={handleReset}>{t(labels.reset)}</Button>
    </Row>
  );
}
