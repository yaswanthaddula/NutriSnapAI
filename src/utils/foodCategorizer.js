export const SMART_CATEGORIES = {
  WHOLE_FOODS: 'Whole Foods',
  SLICED_FOODS: 'Sliced / Cut Foods',
  COOKED_MEALS: 'Cooked Meals',
  LIQUIDS: 'Liquids',
  PACKAGED_FOODS: 'Packaged Foods'
};

// Keep old mapping for backwards compatibility if needed
export const FOOD_CATEGORIES = {
  FRUITS: SMART_CATEGORIES.WHOLE_FOODS,
  SOLIDS: SMART_CATEGORIES.COOKED_MEALS,
  LIQUIDS: SMART_CATEGORIES.LIQUIDS,
  SNACKS: SMART_CATEGORIES.PACKAGED_FOODS,
  VEGETABLES: SMART_CATEGORIES.SLICED_FOODS,
  PROTEIN: SMART_CATEGORIES.COOKED_MEALS,
  FAST_FOOD: SMART_CATEGORIES.WHOLE_FOODS,
  PACKAGED: SMART_CATEGORIES.PACKAGED_FOODS
};

/**
 * Pluralizes a food name for Whole Foods option labels
 */
export const pluralizeFood = (name = '') => {
  const lower = name.toLowerCase().trim();
  if (!name) return '';
  if (lower.endsWith('y')) return name.slice(0, -1) + 'ies';
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) return name + 'es';
  return name + 's';
};

/**
 * Classifies food into 1 of 5 smart categories
 */
export const categorizeFood = (foodName = '') => {
  const name = foodName.toLowerCase().trim();

  // 1. Sliced / Cut Foods
  if (name.match(/(slices|sliced|cut|pieces|salad|chopped|diced|chunks|halves|wedges|segments)/)) {
    return SMART_CATEGORIES.SLICED_FOODS;
  }

  // 2. Liquids
  if (name.match(/(juice|milk|tea|coffee|smoothie|lassi|shake|drink|water|beverage|soup|coke|pepsi|soda|beer|wine|alcohol|liquid|cider|broth)/)) {
    return SMART_CATEGORIES.LIQUIDS;
  }

  // 3. Packaged Foods
  if (name.match(/(chips|biscuit|chocolate|bar|cookie|wafer|cracker|snack|packet|popcorn|candy|sweet|gummy|nut|almond|cashew|pistachio|peanut|seed)/)) {
    return SMART_CATEGORIES.PACKAGED_FOODS;
  }

  // 4. Cooked Meals
  if (name.match(/(rice|biryani|noodle|pasta|curry|dal|upma|poha|spaghetti|macaroni|khichdi|gravy|tikka|masala|stew|fry|paneer|chicken breast|beef|pork|mutton|fish|tofu|sausage|steak|oats|cereal|porridge|quinoa|lentil|beans)/)) {
    return SMART_CATEGORIES.COOKED_MEALS;
  }

  // 5. Whole Foods (fallback default)
  return SMART_CATEGORIES.WHOLE_FOODS;
};

/**
 * Returns allowed units for each category
 */
export const getUnitsByCategory = (category) => {
  switch (category) {
    case SMART_CATEGORIES.WHOLE_FOODS:
      return ['pieces', 'grams'];
    case SMART_CATEGORIES.SLICED_FOODS:
      return ['grams', 'bowl'];
    case SMART_CATEGORIES.COOKED_MEALS:
      return ['grams', 'bowl', 'plate'];
    case SMART_CATEGORIES.LIQUIDS:
      return ['ml', 'litre'];
    case SMART_CATEGORIES.PACKAGED_FOODS:
      return ['packet', 'grams'];
    default:
      return ['grams', 'pieces'];
  }
};

/**
 * Generates dynamic preset configurations
 */
