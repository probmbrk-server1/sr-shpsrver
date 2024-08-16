

const itemPrefixes = ["A", "B", "A", "B", "A", "B", "I", "P"];

const maxrotationcounter = 6;


const userFriendlyDateConfig = [
  "12-24 A024 B021 A013 B010 A017 B014", // Christmas
  // "12-25 A024 B021 A013 B010 A017 B014", // Christmas
  "5-26 I014 B027 A037 B028 P009 B005", // Halloween
  "7-19 I007 I005 I003 I002 I008 I009 I001 I004", // Partytime
  "1-1 A027 I001 I003 I005 P005 P006",
  "8-19 I007 I004 I003 I002 I001 I005",
  "2-26 A036 B027 A035 B026 P003 P008 I007 I005",
  "4-17 A036 B027 A035 B026 P003 P008 I007 I005",
];

const userFriendlyDateTheme = [
  "5-15 christmas", // Christmas
  "7-19 partytime",
  "5-28 partytime",
];

const specialDateConfig = userFriendlyDateConfig.reduce((acc, entry) => {
  const [date, ...items] = entry.split(' ');
  acc[date] = items;
  return acc;
}, {});

const specialDateTheme = userFriendlyDateTheme.reduce((acc, entry) => {
  const [date, theme] = entry.split(' ');
  acc[date] = [theme];
  return acc;
}, {});

module.exports = {
  itemPrefixes,
  specialDateConfig,
  specialDateTheme,
  maxrotationcounter,
};