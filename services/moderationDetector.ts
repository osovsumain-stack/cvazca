export interface ModerationWarning {
  field: 'title' | 'description' | 'requirements' | 'niceToHave';
  snippet: string;
  category: string;
  message: string;
}

const DISCRIMINATION_PATTERNS: { pattern: RegExp; category: string; message: string }[] = [
  { pattern: /\b(?:мужчин[а-я]*|мужской)\b/i, category: 'пол', message: 'Потенциальное ограничение по полу' },
  { pattern: /\b(?:женщин[а-я]*|женский|девушк[а-я]*)\b/i, category: 'пол', message: 'Потенциальное ограничение по полу' },
  { pattern: /\b(?:до\s*\d{2}\s*лет|моложе\s*\d|старше\s*\d|возраст[а-я]*\s*(?:до|не\s*старше|не\s*моложе))\b/i, category: 'возраст', message: 'Потенциальное ограничение по возрасту' },
  { pattern: /\b(?:русск[а-я]*|славян[а-я]*|азербайджан|армян|грузин|чечен|татар|еврей|украин[а-я]*)\b/i, category: 'национальность', message: 'Потенциальное ограничение по национальности' },
  { pattern: /\b(?:женат|замужем|холост|не\s*замужем|семейн[а-я]*|женат[а-я]*|есть\s*дети|без\s*детей|наличие\s*детей)\b/i, category: 'семейное положение', message: 'Потенциальное ограничение по семейному положению' },
  { pattern: /\b(?:христиан|мусульман|иудей|православн[а-я]*|католик|протестант|вер[а-я]*\s*в\s*бога)\b/i, category: 'религия', message: 'Потенциальное ограничение по религии' },
  { pattern: /\b(?:только\s*жители\s*Москвы|только\s*москвич|житель\s*Москвы|прописк[а-я]*\s*Москв|регистраци[а-я]*\s*Москв|местный\s*житель)\b/i, category: 'место жительства', message: 'Потенциальное ограничение по месту жительства' },
];

export function detectModerationWarnings(vacancy: {
  title: string;
  description: string;
  requirements: string[];
  niceToHave: string[];
}): ModerationWarning[] {
  const warnings: ModerationWarning[] = [];
  const fields: { field: ModerationWarning['field']; text: string }[] = [
    { field: 'title', text: vacancy.title },
    { field: 'description', text: vacancy.description },
    ...vacancy.requirements.map((r) => ({ field: 'requirements' as const, text: r })),
    ...vacancy.niceToHave.map((r) => ({ field: 'niceToHave' as const, text: r })),
  ];

  for (const { field, text } of fields) {
    if (!text) continue;
    for (const { pattern, category, message } of DISCRIMINATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        warnings.push({
          field,
          snippet: match[0],
          category,
          message: `Возможное дискриминационное условие (${category}). Требуется ручная проверка.`,
        });
      }
    }
  }

  return warnings;
}
