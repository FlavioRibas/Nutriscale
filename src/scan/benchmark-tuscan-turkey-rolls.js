// Benchmark Recipe #1 — derived from the user's Tuscan Turkey Rolls test image.
// This fixture defines the structural facts a vision recognizer must recover.
// It intentionally does not require model-specific wording for instructions/notes.

export const TUSCAN_TURKEY_ROLLS_BENCHMARK = {
  id: 'benchmark-001-tuscan-turkey-rolls',
  title: 'Tuscan Turkey Rolls',
  yield: { quantity: 12, unit: 'rolls', textIncludes: '12 rolls' },
  ingredientCount: 10,
  ingredients: [
    { nameIncludes: 'Turkey scaloppine', imperial: '3', metric: '3' },
    { nameIncludes: 'Sun-dried tomato pesto', imperial: '3 tbsp', metric: '50 mL' },
    { nameIncludes: 'Chopped toasted pine nuts', imperial: '2 tbsp', metric: '30 mL' },
    { nameIncludes: 'Grated Parmesan cheese', imperial: '2 tbsp', metric: '30 mL' },
    { nameIncludes: 'Garlic cloves', imperial: '2', metric: '2' },
    { nameIncludes: 'Olive oil', imperial: '1 tbsp', metric: '15 mL' },
    { nameIncludes: 'Balsamic vinegar', imperial: '1/4 cup', metric: '60 mL' },
    { nameIncludes: 'Olive oil', imperial: '3 tbsp', metric: '50 mL' },
    { nameIncludes: 'Maple syrup', imperial: '2 tbsp', metric: '30 mL' },
    { nameIncludes: 'Dijon mustard', imperial: '1 tbsp', metric: '15 mL' }
  ],
  minimumInstructionBlocks: 2,
  nutrition: {
    basisIncludes: '1 roll', calories: 99, totalFatG: 6.0,
    carbohydrateG: 4, proteinG: 8, sodiumMg: 93, cholesterolMg: 12
  },
  garnishIncludes: 'green leaf lettuce',
  tipHeading: 'ABOUT PINE NUTS',
  makeAheadHeading: 'MAKE AHEAD'
};

export const BENCHMARK_PASS_RULES = {
  title: 'exact',
  yield: 'required',
  ingredients: '10/10 rows correctly associated with quantities',
  instructions: 'all cooking directions captured outside ingredients',
  nutrition: 'printed values captured without calculation',
  supplementalSections: 'garnish, pine-nut tip and make-ahead text classified correctly',
  hallucinations: 0
};
