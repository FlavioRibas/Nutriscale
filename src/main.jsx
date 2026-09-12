import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  Clock3,
  Heart,
  Home,
  Image as ImageIcon,
  Languages,
  ListChecks,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import './styles.css';
import './refinements.css';

const DEFAULT_CATEGORIES = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Before-Bed Snack'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const TRANSLATIONS = {
  en: {
    tagline: 'Real food. A healthier you. Together.',
    home: 'Home', recipes: 'Recipes', scan: 'Scan', planner: 'Planner', shopping: 'Shopping', family: 'Family',
    goodMorning: 'Good morning,', healthyMeals: 'Healthy meals. Happier days.',
    search: 'Search recipes, ingredients or meals...',
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
    pick: 'NutriScale pick', startDay: 'Start your day well', startDayText: 'Simple, nutritious recipes for a healthier you and the people you love.', explore: 'Explore recipes',
    madeForRealLife: 'Made for real life', popular: 'Popular Recipes', seeAll: 'See all',
    familyTable: 'Family table', betterTogether: 'Better meals are easier together.', sharedPlace: 'Plan, shop and cook from one shared place.', planWeek: 'Plan the week',
    backRecipes: 'Back to recipes', servings: 'servings', serving: 'serving',
    detailIntro: 'A nourishing recipe saved in your NutriScale collection, ready to plan, shop and prepare together.',
    ingredients: 'Ingredients', instructions: 'Instructions', nutrition: 'Nutrition', nutritionSoon: 'Nutrition details will appear here as verified nutrition data is added.',
    addShopping: 'Add to Shopping', addedShopping: 'Added to Shopping', addMealPlan: 'Add to Meal Plan',
    chooseDay: 'Choose a day', chooseDayText: 'Which day would you like to add this recipe to?', cancel: 'Cancel', add: 'Add',
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
    buildCollection: 'Build your collection', scanRecipe: 'Scan a Recipe', scanText: 'Take a photo of a recipe from a book, magazine or handwritten note. NutriScale will extract the text for you to review before saving.',
    photo: 'Photo', upload: 'Upload', pasteText: 'Paste text', reviewSaving: 'Review before saving', recipeDetails: 'Recipe details', recipeName: 'Recipe name', meal: 'Meal', notes: 'Notes', saveRecipe: 'Save Standardized Recipe',
    yourLibrary: 'Your kitchen library', recipesTitle: 'Recipes', recipesText: 'Everything you save, organized for planning, shopping and cooking.', recipesCount: 'recipes', searchLibrary: 'Search by recipe, meal type or ingredient...',
    forShopping: 'For shopping', selected: 'Selected', makeYours: 'Make it yours', mealCategories: 'Meal categories', categoriesText: "Keep your family's routine organized with custom meal moments.", newCategory: 'New category',
    lessWaste: 'Less waste, less guesswork', shoppingTitle: 'Shopping', shoppingText: 'Your selected recipes become one simple consolidated list.', selectedCount: 'selected', listWaiting: 'Your list is waiting', listWaitingText: 'Select recipes from your catalogue to build a shopping list automatically.', need: 'Need', buy: 'Buy', includedRecipes: 'Included recipes', thisTrip: 'This trip',
    calmerWeek: 'A calmer week starts here', mealPlanner: 'Meal Planner', plannerText: 'Place your recipes into the week, then turn the plan into a shopping list.', addMeal: 'Add meal', familyPlanning: 'Family planning', onePlan: 'One plan. One list. Fewer last-minute decisions.', buildShopping: 'Build shopping list',
    language: 'Language', noInstructions: 'No instructions saved for this recipe yet.',
    addedTo: 'Added to',
  },
  pt: {
    tagline: 'Comida de verdade. Uma vida mais saudável. Juntos.',
    home: 'Início', recipes: 'Receitas', scan: 'Escanear', planner: 'Planejamento', shopping: 'Compras', family: 'Família',
    goodMorning: 'Bom dia,', healthyMeals: 'Refeições saudáveis. Dias mais felizes.',
    search: 'Buscar receitas, ingredientes ou refeições...',
    breakfast: 'Café da manhã', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanche',
    pick: 'Escolha NutriScale', startDay: 'Comece bem o seu dia', startDayText: 'Receitas simples e nutritivas para uma vida mais saudável com quem você ama.', explore: 'Explorar receitas',
    madeForRealLife: 'Feito para a vida real', popular: 'Receitas Populares', seeAll: 'Ver todas',
    familyTable: 'Mesa da família', betterTogether: 'Boas refeições ficam mais fáceis juntos.', sharedPlace: 'Planeje, compre e cozinhe em um só lugar.', planWeek: 'Planejar a semana',
    backRecipes: 'Voltar às receitas', servings: 'porções', serving: 'porção',
    detailIntro: 'Uma receita nutritiva salva na sua coleção NutriScale, pronta para planejar, comprar e preparar em família.',
    ingredients: 'Ingredientes', instructions: 'Modo de preparo', nutrition: 'Nutrição', nutritionSoon: 'Os dados nutricionais aparecerão aqui quando informações verificadas forem adicionadas.',
    addShopping: 'Adicionar às Compras', addedShopping: 'Adicionado às Compras', addMealPlan: 'Adicionar ao Planejamento',
    chooseDay: 'Escolha o dia', chooseDayText: 'Em qual dia você deseja adicionar esta receita?', cancel: 'Cancelar', add: 'Adicionar',
    monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira', thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
    buildCollection: 'Monte sua coleção', scanRecipe: 'Escanear uma Receita', scanText: 'Tire uma foto de uma receita de livro, revista ou anotação. O NutriScale extrairá o texto para você revisar antes de salvar.',
    photo: 'Foto', upload: 'Enviar', pasteText: 'Colar texto', reviewSaving: 'Revise antes de salvar', recipeDetails: 'Detalhes da receita', recipeName: 'Nome da receita', meal: 'Refeição', notes: 'Observações', saveRecipe: 'Salvar Receita Padronizada',
    yourLibrary: 'Sua biblioteca da cozinha', recipesTitle: 'Receitas', recipesText: 'Tudo o que você salva, organizado para planejar, comprar e cozinhar.', recipesCount: 'receitas', searchLibrary: 'Buscar por receita, refeição ou ingrediente...',
    forShopping: 'Para compras', selected: 'Selecionado', makeYours: 'Do seu jeito', mealCategories: 'Categorias de refeição', categoriesText: 'Organize a rotina da sua família com categorias personalizadas.', newCategory: 'Nova categoria',
    lessWaste: 'Menos desperdício, menos dúvidas', shoppingTitle: 'Compras', shoppingText: 'Suas receitas selecionadas viram uma lista consolidada e simples.', selectedCount: 'selecionadas', listWaiting: 'Sua lista está esperando', listWaitingText: 'Selecione receitas do catálogo para criar automaticamente uma lista de compras.', need: 'Precisa', buy: 'Comprar', includedRecipes: 'Receitas incluídas', thisTrip: 'Nesta compra',
    calmerWeek: 'Uma semana mais tranquila começa aqui', mealPlanner: 'Planejamento de Refeições', plannerText: 'Distribua suas receitas pela semana e transforme o plano em uma lista de compras.', addMeal: 'Adicionar refeição', familyPlanning: 'Planejamento familiar', onePlan: 'Um plano. Uma lista. Menos decisões de última hora.', buildShopping: 'Criar lista de compras',
    language: 'Idioma', noInstructions: 'Ainda não há modo de preparo salvo para esta receita.',
    addedTo: 'Adicionado a',
  },
};

