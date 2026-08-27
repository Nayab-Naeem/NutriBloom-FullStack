export default function DashboardFoodCard({ foodItem, onDelete }) {
  const { id, food_name, calories, protein, carbs, fat } = foodItem;

  return (
    <article className="bg-[var(--bg-secondary)] rounded-2xl border border-white/10 p-5 shadow-lg shadow-black/10 hover:brightness-110 transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white/90 capitalize">
          {food_name}
        </h3>
        <div className="bg-[var(--bg-primary)] text-strong-cyan font-extrabold px-3 py-1 rounded-full text-sm">
          +{calories} kcal
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[var(--bg-primary)] p-3 rounded-xl text-center">
        <div>
          <span className="block text-xs text-white/45 uppercase tracking-wider font-semibold">Protein</span>
          <span className="text-sm font-bold text-white/85">{protein ?? 0}g</span>
        </div>
        <div>
          <span className="block text-xs text-white/45 uppercase tracking-wider font-semibold">Carbs</span>
          <span className="text-sm font-bold text-white/85">{carbs ?? 0}g</span>
        </div>
        <div>
          <span className="block text-xs text-white/45 uppercase tracking-wider font-semibold">Fats</span>
          <span className="text-sm font-bold text-white/85">{fat ?? 0}g</span>
        </div>
      </div>

      {onDelete && (
        <button 
          onClick={() => onDelete(id)} 
          type="button"
          className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium transition"
        >
          Remove
        </button>
      )}
    </article>
  );
}