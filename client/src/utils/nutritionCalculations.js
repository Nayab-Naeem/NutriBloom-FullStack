// Nutrition calculations for NutriBloom

export const calculateBMI = (weightKg, heightCm) => {
  const heightM = Number(heightCm) / 100;

  if (!heightM || !weightKg) {
    return null;
  }

  return Number((Number(weightKg) / (heightM * heightM)).toFixed(1));
};


export const getBMICategory = (bmi) => {
  if (bmi < 18.5) {
    return 'Underweight';
  }

  if (bmi < 25) {
    return 'Normal weight';
  }

  if (bmi < 30) {
    return 'Overweight';
  }

  return 'Obesity';
};


export const determineGoal = (bmi) => {
  if (bmi < 18.5) {
    return 'gain';
  }

  if (bmi >= 25) {
    return 'lose';
  }

  return 'maintain';
};


export const calculateBMR = ({
  age,
  gender,
  heightCm,
  weightKg
}) => {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  const userAge = Number(age);

  // Mifflin-St Jeor equation
  if (gender === 'male') {
    return Math.round(
      (10 * weight) +
      (6.25 * height) -
      (5 * userAge) +
      5
    );
  }

  // Female / other
  return Math.round(
    (10 * weight) +
    (6.25 * height) -
    (5 * userAge) -
    161
  );
};


export const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };

  const multiplier =
    activityMultipliers[activityLevel] || 1.55;

  return Math.round(bmr * multiplier);
};