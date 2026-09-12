import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';

import {
  calculateBMI,
  getBMICategory,
  determineGoal,
  calculateBMR,
  calculateTDEE,
} from '../utils/nutritionCalculations';

const OnboardingModal = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'female',
    heightCm: '',
    weightKg: '',
    activityLevel: 'moderate',
  });

  const [step, setStep] = useState(1);
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCalculateAndSave = async (e) => {
    e.preventDefault();
    setError('');

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
      const bmi = calculateBMI(weightKg, heightCm);
      if (!bmi) throw new Error('Unable to calculate BMI.');

      const bmiCategory = getBMICategory(bmi);
      const goal = determineGoal(bmi);
      const bmr = calculateBMR({
        age,
        gender: formData.gender,
        heightCm,
        weightKg,
      });
      const tdee = calculateTDEE(bmr, formData.activityLevel);

      const response = await fetch(apiUrl('/api/nutrition-targets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          gender: formData.gender,
          height_cm: heightCm,
          weight_kg: weightKg,
          goal,
          bmr,
          tdee,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Could not read the AI server response.');
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to generate nutrition targets.');
      }
      if (!result?.data) {
        throw new Error('AI did not return nutrition targets.');
      }

      const targets = result.data;
      if (!targets.calorieGoal || !targets.protein || !targets.carbs || !targets.fat) {
        throw new Error('AI returned incomplete nutrition targets.');
      }

      const { error: saveError } = await supabase.from('profiles').upsert({
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
        updated_at: new Date().toISOString(),
      });

      if (saveError) {
        throw new Error(`Error saving profile: ${saveError.message}`);
      }

      setCalculatedResult({
        bmi,
        bmiCategory,
        goal,
        bmr,
        tdee,
        calorieGoal: Number(targets.calorieGoal),
        protein: Number(targets.protein),
        carbs: Number(targets.carbs),
        fat: Number(targets.fat),
      });
      setStep(2);
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goalMessages = {
    gain: {
      text: 'Weight Gain',
      emoji: '💪',
      color: '#f26419',
      desc: 'Healthy calorie surplus focused on muscle building.',
    },
    lose: {
      text: 'Weight Loss',
      emoji: '🔥',
      color: '#ef4444',
      desc: 'Moderate deficit with nutrition that protects lean mass.',
    },
    maintain: {
      text: 'Weight Maintain',
      emoji: '⚖️',
      color: '#0891b2',
      desc: 'Balanced intake to support your current healthy weight.',
    },
  };

  const goalMessage = goalMessages[calculatedResult?.goal] || goalMessages.maintain;

  const handleEdit = () => {
    setStep(1);
    setError('');
  };

  const handleStartJourney = () => {
    if (!calculatedResult) return;
    onComplete(calculatedResult.goal);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-400/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';
  const panelClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
  const primaryBtnClass =
    'w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 disabled:opacity-70';
  const secondaryBtnClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50';

  const stepTransition = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: 'easeOut' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative flex w-full max-w-lg max-h-[92vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500" />

        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step >= 1 ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                1
              </span>
              <span className={`text-xs font-medium ${step === 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                Profile
              </span>
            </div>
            <div className={`h-px flex-1 transition ${step === 2 ? 'bg-cyan-300' : 'bg-slate-200'}`} />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  step === 2 ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </span>
              <span className={`text-xs font-medium ${step === 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                Plan
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-600">
            {step === 1 ? 'Get started' : 'Your results'}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
            {step === 1 ? 'Welcome to NutriBloom' : 'Health summary'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {step === 1
              ? 'Share a few details so we can build your personalized nutrition targets.'
              : 'Your personalized targets are ready. Review them, then start tracking.'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...stepTransition}>
                <form onSubmit={handleCalculateAndSave} className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Age</label>
                      <input
                        type="number"
                        name="age"
                        required
                        min="13"
                        max="100"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="22"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Height (cm)</label>
                      <input
                        type="number"
                        name="heightCm"
                        required
                        min="100"
                        max="250"
                        value={formData.heightCm}
                        onChange={handleChange}
                        placeholder="165"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Weight (kg)</label>
                      <input
                        type="number"
                        name="weightKg"
                        required
                        min="25"
                        max="300"
                        step="0.1"
                        value={formData.weightKg}
                        onChange={handleChange}
                        placeholder="60"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Activity level</label>
                    <select
                      name="activityLevel"
                      value={formData.activityLevel}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="sedentary">Sedentary — little or no exercise</option>
                      <option value="light">Light — 1–3 days/week</option>
                      <option value="moderate">Moderate — 3–5 days/week</option>
                      <option value="very">Very active — 6–7 days/week</option>
                      <option value="extra">Extra active — intense training / physical job</option>
                    </select>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Used to estimate your daily energy needs (TDEE).
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    type="submit"
                    disabled={loading}
                    className={`${primaryBtnClass} mt-1`}
                  >
                    {loading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating your plan...
                      </span>
                    ) : (
                      'Calculate my plan'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === 2 && calculatedResult && (
              <motion.div key="step2" {...stepTransition} className="space-y-3.5">
                <div className={`${panelClass} text-center`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your BMI</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-cyan-600">
                    {calculatedResult.bmi}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{calculatedResult.bmiCategory}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`${panelClass} text-center`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">BMR</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{calculatedResult.bmr}</p>
                    <p className="text-[11px] text-slate-400">kcal/day</p>
                  </div>
                  <div className={`${panelClass} text-center`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">TDEE</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{calculatedResult.tdee}</p>
                    <p className="text-[11px] text-slate-400">kcal/day</p>
                  </div>
                </div>

                <div
                  className="rounded-2xl px-4 py-3.5 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${goalMessage.color} 0%, ${goalMessage.color}cc 100%)`,
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                    Recommended goal
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {goalMessage.emoji} {goalMessage.text}
                  </p>
                  <p className="mt-0.5 text-sm opacity-90">{goalMessage.desc}</p>
                </div>

                <div className={panelClass}>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Daily nutrition targets
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Calories', value: calculatedResult.calorieGoal, unit: 'kcal' },
                      { label: 'Protein', value: `${calculatedResult.protein}g`, unit: 'per day' },
                      { label: 'Carbs', value: `${calculatedResult.carbs}g`, unit: 'per day' },
                      { label: 'Fat', value: `${calculatedResult.fat}g`, unit: 'per day' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center"
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-slate-900">{item.value}</p>
                        <p className="text-[10px] text-slate-400">{item.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs leading-relaxed text-slate-500">
                  Your dashboard will use these targets for logging, suggestions, and progress tracking.
                </p>

                <div className="space-y-2.5 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleStartJourney}
                    className={primaryBtnClass}
                  >
                    Start my journey
                  </motion.button>
                  <button type="button" onClick={handleEdit} className={secondaryBtnClass}>
                    Edit information
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
