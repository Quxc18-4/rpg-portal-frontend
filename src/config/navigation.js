export const PRIMARY_NAV_ITEMS = [
  {
    key: 'market',
    path: '/market',
    minRole: 'GUEST',
    label: { vi: 'CHỢ ĐẤU GIÁ', en: 'AUCTION MARKET' },
  },
  {
    key: 'guilds',
    path: '/guilds',
    minRole: 'GUEST',
    label: { vi: 'BANG HỘI', en: 'GUILDS' },
  },
  {
    key: 'player',
    path: '/dashboard',
    minRole: 'USER',
    label: { vi: 'NHÂN VẬT', en: 'CHARACTER' },
  },
  {
    key: 'trades',
    path: '/trades',
    minRole: 'USER',
    label: { vi: 'GIAO DỊCH', en: 'TRADES' },
  },
  {
    key: 'operator',
    path: '/operator',
    minRole: 'MODERATOR',
    label: { vi: 'QUẢN TRỊ', en: 'OPERATOR' },
  },
];