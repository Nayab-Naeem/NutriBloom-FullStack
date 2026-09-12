export default function DashboardFoodCard({ foodItem, onDelete }) {
  const { id, food_name, calories, protein, carbs, fat } = foodItem;

  return (
    <article className="nb-card p-5 hover:shadow-[var(--shadow-soft)] transition-shadow duration-200">
      <div className="flex justify-between items-start gap-3 mb-4">
        <h3 className="text-base font-semibold nb-section-title capitalize leading-snug">
          {food_name}
        </h3>
        <div className="shrink-0 bg-[var(--bg-overlay)] text-strong-cyan font-bold px-3 py-1 rounded-full text-xs">
          +{calories} kcal
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--bg-overlay)] p-3 text-center">
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold nb-muted">Protein</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{protein ?? 0}g</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold nb-muted">Carbs</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{carbs ?? 0}g</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-semibold nb-muted">Fats</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{fat ?? 0}g</span>
        </div>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(id)}
          type="button"
          className="mt-3 text-xs text-red-500/80 hover:text-red-600 font-medium"
        >
          Remove
        </button>
      )}
    </article>
  );
}
