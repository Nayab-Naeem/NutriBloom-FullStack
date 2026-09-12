import { motion } from 'framer-motion';

export default function WeightMaintainComponent({ calorieGoal, macros }) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl sm:text-4xl">⚖️</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-cyan-500 mb-1">Weight Maintain Mode</h3>
            <p className="text-sm nb-muted leading-relaxed">
              Focus on balanced nutrition while maintaining your current healthy weight.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="nb-card p-5 sm:p-6"
      >
        <h3 className="text-base font-semibold nb-section-title mb-4">Daily Nutrition Targets</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl bg-cyan-500/15 border border-cyan-400/25 p-4">
            <p className="text-xs text-cyan-600 mb-1">Calories</p>
            <p className="text-2xl font-bold text-cyan-600">{calorieGoal}</p>
            <p className="text-xs nb-muted mt-1">kcal/day</p>
          </div>
          <div className="rounded-xl bg-blue-500/15 border border-blue-400/25 p-4">
            <p className="text-xs text-blue-500/90 mb-1">Protein</p>
            <p className="text-2xl font-bold text-blue-500">{macros.protein}g</p>
            <p className="text-xs nb-muted mt-1">balanced</p>
          </div>
          <div className="rounded-xl bg-purple-500/15 border border-purple-400/25 p-4">
            <p className="text-xs text-purple-500/90 mb-1">Carbs</p>
            <p className="text-2xl font-bold text-purple-500">{macros.carbs}g</p>
            <p className="text-xs nb-muted mt-1">energy</p>
          </div>
          <div className="rounded-xl bg-pink-500/15 border border-pink-400/25 p-4">
            <p className="text-xs text-pink-500/90 mb-1">Fat</p>
            <p className="text-2xl font-bold text-pink-500">{macros.fat}g</p>
            <p className="text-xs nb-muted mt-1">essential</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