export const getSmartQuantityOptions = (foodName = '', category) => {
  const cleanFoodName = foodName.trim();
  const lowerName = cleanFoodName.toLowerCase();
  
  // Explicit User Requested Mappings
  if (lowerName.includes('egg')) {
    return [
      { label: '1 Egg', value: 1, unit: 'pieces' },
      { label: '2 Eggs', value: 2, unit: 'pieces' },
      { label: '3 Eggs', value: 3, unit: 'pieces' },
      { label: 'Custom', value: 'custom', unit: 'pieces' }
    ];
  }
  if (lowerName.includes('apple')) {
    return [
      { label: '1 Apple', value: 1, unit: 'pieces' },
      { label: '2 Apples', value: 2, unit: 'pieces' },
      { label: 'Half Apple', value: 0.5, unit: 'pieces' },
      { label: 'Custom', value: 'custom', unit: 'pieces' }
    ];
  }
  if (lowerName.includes('banana')) {
    return [
      { label: '1 Banana', value: 1, unit: 'pieces' },
      { label: '2 Bananas', value: 2, unit: 'pieces' },
      { label: 'Custom', value: 'custom', unit: 'pieces' }
    ];
  }
  if (lowerName.includes('rice')) {
    return [
      { label: '100 g', value: 100, unit: 'grams' },
      { label: '200 g', value: 200, unit: 'grams' },
      { label: 'Bowl', value: 1, unit: 'bowl' },
      { label: 'Plate', value: 1, unit: 'plate' }
    ];
  }
  if (lowerName.includes('chicken')) {
    return [
      { label: '100 g', value: 100, unit: 'grams' },
      { label: '250 g', value: 250, unit: 'grams' },
      { label: '500 g', value: 500, unit: 'grams' },
      { label: 'Custom', value: 'custom', unit: 'grams' }
    ];
  }
  if (lowerName.includes('pizza')) {
    return [
      { label: 'Slice', value: 1, unit: 'slices' },
      { label: '2 Slices', value: 2, unit: 'slices' },
      { label: 'Whole Pizza', value: 8, unit: 'slices' },
      { label: 'Custom', value: 'custom', unit: 'slices' }
    ];
  }
  if (lowerName.includes('cake')) {
    return [
      { label: 'Slice', value: 1, unit: 'slices' },
      { label: 'Half Cake', value: 4, unit: 'slices' },
      { label: 'Custom', value: 'custom', unit: 'slices' }
    ];
  }
  if (lowerName.includes('juice')) {
    return [
      { label: '100 ml', value: 100, unit: 'ml' },
      { label: '250 ml', value: 250, unit: 'ml' },
      { label: 'Glass', value: 1, unit: 'glass' },
      { label: 'Custom', value: 'custom', unit: 'ml' }
    ];
  }
  if (lowerName.includes('milk')) {
    return [
      { label: 'Cup', value: 1, unit: 'cup' },
      { label: 'Glass', value: 1, unit: 'glass' },
      { label: 'ml', value: 'custom', unit: 'ml' }
    ];
  }
  if (lowerName.includes('mango')) {
    return [
      { label: '1 Mango', value: 1, unit: 'pieces' },
      { label: 'Half Mango', value: 0.5, unit: 'pieces' },
      { label: 'Pieces', value: 'custom', unit: 'pieces' }
    ];
  }
  if (lowerName.includes('watermelon')) {
    return [
      { label: 'Slice', value: 1, unit: 'slices' },
      { label: 'Bowl', value: 1, unit: 'bowl' },
      { label: 'kg', value: 1000, unit: 'grams' },
      { label: 'Custom', value: 'custom', unit: 'grams' }
    ];
  }
  if (lowerName.match(/(biryani|curry|dal|paneer|masala|tikka)/)) {
    return [
      { label: 'Half Plate', value: 0.5, unit: 'plate' },
      { label: 'Full Plate', value: 1, unit: 'plate' },
      { label: 'Double Plate', value: 2, unit: 'plate' },
      { label: 'Custom', value: 'custom', unit: 'plate' }
    ];
  }
  if (category === SMART_CATEGORIES.SLICED_FOODS || lowerName.match(/(veg|vegetable|salad)/)) {
    return [
      { label: 'Bowl', value: 1, unit: 'bowl' },
      { label: 'Plate', value: 1, unit: 'plate' },
      { label: 'grams', value: 'custom_grams', unit: 'grams' }
    ];
  }

  // Fallback to generic smart categories
  switch (category) {
    case SMART_CATEGORIES.WHOLE_FOODS:
      return [
        { label: `1/2 ${cleanFoodName}`, value: 0.5, unit: 'pieces' },
        { label: `1 ${cleanFoodName}`, value: 1, unit: 'pieces' },
        { label: `2 ${pluralizeFood(cleanFoodName)}`, value: 2, unit: 'pieces' },
        { label: `3 ${pluralizeFood(cleanFoodName)}`, value: 3, unit: 'pieces' },
        { label: 'Custom', value: 'custom', unit: 'pieces' }
      ];
      
    case SMART_CATEGORIES.SLICED_FOODS:
      return [
        { label: '50g', value: 50, unit: 'grams' },
        { label: '100g', value: 100, unit: 'grams' },
        { label: '150g', value: 150, unit: 'grams' },
        { label: '200g', value: 200, unit: 'grams' },
        { label: '1 bowl', value: 1, unit: 'bowl' },
        { label: 'Custom', value: 'custom', unit: 'grams' }
      ];
      
    case SMART_CATEGORIES.COOKED_MEALS:
      return [
        { label: '50g', value: 50, unit: 'grams' },
        { label: '100g', value: 100, unit: 'grams' },
        { label: '150g', value: 150, unit: 'grams' },
        { label: '200g', value: 200, unit: 'grams' },
        { label: '1 bowl', value: 1, unit: 'bowl' },
        { label: '1 plate', value: 1, unit: 'plate' },
        { label: 'Custom', value: 'custom', unit: 'grams' }
      ];
      
    case SMART_CATEGORIES.LIQUIDS:
      return [
        { label: '100ml', value: 100, unit: 'ml' },
        { label: '250ml', value: 250, unit: 'ml' },
        { label: '500ml', value: 500, unit: 'ml' },
        { label: '1 litre', value: 1, unit: 'litre' },
        { label: 'Custom', value: 'custom', unit: 'ml' }
      ];
      
    case SMART_CATEGORIES.PACKAGED_FOODS:
      return [
        { label: '1 packet', value: 1, unit: 'packet' },
        { label: '2 packets', value: 2, unit: 'packet' },
        { label: 'Grams', value: 'custom_grams', unit: 'grams' },
        { label: 'Custom', value: 'custom', unit: 'packet' }
      ];
      
    default:
      return [
        { label: '100g', value: 100, unit: 'grams' },
        { label: '1 item', value: 1, unit: 'pieces' },
        { label: 'Custom', value: 'custom', unit: 'grams' }
      ];
  }
};