const RECIPE_IMAGES = {
  'Greek Yogurt Berry Bowl': 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=85',
  'Chicken Rice Meal Prep': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
};

const starterRecipes = [
  {
    id: crypto.randomUUID(), title: 'Greek Yogurt Berry Bowl', category: 'Breakfast', servings: 1,
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g', packageSize: 750, packageUnit: 'g' },
      { name: 'Blueberries', quantity: 80, unit: 'g', packageSize: 170, packageUnit: 'g' },
      { name: 'Granola', quantity: 40, unit: 'g', packageSize: 300, packageUnit: 'g' },
    ],
    instructions: 'Add yogurt to a bowl. Top with blueberries and granola.', notes: 'Starter sample recipe.',
  },
  {
    id: crypto.randomUUID(), title: 'Chicken Rice Meal Prep', category: 'Lunch', servings: 2,
    ingredients: [
      { name: 'Chicken breast', quantity: 400, unit: 'g', packageSize: 900, packageUnit: 'g' },
      { name: 'Rice', quantity: 180, unit: 'g', packageSize: 1000, packageUnit: 'g' },
      { name: 'Broccoli', quantity: 300, unit: 'g', packageSize: 500, packageUnit: 'g' },
    ],
    instructions: 'Cook rice. Season and cook chicken. Steam broccoli. Portion into containers.', notes: 'Starter sample recipe.',
  },
];

