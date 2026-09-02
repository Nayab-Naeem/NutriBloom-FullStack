import { motion } from 'framer-motion';

/**
 * WeightMaintainComponent - Component for users with a weight maintain goal
 * Shows balanced nutrition recommendations for maintaining current weight
 * All values are AI-generated and passed from Dashboard
 */
export default function WeightMaintainComponent({ calorieGoal, macros }) {

  return (
    <div className="space-y-6">
      {/* Goal Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">⚖️</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-cyan-400 mb-1">Weight Maintain Mode</h3>
            <p className="text-sm">Focus on balanced nutrition while maintaining your current healthy weight.</p>
          </div>
        </div>
      </motion.div>

      {/* Nutrition Macros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Daily Nutrition Targets</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-cyan-500/20 rounded-lg p-4 border border-cyan-400/30">
            <p className="text-xs text-cyan-300 mb-1">Calories</p>
            <p className="text-2xl font-bold text-cyan-400">{calorieGoal}</p>
            <p className="text-xs text-cyan-200 mt-1">kcal/day</p>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
            <p className="text-xs text-blue-300 mb-1">Protein</p>
            <p className="text-2xl font-bold text-blue-400">{macros.protein}g</p>
            <p className="text-xs text-blue-200 mt-1">balanced</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-400/30">
            <p className="text-xs text-purple-300 mb-1">Carbs</p>
            <p className="text-2xl font-bold text-purple-400">{macros.carbs}g</p>
            <p className="text-xs text-purple-200 mt-1">energy</p>
          </div>
          <div className="bg-pink-500/20 rounded-lg p-4 border border-pink-400/30">
            <p className="text-xs text-pink-300 mb-1">Fat</p>
            <p className="text-2xl font-bold text-pink-400">{macros.fat}g</p>
            <p className="text-xs text-pink-200 mt-1">essential</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
