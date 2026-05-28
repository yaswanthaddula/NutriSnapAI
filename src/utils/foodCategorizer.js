
export const FOOD_CATEGORIES = {
  FRUITS: 'fruits',
  SOLIDS: 'solids',
  LIQUIDS: 'liquids',
  SNACKS: 'snacks',
  VEGETABLES: 'vegetables',
  PROTEIN: 'protein',
  FAST_FOOD: 'fast_food',
  PACKAGED: 'packaged'
};

export const categorizeFood = (foodName = '') => {
  const name = foodName.toLowerCase();
  
  // Liquids
  if (name.match(/(milk|juice|water|smoothie|coffee|tea|soda|coke|pepsi|drink|shake|soup)/)) {
    return FOOD_CATEGORIES.LIQUIDS;
  }
  
  // Fruits
  if (name.match(/(apple|banana|orange|mango|guava|grape|berry|pineapple|watermelon|kiwi|pear|peach)/)) {
    return FOOD_CATEGORIES.FRUITS;
  }
  
  // Fast Food
  if (name.match(/(burger|pizza|sandwich|taco|biryani|fries|noodle|pasta|hotdog|donut)/)) {
    return FOOD_CATEGORIES.FAST_FOOD;
  }
  
  // Protein
  if (name.match(/(chicken|beef|egg|paneer|tofu|fish|mutton|pork|steak|turkey|whey)/)) {
    return FOOD_CATEGORIES.PROTEIN;
  }
  
  // Snacks/Packaged
  if (name.match(/(biscuit|chips|chocolate|bar|cookie|nut|wafer|cracker)/)) {
    return FOOD_CATEGORIES.SNACKS;
  }
  
  // Solids (Rice/Curry)
  if (name.match(/(rice|curry|dal|chapati|roti|dosa|idli|oat|poha)/)) {
    return FOOD_CATEGORIES.SOLIDS;
  }

  // Vegetables
  if (name.match(/(potato|tomato|onion|spinach|broccoli|carrot|cucumber|salad)/)) {
    return FOOD_CATEGORIES.VEGETABLES;
  }

  return FOOD_CATEGORIES.SOLIDS; // Default
};

export const getUnitsByCategory = (category) => {
  switch (category) {
    case FOOD_CATEGORIES.FRUITS:
      return ['pieces', 'slices', 'grams'];
    case FOOD_CATEGORIES.LIQUIDS:
      return ['ml', 'L', 'cups'];
    case FOOD_CATEGORIES.SOLIDS:
    case FOOD_CATEGORIES.VEGETABLES:
    case FOOD_CATEGORIES.PROTEIN:
      return ['grams', 'kg', 'bowl', 'plate'];
    case FOOD_CATEGORIES.FAST_FOOD:
      return ['grams', 'pieces', 'plate', 'box'];
    case FOOD_CATEGORIES.SNACKS:
    case FOOD_CATEGORIES.PACKAGED:
      return ['packet', 'half packet', 'pieces', 'grams'];
    default:
      return ['grams', 'pieces'];
  }
};

export const getPresetsByUnit = (unit) => {
  switch (unit) {
    case 'pieces':
    case 'slices':
      return [0.25, 0.5, 1, 2, 3];
    case 'grams':
      return [50, 100, 150, 200, 250, 500];
    case 'kg':
      return [0.1, 0.25, 0.5, 1];
    case 'ml':
      return [100, 250, 500, 750];
    case 'L':
      return [0.25, 0.5, 1, 1.5, 2];
    case 'bowl':
    case 'plate':
    case 'packet':
    case 'box':
      return [0.5, 1, 1.5, 2];
    case 'half packet':
      return [1, 2];
    case 'cups':
      return [0.5, 1, 2];
    default:
      return [1, 2, 3];
  }
};

export const getNutritionMultiplier = (quantity, unit, baseUnitType = 'grams') => {
  // normalize quantity based on unit
  let normalizedQty = quantity;
  
  if (unit === 'kg' || unit === 'L') {
    normalizedQty = quantity * 1000;
  }
  
  // If base is 100g and user select 200g, multiplier is 2
  if (baseUnitType === 'grams' || baseUnitType === 'ml') {
    if (unit === 'kg' || unit === 'L' || unit === 'grams' || unit === 'ml') {
      return normalizedQty / 100;
    }
    // approximate: 1 bowl = 250g, 1 plate = 350g
    if (unit === 'bowl') return (quantity * 250) / 100;
    if (unit === 'plate') return (quantity * 350) / 100;
    return quantity; // fallback
  }
  
  // If base is '1 medium' (pieces), then multiplier is just quantity
  return quantity;
};
