import useAppStore from '../store/useAppStore';
import { WEEKLY_PLAN } from '../data/workoutData';

const WORKOUT_MEALS = {
  'Leg Day': {
    pre: [
      { name: 'Oats + Banana', kcal: 350, carbs: '60g', protein: '10g', time: '1 hour before' },
      { name: 'Rice + Eggs', kcal: 400, carbs: '45g', protein: '18g', time: '1.5 hours before' }
    ],
    post: [
      { name: 'Chicken + Rice', kcal: 500, carbs: '60g', protein: '40g', time: 'Within 1 hour' },
      { name: 'Paneer Bowl', kcal: 450, carbs: '30g', protein: '25g', time: 'Within 45 min' }
    ]
  },
  'Chest Day': {
    pre: [
      { name: 'Banana + Coffee', kcal: 110, carbs: '28g', protein: '1g', time: '20 min before' },
      { name: 'Peanut Butter Toast', kcal: 280, carbs: '30g', protein: '10g', time: '45 min before' }
    ],
    post: [
      { name: 'Eggs + Chapati', kcal: 350, carbs: '40g', protein: '22g', time: 'Within 1 hour' },
      { name: 'Chicken Breast', kcal: 300, carbs: '5g', protein: '45g', time: 'Within 45 min' }
    ]
  },
  'Back Day': {
    pre: [
      { name: 'Oats + Milk', kcal: 300, carbs: '45g', protein: '12g', time: '1 hour before' },
      { name: 'Banana', kcal: 105, carbs: '27g', protein: '1g', time: '30 min before' }
    ],
    post: [
      { name: 'Paneer + Rice', kcal: 450, carbs: '55g', protein: '22g', time: 'Within 1 hour' },
      { name: 'Tuna / Chicken', kcal: 350, carbs: '5g', protein: '40g', time: 'Within 1 hour' }
    ]
  },
  'Shoulder Day': {
    pre: [
      { name: 'Apple + Peanut Butter', kcal: 200, carbs: '25g', protein: '6g', time: '30-45 min before' },
      { name: 'Toast + Coffee', kcal: 150, carbs: '25g', protein: '4g', time: '30 min before' }
    ],
    post: [
      { name: 'Omelette + Rice', kcal: 400, carbs: '50g', protein: '20g', time: 'Within 45 min' },
      { name: 'High Protein Meal', kcal: 450, carbs: '30g', protein: '40g', time: 'Within 1 hour' }
    ]
  },
  'Arms Day': {
    pre: [
      { name: 'Banana Shake', kcal: 250, carbs: '45g', protein: '8g', time: '30 min before' },
      { name: 'Oats', kcal: 150, carbs: '27g', protein: '5g', time: '45 min before' }
    ],
    post: [
      { name: 'Eggs + Sweet Potato', kcal: 380, carbs: '45g', protein: '24g', time: 'Within 1 hour' },
      { name: 'Chicken Wrap', kcal: 400, carbs: '40g', protein: '35g', time: 'Within 45 min' }
    ]
  },
  'Full Body': {
    pre: [
      { name: 'Rice + Eggs', kcal: 400, carbs: '45g', protein: '18g', time: '1.5 hours before' },
      { name: 'Banana + Oats', kcal: 350, carbs: '60g', protein: '10g', time: '1 hour before' }
    ],
    post: [
      { name: 'Balanced Protein Meal', kcal: 550, carbs: '60g', protein: '45g', time: 'Within 1 hour' },
      { name: 'Chicken + Veggies', kcal: 450, carbs: '20g', protein: '40g', time: 'Within 45 min' }
    ]
  },
  'Rest Day': {
    pre: [
      { name: 'Healthy Nut Snack', kcal: 150, carbs: '8g', protein: '5g', time: 'Light Snack' },
      { name: 'Fruit Salad', kcal: 120, carbs: '30g', protein: '2g', time: 'Light Snack' }
    ],
    post: [
      { name: 'Recovery Bowl', kcal: 300, carbs: '35g', protein: '15g', time: 'Lower Calorie' },
      { name: 'Dal + Salad', kcal: 250, carbs: '30g', protein: '12g', time: 'Lower Calorie' }
    ]
  }
};

export const foodSuggestionService = {
  getSuggestions: (type) => {
    const state = useAppStore.getState();
    const { userProfile, meals, workouts } = state;
    
    // 1. Get Today's Workout
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const workoutInfo = WEEKLY_PLAN[todayName];
    const workoutType = workoutInfo?.name || 'Rest Day';
    
    // 2. Get Base Meals for this Workout
    let baseMeals = WORKOUT_MEALS[workoutType] || WORKOUT_MEALS['Rest Day'];
    let options = type === 'pre' ? baseMeals.pre : baseMeals.post;

    // 3. Filter/Adjust based on Goal and Remaining Cals/Protein
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === today);
    const totalCals = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    
    const caloriesLeft = userProfile.calorieTarget - totalCals;
    const proteinLeft = userProfile.proteinTarget - totalProtein;

    // Tweak logic
    return options.map((meal, index) => {
      let tweakedMeal = { ...meal };
      
      // Goal logic
      if (userProfile.goal === 'Lose Weight') {
        tweakedMeal.name = `Light ${tweakedMeal.name}`;
        tweakedMeal.kcal = Math.round(tweakedMeal.kcal * 0.85);
      } else if (userProfile.goal === 'Gain Muscle') {
        tweakedMeal.name = `Strong ${tweakedMeal.name}`;
        tweakedMeal.kcal = Math.round(tweakedMeal.kcal * 1.2);
        tweakedMeal.protein = `${parseInt(tweakedMeal.protein) + 5}g`;
      }

      // Remaining constraints
      if (caloriesLeft < 300 && tweakedMeal.kcal > 250) {
        tweakedMeal.name = `Small Portion ${tweakedMeal.name}`;
        tweakedMeal.kcal = 200;
      }

      if (proteinLeft > 40 && type === 'post') {
        tweakedMeal.name = `High Protein ${tweakedMeal.name}`;
        tweakedMeal.protein = `${parseInt(tweakedMeal.protein) + 10}g`;
      }

      return tweakedMeal;
    });
  },

  getBestOption: (type) => {
    const options = foodSuggestionService.getSuggestions(type);
    // Rotation logic: Use day of week to pick option
    const dayIndex = new Date().getDay();
    return options[dayIndex % options.length];
  }
};

export default foodSuggestionService;