/**
 * Helper compatibility for unit-based presets
 */
export const getPresetsByUnit = (unit) => {
  switch (unit) {
    case 'pieces':
    case 'slices':
    case 'packet':
      return [0.5, 1, 2, 3];
    case 'grams':
      return [50, 100, 150, 200];
    case 'ml':
      return [100, 250, 500];
    case 'litre':
      return [0.25, 0.5, 1];
    case 'bowl':
    case 'plate':
      return [0.5, 1, 1.5, 2];
    default:
      return [1, 2, 3];
  }
};

/**
 * Converts a piece of food to estimated gram weight
 */
export const getPieceGrams = (foodName = '') => {
  const name = foodName.toLowerCase();
  if (name.includes('apple')) return 182;
  if (name.includes('banana')) return 120;
  if (name.includes('mango')) return 200;
  if (name.includes('orange')) return 130;
  if (name.includes('egg')) return 50;
  if (name.includes('burger')) return 220;
  if (name.includes('sandwich')) return 150;
  if (name.includes('chapati') || name.includes('roti')) return 40;
  if (name.includes('idli')) return 50;
  if (name.includes('dosa')) return 80;
  if (name.includes('pizza')) return 120;
  if (name.includes('donut')) return 60;
  if (name.includes('cookie')) return 30;
  if (name.includes('biscuit')) return 10;
  if (name.includes('chocolate')) return 40;
  if (name.includes('packet')) return 50;
  return 150; // default
};

/**
 * Calculates correct multiplier based on selected unit, base unit type, and weight mappings
 */
export const getNutritionMultiplier = (quantity, unit, baseUnitType = 'grams', foodName = '') => {
  if (quantity === 0) return 0;
  
  const pieceWeight = getPieceGrams(foodName);
  
  let userGrams = 0;
  let userMl = 0;
  let userCount = 0;
  
  if (unit === 'grams') {
    userGrams = quantity;
    userMl = quantity;
    userCount = quantity / pieceWeight;
  } else if (unit === 'ml') {
    userGrams = quantity;
    userMl = quantity;
    userCount = quantity / pieceWeight;
  } else if (unit === 'litre' || unit === 'L') {
    userGrams = quantity * 1000;
    userMl = quantity * 1000;
    userCount = (quantity * 1000) / pieceWeight;
  } else if (unit === 'pieces' || unit === 'piece' || unit === 'item') {
    userGrams = quantity * pieceWeight;
    userMl = quantity * pieceWeight;
    userCount = quantity;
  } else if (unit === 'bowl') {
    userGrams = quantity * 250;
    userMl = quantity * 250;
    userCount = (quantity * 250) / pieceWeight;
  } else if (unit === 'plate') {
    userGrams = quantity * 350;
    userMl = quantity * 350;
    userCount = (quantity * 350) / pieceWeight;
  } else if (unit === 'packet') {
    userGrams = quantity * 50;
    userMl = quantity * 50;
    userCount = (quantity * 50) / pieceWeight;
    } else if (unit === 'glass' || unit === 'cup') {
      userGrams = quantity * 250;
      userMl = quantity * 250;
      userCount = (quantity * 250) / pieceWeight;
    } else if (unit === 'slices' || unit === 'slice') {
      userGrams = quantity * pieceWeight;
      userMl = quantity * pieceWeight;
      userCount = quantity;
    } else {
      return quantity;
    }

  if (baseUnitType === 'grams') {
    return userGrams / 100;
  } else if (baseUnitType === 'ml') {
    return userMl / 100;
  } else if (baseUnitType === 'count') {
    return userCount;
  }
  
  return quantity;
};
