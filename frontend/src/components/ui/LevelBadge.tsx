type Level = 'norm' | 'elevated' | 'burnout_risk' | 'critical' | string

const CONFIG: Record<string, { bg: string; text: string; label: Record<string, string>; dot: string }> = {
  norm: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: { ru: 'Норма', en: 'Normal', kz: 'Қалыпты' }, dot: 'bg-green-500' },
  elevated: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: { ru: 'Повышенный стресс', en: 'Elevated Stress', kz: 'Жоғары стресс' }, dot: 'bg-yellow-500' },
  burnout_risk: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: { ru: 'Риск выгорания', en: 'Burnout Risk', kz: 'Күйіп-жану қаупі' }, dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: { ru: 'Критическое', en: 'Critical', kz: 'Сын жағдай' }, dot: 'bg-red-500' },
}

export default function LevelBadge({ level, lang = 'ru', size = 'sm' }: { level: Level; lang?: string; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = CONFIG[level] || CONFIG.norm
  const label = cfg.label[lang] || cfg.label.ru
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-2 font-medium' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${cfg.bg} ${cfg.text} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  )
}
