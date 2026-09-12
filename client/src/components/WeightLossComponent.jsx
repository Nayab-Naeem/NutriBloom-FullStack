import { motion } from 'framer-motion';

export default function WeightLossComponent({ calorieGoal, macros }) {
  const items = [
    { label: 'Protein', value: `${macros.protein}g`, hint: 'Preserve muscle', accent: 'text-blue-500', bar: 'bg-blue-500' },
    { label: 'Carbs', value: `${macros.carbs}g`, hint: 'Steady energy', accent: 'text-purple-500', bar: 'bg-purple-500' },
    { label: 'Fat', value: `${macros.fat}g`, hint: 'Essential', accent: 'text-pink-500', bar: 'bg-pink-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="nb-card overflow-hidden"
    >
      <div className="relative border-b border-[var(--border-color)] bg-gradient-to-r from-red-500/12 via-pink-500/8 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-xl ring-1 ring-red-400/30">
            🔥
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-red-500 sm:text-lg">Weight Loss Mode</h3>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                Deficit
              </span>
            </div>
            <p className="mt-0.5 text-xs nb-muted sm:text-sm">
              Moderate deficit with high protein to protect lean mass.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-red-500/80">Daily calorie target</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-red-500 sm:text-4xl">{calorieGoal}</p>
            <p className="mt-0.5 text-xs nb-muted">kcal per day</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs nb-muted">Personalized for</p>
            <p className="text-sm font-semibold text-red-500">sustainable loss</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-medium uppercase tracking-wider nb-muted">Macro breakdown</p>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-overlay)] px-3 py-3.5 text-center"
            >
              <div className={`mx-auto mb-2 h-1 w-8 rounded-full ${item.bar} opacity-80`} />
              <p className={`text-lg font-bold tracking-tight sm:text-xl ${item.accent}`}>{item.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="mt-0.5 text-[10px] nb-muted">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
