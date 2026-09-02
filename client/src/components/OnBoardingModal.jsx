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

  // Step 1 = Input Form
  // Step 2 = Result Summary
  const [step, setStep] = useState(1);

  const [calculatedResult, setCalculatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    setError('');
  };

  const handleCalculateAndSave = async (e) => {
    e.preventDefault();

    // -----------------------------
    // Validation
    // -----------------------------
    if (
      !formData.age ||
      !formData.heightCm ||
      !formData.weightKg
    ) {
      setError('Please fill in all fields');
      return;
    }

    if (
      Number(formData.age) <= 0 ||
      Number(formData.heightCm) <= 0 ||
      Number(formData.weightKg) <= 0
    ) {
      setError('Please enter valid values');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const age = Number(formData.age);
      const heightCm = Number(formData.heightCm);
      const weightKg = Number(formData.weightKg);

      // -----------------------------
      // 1. Calculate BMI
      // -----------------------------
      const bmi = calculateBMI(
        weightKg,
        heightCm
      );

      // -----------------------------
      // 2. Get BMI Category
      // -----------------------------
      const bmiCategory = getBMICategory(bmi);

      // -----------------------------
      // 3. Determine Goal
      // -----------------------------
      const goal = determineGoal(bmi);

      // -----------------------------
      // 4. Calculate BMR
      // -----------------------------
      const bmr = calculateBMR({
        age,
        gender: formData.gender,
        heightCm,
        weightKg
      });

      // -----------------------------
      // 5. Calculate TDEE
      // -----------------------------
      const tdee = calculateTDEE(
        bmr,
        formData.activityLevel
      );

      console.log('Nutrition calculations:', {
        bmi,
        bmiCategory,
        goal,
        bmr,
        tdee
      });

      // -----------------------------
      // 6. Save profile to Supabase
      // -----------------------------
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

          is_profile_complete: true,

          updated_at: new Date()
        });

      if (saveError) {
        throw saveError;
      }

      // -----------------------------
      // 7. Store result
      // -----------------------------
      setCalculatedResult({
        bmi,
        bmiCategory,
        goal,
        bmr,
        tdee
      });

      // -----------------------------
      // 8. Show result screen
      // -----------------------------
      setStep(2);

    } catch (err) {
      console.error('Error saving profile:', err);

      setError(
        'Error saving your information: ' +
        (err.message || 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Goal Messages
  // -----------------------------
  const goalMessages = {
    gain: {
      text: '💪 Weight Gain',
      color: '#f26419',
      desc: 'Focus on calorie surplus and muscle building'
    },

    lose: {
      text: '🔥 Weight Loss',
      color: '#ef4444',
      desc: 'Focus on calorie deficit and healthy metabolism'
    },

    maintain: {
      text: '⚖️ Weight Maintain',
      color: '#55dde0',
      desc: 'Focus on balanced nutrition and health'
    }
  };

  const goalMessage =
    goalMessages[calculatedResult?.goal] ||
    goalMessages.maintain;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

      <motion.div
        initial={{
          scale: 0.9,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        className="
          w-full
          max-w-md
          max-h-[90vh]
          overflow-y-auto
          bg-gradient-to-br
          from-white/95
          to-white
          backdrop-blur-sm
          rounded-3xl
          shadow-2xl
          p-8
          border
          border-white/20
        "
      >

        {/* ================================================= */}
        {/* STEP 1 — USER INFORMATION */}
        {/* ================================================= */}

        {step === 1 ? (

          <>
            <motion.div
              initial={{
                y: -20,
                opacity: 0
              }}
              animate={{
                y: 0,
                opacity: 1
              }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to NutriBloom! 🌸
              </h2>

              <p className="text-gray-600 mb-8">
                Tell us about yourself so we can personalize your dashboard.
              </p>
            </motion.div>

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

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  required
                  min="1"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 22"
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Gender
                </label>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
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

              {/* Height */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Height (cm)
                </label>

                <input
                  type="number"
                  name="heightCm"
                  required
                  min="1"
                  value={formData.heightCm}
                  onChange={handleChange}
                  placeholder="e.g. 165"
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Weight (kg)
                </label>

                <input
                  type="number"
                  name="weightKg"
                  required
                  min="1"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={handleChange}
                  placeholder="e.g. 60"
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Activity Level
                </label>

                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="sedentary">
                    Sedentary — little or no exercise
                  </option>

                  <option value="light">
                    Lightly Active — exercise 1–3 days/week
                  </option>

                  <option value="moderate">
                    Moderately Active — exercise 3–5 days/week
                  </option>

                  <option value="very">
                    Very Active — exercise 6–7 days/week
                  </option>

                  <option value="extra">
                    Extra Active — intense exercise/physical job
                  </option>
                </select>
              </div>

              {/* Calculate Button */}
              <motion.button
                whileHover={{
                  scale: 1.02
                }}
                whileTap={{
                  scale: 0.98
                }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-70"
              >
                {loading
                  ? 'Calculating...'
                  : 'Calculate My Plan'}
              </motion.button>

            </form>
          </>

        ) : (

          /* ================================================= */
          /* STEP 2 — RESULT SCREEN */
          /* ================================================= */

          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
          >

            <div className="text-center">

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Health Summary
              </h2>

              {/* BMI */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-cyan-200">

                <p className="text-gray-600 text-sm mb-2">
                  Your BMI
                </p>

                <p className="text-5xl font-bold text-cyan-600">
                  {calculatedResult.bmi}
                </p>

              </div>

              {/* BMI Category + TDEE */}
              <div className="grid grid-cols-2 gap-4 mb-6">

                {/* BMI Category */}
                <div className="bg-gray-50 rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    BMI Category
                  </p>

                  <p className="text-lg font-bold text-gray-900">
                    {calculatedResult.bmiCategory}
                  </p>

                </div>

                {/* TDEE */}
                <div className="bg-gray-50 rounded-xl p-4">

                  <p className="text-gray-500 text-sm">
                    Daily Energy
                  </p>

                  <p className="text-lg font-bold text-gray-900">
                    {calculatedResult.tdee} kcal
                  </p>

                </div>

              </div>

              {/* BMR */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">

                <p className="text-gray-500 text-sm">
                  Basal Metabolic Rate (BMR)
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {calculatedResult.bmr} kcal/day
                </p>

              </div>

              {/* Goal */}
              <div
                className="rounded-2xl p-6 mb-8 text-white"
                style={{
                  background:
                    `linear-gradient(135deg, ${goalMessage.color} 0%, ${goalMessage.color}dd 100%)`
                }}
              >

                <p className="text-sm opacity-90 mb-2">
                  Your personalized goal:
                </p>

                <p className="text-3xl font-bold mb-2">
                  {goalMessage.text}
                </p>

                <p className="text-sm opacity-90">
                  {goalMessage.desc}
                </p>

              </div>

              <p className="text-gray-600 text-sm mb-8">
                Your dashboard will now show tailored nutrition
                recommendations, meal suggestions, and progress
                tracking for your specific health goal.
              </p>

              {/* ================================================= */}
              {/* ACTION BUTTONS */}
              {/* ================================================= */}

              <div className="space-y-3">

                {/* Start Journey */}
                <motion.button
                  whileHover={{
                    scale: 1.02
                  }}
                  whileTap={{
                    scale: 0.98
                  }}
                  onClick={() =>
                    onComplete(calculatedResult.goal)
                  }
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg transition"
                >
                  Start My Journey
                </motion.button>

                {/* Edit Information */}
                <motion.button
                  whileHover={{
                    scale: 1.02
                  }}
                  whileTap={{
                    scale: 0.98
                  }}
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  className="w-full py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
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