function parseIngredientLine(line) {
  const cleaned = line.replace(/^[-•*]\s*/, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (!match) return { name: cleaned, quantity: 1, unit: 'unit', packageSize: 1, packageUnit: 'unit' };
  const quantity = match[1].includes('/') ? match[1].split('/').reduce((a, b) => Number(a) / Number(b)) : Number(match[1]);
  const unit = match[2] || 'unit';
  return { name: match[3].trim(), quantity, unit, packageSize: quantity, packageUnit: unit };
}

function commercialize(totalQty, unit, packageSize, packageUnit) {
  const size = Number(packageSize) || totalQty;
  return `${Math.max(1, Math.ceil(totalQty / size))} × ${size}${packageUnit || unit}`;
}

function recipeImage(recipe) {
  return RECIPE_IMAGES[recipe.title] || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85';
}

function categoryLabel(category, t) {
  const map = { Breakfast: t.breakfast, Lunch: t.lunch, Dinner: t.dinner, 'Afternoon Snack': t.snack };
  return map[category] || category;
}

function Logo({ t }) {
  return (
    <div className="brand" aria-label="NutriScale">
      <div className="brand-mark"><span>◒</span><span>◓</span></div>
      <div><div className="brand-name">NutriScale</div><div className="brand-tagline">{t.tagline}</div></div>
    </div>
  );
}

function App() {
  const [recipes, setRecipes] = useState(() => JSON.parse(localStorage.getItem('nutriscale_recipes') || 'null') || starterRecipes);
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('nutriscale_categories') || 'null') || DEFAULT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [ocrStatus, setOcrStatus] = useState('');
  const [form, setForm] = useState({ title: '', category: DEFAULT_CATEGORIES[0], servings: 1, rawIngredients: '', instructions: '', notes: '' });
  const [newCategory, setNewCategory] = useState('');
  const [screen, setScreen] = useState('home');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('ingredients');
  const [language, setLanguage] = useState(() => localStorage.getItem('nutriscale_language') || 'en');
  const [mealPlan, setMealPlan] = useState(() => JSON.parse(localStorage.getItem('nutriscale_meal_plan') || '{}'));
  const [mealPlanRecipe, setMealPlanRecipe] = useState(null);
  const [mealPlanDay, setMealPlanDay] = useState('monday');
  const [toast, setToast] = useState('');
  const t = TRANSLATIONS[language];

  function persist(nextRecipes, nextCategories = categories) {
    setRecipes(nextRecipes);
    localStorage.setItem('nutriscale_recipes', JSON.stringify(nextRecipes));
    localStorage.setItem('nutriscale_categories', JSON.stringify(nextCategories));
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipes.filter((r) => [r.title, r.category, r.instructions, ...r.ingredients.map((i) => i.name)].join(' ').toLowerCase().includes(q));
  }, [recipes, query]);

  const shoppingList = useMemo(() => {
    const map = new Map();
    recipes.filter((r) => selected.includes(r.id)).forEach((recipe) => recipe.ingredients.forEach((i) => {
      const key = `${i.name.toLowerCase()}|${i.unit}`;
      const existing = map.get(key) || { ...i, quantity: 0 };
      existing.quantity += Number(i.quantity) || 0;
      map.set(key, existing);
    }));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, selected]);

  function changeLanguage(next) {
    setLanguage(next);
    localStorage.setItem('nutriscale_language', next);
  }

  async function handleOCR(file) {
    if (!file) return;
    setOcrStatus(language === 'pt' ? 'Lendo imagem com OCR local...' : 'Reading image with local OCR...');
    try {
      const result = await Tesseract.recognize(file, language === 'pt' ? 'por' : 'eng');
      setForm((f) => ({ ...f, rawIngredients: `${f.rawIngredients}\n${result.data.text}`.trim() }));
      setOcrStatus(language === 'pt' ? 'OCR concluído. Revise os ingredientes antes de salvar.' : 'OCR complete. Review the ingredient lines before saving.');
    } catch {
      setOcrStatus(language === 'pt' ? 'Falha no OCR. Tente uma imagem mais nítida ou cole o texto manualmente.' : 'OCR failed. Try a clearer image or paste recipe text manually.');
    }
  }

  function saveRecipe(e) {
    e.preventDefault();
    const ingredients = form.rawIngredients.split('\n').map((x) => x.trim()).filter(Boolean).map(parseIngredientLine);
    const recipe = { id: crypto.randomUUID(), title: form.title || 'Untitled Recipe', category: form.category, servings: Number(form.servings) || 1, ingredients, instructions: form.instructions, notes: form.notes };
    persist([recipe, ...recipes]);
    setForm({ title: '', category: categories[0], servings: 1, rawIngredients: '', instructions: '', notes: '' });
    setScreen('recipes');
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value || categories.includes(value)) return;
    const next = [...categories, value];
    setCategories(next);
    localStorage.setItem('nutriscale_categories', JSON.stringify(next));
    setNewCategory('');
  }

  function deleteRecipe(id) {
    persist(recipes.filter((r) => r.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    if (activeRecipe?.id === id) setActiveRecipe(null);
  }

  function toggleSelected(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function navigate(next) {
    setActiveRecipe(null);
    setActiveTab('ingredients');
    setScreen(next);
  }

  function openRecipe(recipe) {
    setActiveRecipe(recipe);
    setActiveTab('ingredients');
  }

  function requestMealPlan(recipe) {
    setMealPlanRecipe(recipe);
    setMealPlanDay('monday');
  }

  function confirmMealPlan() {
    if (!mealPlanRecipe) return;
    const existing = mealPlan[mealPlanDay] || [];
    const next = { ...mealPlan, [mealPlanDay]: [...existing, mealPlanRecipe.id] };
    setMealPlan(next);
    localStorage.setItem('nutriscale_meal_plan', JSON.stringify(next));
    setToast(`${t.addedTo} ${t[mealPlanDay]}`);
    setMealPlanRecipe(null);
    setTimeout(() => setToast(''), 2200);
  }

  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'recipes', label: t.recipes, icon: BookOpen },
    { id: 'scan', label: t.scan, icon: Plus, primary: true },
    { id: 'planner', label: t.planner, icon: ListChecks },
    { id: 'shopping', label: t.shopping, icon: ShoppingCart },
  ];

  return (
    <div className="shell">
      <TopBar navItems={navItems} screen={screen} navigate={navigate} t={t} language={language} changeLanguage={changeLanguage} />
      {activeRecipe ? (
        <main className="content narrow-content">
          <button className="back-button" onClick={() => setActiveRecipe(null)}><ArrowLeft size={18} /> {t.backRecipes}</button>
          <article className="recipe-detail premium-card">
            <div className="detail-image" style={{ backgroundImage: `url(${recipeImage(activeRecipe)})` }}><button className="floating-icon" aria-label="Favourite recipe"><Heart size={21} /></button></div>
            <div className="detail-body">
              <span className="eyebrow">{categoryLabel(activeRecipe.category, t)}</span>
              <h1>{activeRecipe.title}</h1>
              <div className="recipe-meta"><span><Clock3 size={17} /> 30 min</span><span><Utensils size={17} /> {activeRecipe.servings} {activeRecipe.servings === 1 ? t.serving : t.servings}</span></div>
              <p className="detail-intro">{t.detailIntro}</p>
              <div className="detail-tabs" role="tablist">
                <button className={activeTab === 'ingredients' ? 'active' : ''} onClick={() => setActiveTab('ingredients')}>{t.ingredients}</button>
                <button className={activeTab === 'instructions' ? 'active' : ''} onClick={() => setActiveTab('instructions')}>{t.instructions}</button>
                <button className={activeTab === 'nutrition' ? 'active' : ''} onClick={() => setActiveTab('nutrition')}>{t.nutrition}</button>
              </div>
              <div className="detail-tab-content">
                {activeTab === 'ingredients' && <ul className="ingredient-list">{activeRecipe.ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`}><span className="ingredient-check"><Check size={13} /></span><span>{ingredient.name}</span><strong>{ingredient.quantity} {ingredient.unit}</strong></li>)}</ul>}
                {activeTab === 'instructions' && <div className="instructions-panel"><ChefHat size={23} /><p>{activeRecipe.instructions || t.noInstructions}</p></div>}
                {activeTab === 'nutrition' && <div className="nutrition-panel"><Sparkles size={23} /><p>{t.nutritionSoon}</p></div>}
              </div>
              <div className="detail-actions">
                <button className="secondary-button" onClick={() => toggleSelected(activeRecipe.id)}><ShoppingCart size={18} /> {selected.includes(activeRecipe.id) ? t.addedShopping : t.addShopping}</button>
                <button className="primary-button" onClick={() => requestMealPlan(activeRecipe)}><ListChecks size={18} /> {t.addMealPlan}</button>
              </div>
            </div>
          </article>
        </main>
      ) : (
        <main className="content">
          {screen === 'home' && <HomeScreen recipes={recipes} categories={categories} query={query} setQuery={setQuery} setActiveRecipe={openRecipe} navigate={navigate} t={t} />}
          {screen === 'scan' && <ScanScreen form={form} setForm={setForm} categories={categories} saveRecipe={saveRecipe} handleOCR={handleOCR} ocrStatus={ocrStatus} t={t} />}
          {screen === 'recipes' && <RecipesScreen recipes={filtered} query={query} setQuery={setQuery} selected={selected} toggleSelected={toggleSelected} deleteRecipe={deleteRecipe} setActiveRecipe={openRecipe} categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} addCategory={addCategory} t={t} />}
          {screen === 'shopping' && <ShoppingScreen shoppingList={shoppingList} selectedCount={selected.length} recipes={recipes} selected={selected} toggleSelected={toggleSelected} packageLabel={commercialize} t={t} />}
          {screen === 'planner' && <PlannerScreen recipes={recipes} navigate={navigate} mealPlan={mealPlan} t={t} />}
        </main>
      )}
      <BottomNav navItems={navItems} screen={screen} navigate={navigate} />
      {mealPlanRecipe && <MealPlanModal recipe={mealPlanRecipe} day={mealPlanDay} setDay={setMealPlanDay} confirm={confirmMealPlan} close={() => setMealPlanRecipe(null)} t={t} />}
      {toast && <div className="toast-message"><Check size={17} /> {toast}</div>}
    </div>
  );
}

function TopBar({ navItems, screen, navigate, t, language, changeLanguage }) {
  return (
    <header className="topbar">
      <Logo t={t} />
      <nav className="desktop-nav" aria-label="Main navigation">{navItems.filter((item) => !item.primary).map((item) => { const Icon = item.icon; return <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={18} /> {item.label}</button>; })}</nav>
      <div className="topbar-actions">
        <label className="language-switch"><Languages size={17} /><select aria-label={t.language} value={language} onChange={(e) => changeLanguage(e.target.value)}><option value="en">EN</option><option value="pt">PT-BR</option></select></label>
        <button className="profile-button" aria-label={t.family}><Users size={19} /><span>{t.family}</span></button>
      </div>
    </header>
  );
}

function BottomNav({ navItems, screen, navigate }) {
  return <nav className="bottom-nav" aria-label="Mobile navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={`${screen === item.id ? 'active' : ''} ${item.primary ? 'scan-nav' : ''}`} onClick={() => navigate(item.id)}><span className="nav-icon"><Icon size={item.primary ? 24 : 20} /></span><span>{item.label}</span></button>; })}</nav>;
}

function HomeScreen({ recipes, categories, query, setQuery, setActiveRecipe, navigate, t }) {
  const featured = recipes.slice(0, 5);
  const visibleCategories = categories.filter((c) => ['Breakfast', 'Lunch', 'Dinner', 'Afternoon Snack'].includes(c)).slice(0, 4);
  const categoryIcons = { Breakfast: '☀️', Lunch: '🥬', Dinner: '🍽️', 'Afternoon Snack': '🍎' };
  return <div className="home-screen">
    <section className="welcome-row"><div><p className="welcome-kicker">{t.goodMorning}</p><h1>Flavio</h1><p>{t.healthyMeals}</p></div><div className="family-avatar"><Users size={24} /></div></section>
    <div className="search-box large-search"><Search size={20} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /></div>
    <section className="category-grid">{visibleCategories.map((category) => <button key={category} className="category-card" onClick={() => navigate('recipes')}><span>{categoryIcons[category] || '🥣'}</span><strong>{categoryLabel(category, t)}</strong></button>)}</section>
    <section className="morning-feature premium-card"><div className="feature-copy"><span className="eyebrow">{t.pick}</span><h2>{t.startDay}</h2><p>{t.startDayText}</p><button className="primary-button" onClick={() => navigate('recipes')}>{t.explore} <span>→</span></button></div><div className="feature-photo" /></section>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">{t.madeForRealLife}</span><h2>{t.popular}</h2></div><button className="text-button" onClick={() => navigate('recipes')}>{t.seeAll}</button></div><div className="recipe-card-grid home-recipe-grid">{featured.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => setActiveRecipe(recipe)} t={t} />)}</div></section>
    <section className="family-banner"><div className="family-icon"><Heart size={24} /></div><div><span className="eyebrow">{t.familyTable}</span><h3>{t.betterTogether}</h3><p>{t.sharedPlace}</p></div><button className="secondary-button" onClick={() => navigate('planner')}>{t.planWeek}</button></section>
  </div>;
}

function RecipeCard({ recipe, onOpen, t }) {
  return <article className="recipe-card" onClick={onOpen} tabIndex="0" role="button" onKeyDown={(e) => e.key === 'Enter' && onOpen()}><div className="recipe-card-image" style={{ backgroundImage: `url(${recipeImage(recipe)})` }}><button className="heart-button" aria-label="Favourite"><Heart size={18} /></button></div><div className="recipe-card-body"><span className="eyebrow">{categoryLabel(recipe.category, t)}</span><h3>{recipe.title}</h3><div className="recipe-meta"><span><Clock3 size={15} /> 30 min</span><span><Utensils size={15} /> {recipe.servings}</span></div></div></article>;
}

function ScanScreen({ form, setForm, categories, saveRecipe, handleOCR, ocrStatus, t }) {
  return <div className="page-grid scan-layout"><section className="scan-intro"><span className="eyebrow">{t.buildCollection}</span><h1>{t.scanRecipe}</h1><p>{t.scanText}</p><div className="scan-visual premium-card"><div className="scan-paper"><span className="paper-label">Spaghetti Carbonara</span><span>200g spaghetti</span><span>100g pancetta</span><span>2 eggs</span><span>50g parmesan</span><span>Black pepper</span><div className="scan-corners" /></div></div><div className="scan-options"><label className="scan-option active"><Camera size={22} /><strong>{t.photo}</strong><input type="file" accept="image/*" capture="environment" onChange={(e) => handleOCR(e.target.files[0])} /></label><label className="scan-option"><ImageIcon size={22} /><strong>{t.upload}</strong><input type="file" accept="image/*" onChange={(e) => handleOCR(e.target.files[0])} /></label><div className="scan-option"><Menu size={22} /><strong>{t.pasteText}</strong></div></div>{ocrStatus && <div className="status-note"><Sparkles size={17} /> {ocrStatus}</div>}</section>
    <section className="premium-card form-card"><div className="section-heading"><div><span className="eyebrow">{t.reviewSaving}</span><h2>{t.recipeDetails}</h2></div><ChefHat size={30} /></div><form onSubmit={saveRecipe} className="recipe-form"><label>{t.recipeName}<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="form-row"><label>{t.meal}<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{categoryLabel(c, t)}</option>)}</select></label><label>{t.servings}<input type="number" min="1" max="6" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} /></label></div><label>{t.ingredients}<textarea rows="8" value={form.rawIngredients} onChange={(e) => setForm({ ...form, rawIngredients: e.target.value })} /></label><label>{t.instructions}<textarea rows="5" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label><label>{t.notes}<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button className="primary-button full-button"><Plus size={19} /> {t.saveRecipe}</button></form></section></div>;
}

function RecipesScreen({ recipes, query, setQuery, selected, toggleSelected, deleteRecipe, setActiveRecipe, categories, newCategory, setNewCategory, addCategory, t }) {
  return <div><section className="page-title-row"><div><span className="eyebrow">{t.yourLibrary}</span><h1>{t.recipesTitle}</h1><p>{t.recipesText}</p></div><div className="recipe-count">{recipes.length}<span>{t.recipesCount}</span></div></section><div className="search-box"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchLibrary} /></div><div className="catalog-layout"><section><div className="recipe-card-grid catalog-grid">{recipes.map((recipe) => <div key={recipe.id} className="catalog-card-wrap"><RecipeCard recipe={recipe} onOpen={() => setActiveRecipe(recipe)} t={t} /><div className="catalog-actions"><button className={`select-button ${selected.includes(recipe.id) ? 'selected' : ''}`} onClick={() => toggleSelected(recipe.id)}>{selected.includes(recipe.id) ? <Check size={16} /> : <ShoppingCart size={16} />} {selected.includes(recipe.id) ? t.selected : t.forShopping}</button><button className="delete-button" onClick={() => deleteRecipe(recipe.id)}><Trash2 size={16} /></button></div></div>)}</div></section><aside className="premium-card category-panel"><span className="eyebrow">{t.makeYours}</span><h2>{t.mealCategories}</h2><p>{t.categoriesText}</p><div className="chips">{categories.map((category) => <span key={category}>{categoryLabel(category, t)}</span>)}</div><div className="category-add"><input placeholder={t.newCategory} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} /><button onClick={addCategory}><Plus size={17} /></button></div></aside></div></div>;
}

function ShoppingScreen({ shoppingList, selectedCount, recipes, selected, toggleSelected, packageLabel, t }) {
  return <div className="page-grid shopping-layout"><section><div className="page-title-row"><div><span className="eyebrow">{t.lessWaste}</span><h1>{t.shoppingTitle}</h1><p>{t.shoppingText}</p></div><div className="recipe-count">{selectedCount}<span>{t.selectedCount}</span></div></div><div className="premium-card shopping-card">{shoppingList.length === 0 ? <div className="empty-state"><ShoppingCart size={38} /><h2>{t.listWaiting}</h2><p>{t.listWaitingText}</p></div> : <ul className="shopping-list">{shoppingList.map((item, index) => <li key={`${item.name}-${index}`}><span className="shopping-check" /><div><strong>{item.name}</strong><small>{t.need} {item.quantity} {item.unit}</small></div><span className="buy-pill">{t.buy} {packageLabel(item.quantity, item.unit, item.packageSize, item.packageUnit)}</span></li>)}</ul>}</div></section><aside className="premium-card selected-recipes-panel"><span className="eyebrow">{t.includedRecipes}</span><h2>{t.thisTrip}</h2>{recipes.map((recipe) => <label key={recipe.id} className="recipe-toggle"><input type="checkbox" checked={selected.includes(recipe.id)} onChange={() => toggleSelected(recipe.id)} /><span><strong>{recipe.title}</strong><small>{categoryLabel(recipe.category, t)} · {recipe.servings} {recipe.servings === 1 ? t.serving : t.servings}</small></span></label>)}</aside></div>;
}

function PlannerScreen({ recipes, navigate, mealPlan, t }) {
  return <div><section className="page-title-row"><div><span className="eyebrow">{t.calmerWeek}</span><h1>{t.mealPlanner}</h1><p>{t.plannerText}</p></div></section><section className="planner-grid">{DAYS.map((day, index) => { const ids = mealPlan[day] || []; const planned = ids.map((id) => recipes.find((r) => r.id === id)).filter(Boolean); return <article className="day-card premium-card" key={day}><div className="day-heading"><span>{t[day]}</span><strong>{index + 14}</strong></div>{planned.map((recipe) => <div className="planned-meal" key={`${day}-${recipe.id}`}><span className="meal-thumb" style={{ backgroundImage: `url(${recipeImage(recipe)})` }} /><span><small>{categoryLabel(recipe.category, t)}</small><strong>{recipe.title}</strong></span></div>)}<button className="add-meal" onClick={() => navigate('recipes')}><Plus size={18} /> {t.addMeal}</button></article>; })}</section><section className="family-banner planner-banner"><div className="family-icon"><Users size={24} /></div><div><span className="eyebrow">{t.familyPlanning}</span><h3>{t.onePlan}</h3></div><button className="primary-button" onClick={() => navigate('shopping')}>{t.buildShopping}</button></section></div>;
}

function MealPlanModal({ recipe, day, setDay, confirm, close, t }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="meal-plan-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={close}><X size={19} /></button><span className="eyebrow">{t.addMealPlan}</span><h2>{t.chooseDay}</h2><p>{t.chooseDayText}</p><div className="modal-recipe"><span className="meal-thumb" style={{ backgroundImage: `url(${recipeImage(recipe)})` }} /><strong>{recipe.title}</strong></div><div className="day-options">{DAYS.map((item) => <button key={item} className={day === item ? 'active' : ''} onClick={() => setDay(item)}>{t[item]}</button>)}</div><div className="modal-actions"><button className="secondary-button" onClick={close}>{t.cancel}</button><button className="primary-button" onClick={confirm}>{t.add}</button></div></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
