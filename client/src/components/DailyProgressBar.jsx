import React from 'react';

export default function DailyProgressBar({ foodLogs = [], goals = { daily_calorie_goal: 2000, daily_protein_goal: 150, daily_carbs_goal: 200, daily_fat_goal: 65 } }) {
  // Calculate consumed totals for today
  const consumedCalories = foodLogs.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
  const consumedProtein = foodLogs.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
  const consumedCarbs = foodLogs.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
  const consumedFat = foodLogs.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  const calPercentage = Math.min(100, Math.round((consumedCalories / goals.daily_calorie_goal) * 100));

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-800">🔥 Today's Calorie Progress</h3>
        <span className="text-xs font-bold text-emerald-600">
          {consumedCalories} / {goals.daily_calorie_goal} kcal ({calPercentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-500"
          style={{ width: `${calPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}