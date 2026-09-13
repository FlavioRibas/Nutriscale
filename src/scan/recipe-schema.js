// KinPlate vision-recognition contract.
// Keep this provider-neutral so OpenAI, Gemini, or a fallback OCR pipeline can
// return the same recipe object and the UI never depends on a model vendor.

export const RECIPE_SCAN_SCHEMA_VERSION = 1;

export const emptyScannedRecipe = () => ({
  schemaVersion: RECIPE_SCAN_SCHEMA_VERSION,
  title: '',
  yield: { quantity: null, unit: '', text: '' },
  servings: null,
  categories: [],
  ingredients: [],
  instructions: [],
  nutrition: null,
  garnish: [],
  tips: [],
  makeAhead: [],
  notes: [],
  confidence: {
    overall: null,
    title: null,
    yield: null,
    ingredients: null,
    instructions: null
  },
  uncertainties: []
});

export const scannedRecipeJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title','yield','servings','categories','ingredients','instructions',
    'nutrition','garnish','tips','makeAhead','notes','confidence','uncertainties'
  ],
  properties: {
    title: { type: 'string' },
    yield: {
      type: 'object', additionalProperties: false,
      required: ['quantity','unit','text'],
      properties: {
        quantity: { type: ['number','null'] },
        unit: { type: 'string' },
        text: { type: 'string' }
      }
    },
    servings: { type: ['number','null'] },
    categories: { type: 'array', items: { type: 'string' } },
    ingredients: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['name','quantity','unit','metricQuantity','metricUnit','preparation','sourceText','confidence'],
        properties: {
          name: { type: 'string' },
          quantity: { type: ['number','string','null'] },
          unit: { type: 'string' },
          metricQuantity: { type: ['number','string','null'] },
          metricUnit: { type: 'string' },
          preparation: { type: 'string' },
          sourceText: { type: 'string' },
          confidence: { type: ['number','null'], minimum: 0, maximum: 1 }
        }
      }
    },
    instructions: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['step','text','confidence'],
        properties: {
          step: { type: 'integer', minimum: 1 },
          text: { type: 'string' },
          confidence: { type: ['number','null'], minimum: 0, maximum: 1 }
        }
      }
    },
    nutrition: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object', additionalProperties: false,
          required: ['basis','calories','totalFatG','carbohydrateG','fibreG','proteinG','sodiumMg','cholesterolMg','sourceText'],
          properties: {
            basis: { type: 'string' },
            calories: { type: ['number','null'] },
            totalFatG: { type: ['number','null'] },
            carbohydrateG: { type: ['number','null'] },
            fibreG: { type: ['number','null'] },
            proteinG: { type: ['number','null'] },
            sodiumMg: { type: ['number','null'] },
            cholesterolMg: { type: ['number','null'] },
            sourceText: { type: 'string' }
          }
        }
      ]
    },
    garnish: { type: 'array', items: { type: 'string' } },
    tips: { type: 'array', items: { type: 'string' } },
    makeAhead: { type: 'array', items: { type: 'string' } },
    notes: { type: 'array', items: { type: 'string' } },
    confidence: {
      type: 'object', additionalProperties: false,
      required: ['overall','title','yield','ingredients','instructions'],
      properties: {
        overall: { type: ['number','null'], minimum: 0, maximum: 1 },
        title: { type: ['number','null'], minimum: 0, maximum: 1 },
        yield: { type: ['number','null'], minimum: 0, maximum: 1 },
        ingredients: { type: ['number','null'], minimum: 0, maximum: 1 },
        instructions: { type: ['number','null'], minimum: 0, maximum: 1 }
      }
    },
    uncertainties: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['field','message','sourceText'],
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
          sourceText: { type: 'string' }
        }
      }
    }
  }
};

export function normalizeScannedRecipe(value = {}) {
  const base = emptyScannedRecipe();
  const out = { ...base, ...value };
  out.yield = { ...base.yield, ...(value.yield || {}) };
  out.confidence = { ...base.confidence, ...(value.confidence || {}) };
  for (const key of ['categories','ingredients','instructions','garnish','tips','makeAhead','notes','uncertainties']) {
    out[key] = Array.isArray(value[key]) ? value[key] : [];
  }
  return out;
}
