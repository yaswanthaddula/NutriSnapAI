/**
 * Calculate BMI
 * @param {number} weight kg
 * @param {number} height cm
 * @returns {number}
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Get BMI Status String
 * @param {number} bmi 
 * @returns {string}
 */
export const getBMIStatus = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 24.9) return 'Normal Weight';
  if (bmi >= 25 && bmi < 29.9) return 'Overweight';
  return 'Obese';
};

/**
 * Get Healthy Weight Range
 * @param {number} height cm
 * @returns {{ min: number, max: number }}
 */
export const getHealthyWeightRange = (height) => {
  const heightInMeters = height / 100;
  const min = parseFloat((18.5 * heightInMeters * heightInMeters).toFixed(1));
  const max = parseFloat((24.9 * heightInMeters * heightInMeters).toFixed(1));
  return { min, max };
};

/**
 * Detect Goal based on BMI
 * @param {number} bmi 
 * @returns {string}
 */
export const detectGoal = (bmi) => {
  if (bmi < 18.5) return 'Gain Weight';
  if (bmi > 24.9) return 'Lose Weight';
  return 'Maintain Weight';
};

/**
 * Calculate BMR (Mifflin-St Jeor Equation)
 * @param {number} weight kg
 * @param {number} height cm
 * @param {number} age years
 * @param {string} gender 'Male' or 'Female'
 * @returns {number}
 */
export const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return 0;
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'Female' ? bmr - 161 : bmr + 5;
};

/**
 * Calculate Targets (Calories and Protein)
 * @param {number} bmr 
 * @param {string} activityLevel 
 * @param {string} goal 
 * @param {number} weight 
 * @returns {{ calorieTarget: number, proteinTarget: number }}
 */
export const calculateTargets = (bmr, activityLevel, goal, weight) => {
  let multiplier = 1.2; // Sedentary
  if (activityLevel === 'Light Active') multiplier = 1.375;
  if (activityLevel === 'Active') multiplier = 1.55;
  if (activityLevel === 'Very Active') multiplier = 1.725;

  let calorieTarget = bmr * multiplier;

  if (goal === 'Lose Weight') calorieTarget -= 500;
  if (goal === 'Gain Weight') calorieTarget += 500;

  calorieTarget = Math.round(calorieTarget);

  // Protein calculation: typically 1.6-2.2g per kg depending on goal
  let proteinMultiplier = 1.8;
  if (goal === 'Lose Weight') proteinMultiplier = 2.0; 
  if (goal === 'Gain Weight') proteinMultiplier = 1.6; 

  const proteinTarget = Math.round(weight * proteinMultiplier);
  
  // Ratios for Carbs and Fats (Rough estimates)
  // Fats: ~25% of calories
  const fatsTarget = Math.round((calorieTarget * 0.25) / 9);
  // Carbs: Remaining calories
  const carbsTarget = Math.round((calorieTarget - (proteinTarget * 4) - (fatsTarget * 9)) / 4);

  return {
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatsTarget
  };
};

/**
 * Calculate total consumed calories and nutrients from meals array
 * @param {Array} meals 
 * @returns {{ totalCalories: number, totalProtein: number, totalCarbs: number, totalFats: number }}
 */
export const calculateMealTotals = (meals) => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  
  if (meals && meals.length > 0) {
    meals.forEach(m => {
      totalCalories += m.calories || 0;
      totalProtein += m.protein || 0;
      totalCarbs += m.carbs || 0;
      totalFats += m.fats || 0;
    });
  }
  
  return {
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFats: Math.round(totalFats)
  };
};

/**
 * Calculate Calories Burned from steps
 * @param {number} steps 
 * @param {number} weight 
 * @returns {number}
 */
export const calculateCaloriesBurned = (steps) => {
  return Math.round(steps * 0.04);
};

/**
 * Calculate Suggested Mode based on profile data
 * @param {object} profileData 
 * @returns {string} 'Health' or 'Gym'
 */
export const calculateSuggestedMode = (profileData) => {
  if (!profileData) return 'Health';

  const age = parseInt(profileData.age) || 25;
  const height = parseFloat(profileData.height) || 170.0;
  const weight = parseFloat(profileData.weight) || 60.0;
  const goalStr = (profileData.goal || '').toLowerCase();
  const activityStr = (profileData.activityLevel || profileData.activity || '').toLowerCase();

  // Determine BMI
  let bmi = parseFloat(profileData.bmi);
  if (!bmi && height && weight) {
    const heightInMeters = height / 100;
    bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  // Determine if activity is moderate or high
  const isActivityHigh = 
    activityStr === 'active' || 
    activityStr === 'very active' || 
    activityStr.includes('moderate') || 
    activityStr.includes('high') || 
    activityStr.includes('heavy') ||
    (activityStr.includes('active') && !activityStr.includes('light'));

  // Gym triggers:
  // - Goal includes: muscle gain, weight gain, strength building
  // - Or underweight BMI (e.g. < 18.5)
  const isGymGoal = 
    goalStr.includes('muscle') || 
    goalStr.includes('gain') || 
    goalStr.includes('strength') || 
    goalStr.includes('build') ||
    (bmi && bmi < 18.5);

  // Gym Mode: Age 18-50 AND (Gym Goal OR High Activity)
  if (age >= 18 && age <= 50 && (isGymGoal || isActivityHigh)) {
    return 'Gym';
  }

  // Health Mode default otherwise (age > 50, maintain/loss goals, sedentary/light activity)
  return 'Health';
};
