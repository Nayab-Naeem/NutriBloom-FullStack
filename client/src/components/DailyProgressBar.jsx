import React from 'react';

export default function DailyProgressBar({
  foodLogs = [],
  goals
}) {
  // --------------------------------------------------
  // Calculate consumed nutrition
  // --------------------------------------------------

  const consumedCalories = foodLogs.reduce(
    (sum, item) => sum + (Number(item.calories) || 0),
    0
  );

  const consumedProtein = foodLogs.reduce(
    (sum, item) => sum + (Number(item.protein) || 0),
    0
  );

  const consumedCarbs = foodLogs.reduce(
    (sum, item) => sum + (Number(item.carbs) || 0),
    0
  );

  const consumedFat = foodLogs.reduce(
    (sum, item) => sum + (Number(item.fat) || 0),
    0
  );

  // --------------------------------------------------
  // Get actual targets
  // --------------------------------------------------

  const calorieGoal = Number(goals?.daily_calorie_goal) || 0;
  const proteinGoal = Number(goals?.daily_protein_goal) || 0;
  const carbsGoal = Number(goals?.daily_carbs_goal) || 0;
  const fatGoal = Number(goals?.daily_fat_goal) || 0;

  // --------------------------------------------------
  // Calculate percentages
  // --------------------------------------------------

  const getPercentage = (consumed, target) => {
    if (!target || target <= 0) return 0;

    return Math.min(
      100,
      Math.round((consumed / target) * 100)
    );
  };

  const calPercentage = getPercentage(
    consumedCalories,
    calorieGoal
  );

  const proteinPercentage = getPercentage(
    consumedProtein,
    proteinGoal
  );

  const carbsPercentage = getPercentage(
    consumedCarbs,
    carbsGoal
  );

  const fatPercentage = getPercentage(
    consumedFat,
    fatGoal
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">

      {/* Calories - Main Progress */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-800">
          🔥 Today's Calorie Progress
        </h3>

        <span className="text-xs font-bold text-emerald-600">
          {consumedCalories} / {calorieGoal} kcal ({calPercentage}%)
        </span>
      </div>

      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-500"
          style={{
            width: `${calPercentage}%`
          }}
        />
      </div>

      {/* Small Macro Progress */}
      <div className="grid grid-cols-3 gap-3 mt-4">

        {/* Protein */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-gray-500">
              Protein
            </span>

            <span className="text-[10px] font-bold text-gray-700">
              {consumedProtein}g / {proteinGoal}g
            </span>
          </div>

          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{
                width: `${proteinPercentage}%`
              }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-gray-500">
              Carbs
            </span>

            <span className="text-[10px] font-bold text-gray-700">
              {consumedCarbs}g / {carbsGoal}g
            </span>
          </div>

          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500 h-full transition-all duration-500"
              style={{
                width: `${carbsPercentage}%`
              }}
            />
          </div>
        </div>

        {/* Fat */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-gray-500">
              Fat
            </span>

            <span className="text-[10px] font-bold text-gray-700">
              {consumedFat}g / {fatGoal}g
            </span>
          </div>

          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{
                width: `${fatPercentage}%`
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
