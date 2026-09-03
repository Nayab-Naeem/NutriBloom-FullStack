import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

import {
  calculateBMI,
  getBMICategory,
  determineGoal,
  calculateBMR,
  calculateTDEE
} from '../utils/nutritionCalculations';

const OnboardingModal = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'female',
    heightCm: '',
    weightKg: '',
    activityLevel: 'moderate'
  });

  // Step 1 = Form
  // Step 2 = Result
  const [step, setStep] = useState(1);

  const [calculatedResult, setCalculatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setError('');
  };

  const handleCalculateAndSave = async (e) => {
    e.preventDefault();

    setError('');

    // Basic validation
    if (
      !formData.age ||
      !formData.heightCm ||
      !formData.weightKg ||
      !formData.gender ||
      !formData.activityLevel
    ) {
      setError('Please fill in all fields.');
      return;
    }

    const age = Number(formData.age);
    const heightCm = Number(formData.heightCm);
    const weightKg = Number(formData.weightKg);

    // More useful validation
    if (age < 13 || age > 100) {
      setError('Please enter a valid age between 13 and 100.');
      return;
    }

    if (heightCm < 100 || heightCm > 250) {
      setError('Please enter a valid height between 100 and 250 cm.');
      return;
    }

    if (weightKg < 25 || weightKg > 300) {
      setError('Please enter a valid weight between 25 and 300 kg.');
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // 1. Calculate BMI
      // --------------------------------------------------
      const bmi = calculateBMI(weightKg, heightCm);

      if (!bmi) {
        throw new Error('Unable to calculate BMI.');
      }

      // --------------------------------------------------
      // 2. BMI Category
      // --------------------------------------------------
      const bmiCategory = getBMICategory(bmi);

      // --------------------------------------------------
      // 3. Determine Goal
      // gain / lose / maintain
      // --------------------------------------------------
      const goal = determineGoal(bmi);

      // --------------------------------------------------
      // 4. Calculate BMR
      // Mifflin-St Jeor
      // --------------------------------------------------
      const bmr = calculateBMR({
        age,
        gender: formData.gender,
        heightCm,
        weightKg
      });

      // --------------------------------------------------
      // 5. Calculate TDEE
      // --------------------------------------------------
      const tdee = calculateTDEE(
        bmr,
        formData.activityLevel
      );

      // --------------------------------------------------
      // 6. Ask Gemini for nutrition targets
      // --------------------------------------------------
      const response = await fetch('/api/nutrition-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          age,
          gender: formData.gender,
          height_cm: heightCm,
          weight_kg: weightKg,
          goal,
          bmr,
          tdee
        })
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          'Could not read the AI server response.'
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
          'Failed to generate nutrition targets.'
        );
      }

      if (!result?.data) {
        throw new Error(
          'AI did not return nutrition targets.'
        );
      }

      const targets = result.data;

      // --------------------------------------------------
      // 7. Validate Gemini response
      // --------------------------------------------------
      if (
        !targets.calorieGoal ||
        !targets.protein ||
        !targets.carbs ||
        !targets.fat
      ) {
        throw new Error(
          'AI returned incomplete nutrition targets.'
        );
      }

      // --------------------------------------------------
      // 8. Save everything to Supabase
      // --------------------------------------------------
      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,

          age,
          gender: formData.gender,

          height_cm: heightCm,
          weight_kg: weightKg,

          bmi,
          goal,

          activity_level: formData.activityLevel,

          bmr,
          tdee,

          calorie_goal: Number(targets.calorieGoal),
          protein_goal: Number(targets.protein),
          carbs_goal: Number(targets.carbs),
          fat_goal: Number(targets.fat),

          is_profile_complete: true,

          updated_at: new Date().toISOString()
        });

      if (saveError) {
        throw new Error(
          `Error saving profile: ${saveError.message}`
        );
      }

      // --------------------------------------------------
      // 9. Store everything for Result Modal
      // --------------------------------------------------
      setCalculatedResult({
        bmi,
        bmiCategory,
        goal,

        bmr,
        tdee,

        calorieGoal: Number(targets.calorieGoal),
        protein: Number(targets.protein),
        carbs: Number(targets.carbs),
        fat: Number(targets.fat)
      });

      // --------------------------------------------------
      // 10. Show Result Modal
      // --------------------------------------------------
      setStep(2);

    } catch (err) {
      console.error('Onboarding error:', err);

      setError(
        err.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Goal information
  // --------------------------------------------------
  const goalMessages = {
    gain: {
      text: '💪 Weight Gain',
      color: '#f26419',
      desc: 'Focus on a healthy calorie surplus and muscle building.'
    },

    lose: {
      text: '🔥 Weight Loss',
      color: '#ef4444',
      desc: 'Focus on a moderate calorie deficit and healthy nutrition.'
    },

    maintain: {
      text: '⚖️ Weight Maintain',
      color: '#0891b2',
      desc: 'Focus on balanced nutrition and maintaining a healthy lifestyle.'
    }
  };

  const goalMessage =
    goalMessages[calculatedResult?.goal] ||
    goalMessages.maintain;

  // --------------------------------------------------
  // Edit Information
  // --------------------------------------------------
  const handleEdit = () => {
    setStep(1);
    setError('');

    // Keep the existing values in the form.
    // User can modify them and recalculate.
  };

  // --------------------------------------------------
  // Close / complete onboarding
  // --------------------------------------------------
  const handleStartJourney = () => {
    if (!calculatedResult) return;

    onComplete(calculatedResult.goal);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 to-white backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20"
      >

        {/* ==================================================
            STEP 1 — USER INFORMATION
        ================================================== */}
        {step === 1 && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to NutriBloom! 🌸
            </h2>

            <p className="text-gray-600 mb-8">
              Tell us about yourself so we can personalize your nutrition plan.
            </p>

            <form
              onSubmit={handleCalculateAndSave}
              className="space-y-5"
            >

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* AGE */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  required
                  min="13"
                  max="100"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 22"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* GENDER */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Gender
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="female">
                    Female
                  </option>

                  <option value="male">
                    Male
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* HEIGHT */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Height (cm)
                </label>

                <input
                  type="number"
                  name="heightCm"
                  required
                  min="100"
                  max="250"
                  value={formData.heightCm}
                  onChange={handleChange}
                  placeholder="e.g. 165"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* WEIGHT */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Weight (kg)
                </label>

                <input
                  type="number"
                  name="weightKg"
                  required
                  min="25"
                  max="300"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={handleChange}
                  placeholder="e.g. 60"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* ACTIVITY LEVEL */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Activity Level
                </label>

                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >

                  <option value="sedentary">
                    Sedentary — little or no exercise
                  </option>

                  <option value="light">
                    Light — exercise 1–3 days/week
                  </option>

                  <option value="moderate">
                    Moderate — exercise 3–5 days/week
                  </option>

                  <option value="very">
                    Very Active — exercise 6–7 days/week
                  </option>

                  <option value="extra">
                    Extra Active — intense exercise/physical job
                  </option>

                </select>

                <p className="text-xs text-gray-500 mt-2">
                  This helps us estimate your daily energy needs.
                </p>
              </div>

              {/* CALCULATE BUTTON */}
              <motion.button
                whileHover={{
                  scale: loading ? 1 : 1.02
                }}
                whileTap={{
                  scale: loading ? 1 : 0.98
                }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-70"
              >
                {loading
                  ? 'Creating Your Plan...'
                  : 'Calculate My Plan'}
              </motion.button>

            </form>

          </motion.div>
        )}

        {/* ==================================================
            STEP 2 — RESULT
        ================================================== */}
        {step === 2 && calculatedResult && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >

            <div className="text-center">

              {/* HEADER */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Health Summary 🌸
              </h2>

              {/* BMI */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 mb-4 border border-cyan-200">

                <p className="text-gray-600 text-sm mb-2">
                  Your BMI
                </p>

                <p className="text-5xl font-bold text-cyan-600">
                  {calculatedResult.bmi}
                </p>

                <p className="text-gray-600 text-sm mt-2">
                  {calculatedResult.bmiCategory}
                </p>

              </div>

              {/* BMR + TDEE */}
              <div className="grid grid-cols-2 gap-3 mb-4">

                <div className="bg-gray-100 rounded-xl p-4">

                  <p className="text-gray-500 text-xs mb-1">
                    BMR
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {calculatedResult.bmr}
                  </p>

                  <p className="text-gray-500 text-xs">
                    kcal/day
                  </p>

                </div>

                <div className="bg-gray-100 rounded-xl p-4">

                  <p className="text-gray-500 text-xs mb-1">
                    TDEE
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    {calculatedResult.tdee}
                  </p>

                  <p className="text-gray-500 text-xs">
                    kcal/day
                  </p>

                </div>

              </div>

              {/* GOAL */}
              <div
                className="rounded-2xl p-5 mb-4 text-white"
                style={{
                  background: `linear-gradient(
                    135deg,
                    ${goalMessage.color} 0%,
                    ${goalMessage.color}dd 100%
                  )`
                }}
              >

                <p className="text-sm opacity-90 mb-2">
                  Your personalized goal
                </p>

                <p className="text-3xl font-bold mb-2">
                  {goalMessage.text}
                </p>

                <p className="text-sm opacity-90">
                  {goalMessage.desc}
                </p>

              </div>

              {/* DAILY TARGETS */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 mb-5 border border-cyan-200">

                <p className="text-gray-700 font-semibold text-sm mb-4">
                  Your Daily Nutrition Targets
                </p>

                <div className="grid grid-cols-2 gap-3">

                  {/* CALORIES */}
                  <div className="bg-white rounded-xl p-4">

                    <p className="text-gray-500 text-xs">
                      Calories
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {calculatedResult.calorieGoal}
                    </p>

                    <p className="text-gray-500 text-xs">
                      kcal/day
                    </p>

                  </div>

                  {/* PROTEIN */}
                  <div className="bg-white rounded-xl p-4">

                    <p className="text-gray-500 text-xs">
                      Protein
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {calculatedResult.protein}g
                    </p>

                    <p className="text-gray-500 text-xs">
                      per day
                    </p>

                  </div>

                  {/* CARBS */}
                  <div className="bg-white rounded-xl p-4">

                    <p className="text-gray-500 text-xs">
                      Carbs
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {calculatedResult.carbs}g
                    </p>

                    <p className="text-gray-500 text-xs">
                      per day
                    </p>

                  </div>

                  {/* FAT */}
                  <div className="bg-white rounded-xl p-4">

                    <p className="text-gray-500 text-xs">
                      Fat
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {calculatedResult.fat}g
                    </p>

                    <p className="text-gray-500 text-xs">
                      per day
                    </p>

                  </div>

                </div>

              </div>

              <p className="text-gray-600 text-sm mb-6">
                Your dashboard will now show personalized nutrition
                recommendations, meal suggestions, and progress
                tracking based on your health goal.
              </p>

              {/* BUTTONS */}
              <div className="space-y-3">

                {/* START JOURNEY */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartJourney}
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition"
                >
                  Start My Journey 🌱
                </motion.button>

                {/* EDIT */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleEdit}
                  className="w-full py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  ✏️ Edit Information
                </motion.button>

              </div>

            </div>

          </motion.div>
        )}

      </motion.div>

    </div>
  );
};

export default OnboardingModal;