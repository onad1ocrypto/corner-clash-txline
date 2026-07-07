const FLAG_MAP: Record<string, string> = {
  "usa": "🇺🇸", "brazil": "🇧🇷", "argentina": "🇦🇷", "france": "🇫🇷",
  "spain": "🇪🇸", "portugal": "🇵🇹", "england": "🏴", "germany": "🇩🇪",
  "mexico": "🇲🇽", "belgium": "🇧🇪", "morocco": "🇲🇦", "egypt": "🇪🇬",
  "colombia": "🇨🇴", "switzerland": "🇨🇭", "norway": "🇳🇴", "vietnam": "🇻🇳",
  "myanmar": "🇲🇲", "australia": "🇦🇺", "bosnia": "🇧🇦", "ghana": "🇬🇭",
  "cape verde": "🇨🇻", "canada": "🇨🇦",
};

export function getFlag(teamName: string): string {
  const key = Object.keys(FLAG_MAP).find((k) => teamName.toLowerCase().includes(k));
  return key ? FLAG_MAP[key] : "⚽";
}
