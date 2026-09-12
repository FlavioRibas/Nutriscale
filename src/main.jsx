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
  ListChecks,
  Menu,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Utensils,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import './styles.css';

const DEFAULT_CATEGORIES = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Before-Bed Snack'];

const RECIPE_IMAGES = {
  'Greek Yogurt Berry Bowl': 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=900&q=85',
  'Chicken Rice Meal Prep': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85',
};

const starterRecipes = [
  {
    id: crypto.randomUUID(),
    title: 'Greek Yogurt Berry Bowl',
    category: 'Breakfast',
    servings: 1,
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g', packageSize: 750, packageUnit: 'g' },
      { name: 'Blueberries', quantity: 80, unit: 'g', packageSize: 170, packageUnit: 'g' },
      { name: 'Granola', quantity: 40, unit: 'g', packageSize: 300, packageUnit: 'g' },
    ],
    instructions: 'Add yogurt to a bowl. Top with blueberries and granola.',
    notes: 'Starter sample recipe.',
  },
  {
    id: crypto.randomUUID(),
    title: 'Chicken Rice Meal Prep',
    category: 'Lunch',
    servings: 2,
    ingredients: [
      { name: 'Chicken breast', quantity: 400, unit: 'g', packageSize: 900, packageUnit: 'g' },
      { name: 'Rice', quantity: 180, unit: 'g', packageSize: 1000, packageUnit: 'g' },
      { name: 'Broccoli', quantity: 300, unit: 'g', packageSize: 500, packageUnit: 'g' },
    ],
    instructions: 'Cook rice. Season and cook chicken. Steam broccoli. Portion into containers.',
    notes: 'Starter sample recipe.',
  },
];

function parseIngredientLine(line) {
  const cleaned = line.replace(/^[-•*]\s*/, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (!match) return { name: cleaned, quantity: 1, unit: 'unit', packageSize: 1, packageUnit: 'unit' };
  const quantity = match[1].includes('/')
    ? match[1].split('/').reduce((a, b) => Number(a) / Number(b))
    : Number(match[1]);
  const unit = match[2] || 'unit';
  const name = match[3].trim();
  return { name, quantity, unit, packageSize: quantity, packageUnit: unit };
}

function commercialize(totalQty, unit, packageSize, packageUnit) {
  const size = Number(packageSize) || totalQty;
  const packs = Math.max(1, Math.ceil(totalQty / size));
  return `${packs} × ${size}${packageUnit || unit}`;
}

function recipeImage(recipe) {
  return RECIPE_IMAGES[recipe.title] || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85';
}

function Logo() {
  return (
    <div className="brand" aria-label="NutriScale">
      <div className="brand-mark"><span>◒</span><span>◓</span></div>
      <div>
        <div className="brand-name">NutriScale</div>
        <div className="brand-tagline">Real food. A healthier you. Together.</div>
      </div>
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
    recipes.filter((r) => selected.includes(r.id)).forEach((recipe) => {
      recipe.ingredients.forEach((i) => {
        const key = `${i.name.toLowerCase()}|${i.unit}`;
        const existing = map.get(key) || { ...i, quantity: 0 };
        existing.quantity += Number(i.quantity) || 0;
        map.set(key, existing);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, selected]);

  async function handleOCR(file) {
    if (!file) return;
    setOcrStatus('Reading image with local OCR...');
    try {
      const result = await Tesseract.recognize(file, 'eng');
      setForm((f) => ({ ...f, rawIngredients: `${f.rawIngredients}\n${result.data.text}`.trim() }));
      setOcrStatus('OCR complete. Review the ingredient lines before saving.');
    } catch {
      setOcrStatus('OCR failed. Try a clearer image or paste recipe text manually.');
    }
  }

  function saveRecipe(e) {
    e.preventDefault();
    const ingredients = form.rawIngredients.split('\n').map((x) => x.trim()).filter(Boolean).map(parseIngredientLine);
    const recipe = {
      id: crypto.randomUUID(),
      title: form.title || 'Untitled Recipe',
      category: form.category,
      servings: Number(form.servings) || 1,
      ingredients,
      instructions: form.instructions,
      notes: form.notes,
    };
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
    setScreen(next);
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'scan', label: 'Scan', icon: Plus, primary: true },
    { id: 'planner', label: 'Planner', icon: ListChecks },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  ];

  if (activeRecipe) {
    return (
      <div className="shell">
        <TopBar navItems={navItems} screen={screen} navigate={navigate} />
        <main className="content narrow-content">
          <button className="back-button" onClick={() => setActiveRecipe(null)}><ArrowLeft size={18} /> Back to recipes</button>
          <article className="recipe-detail premium-card">
            <div className="detail-image" style={{ backgroundImage: `url(${recipeImage(activeRecipe)})` }}>
              <button className="floating-icon" aria-label="Favourite recipe"><Heart size={21} /></button>
            </div>
            <div className="detail-body">
              <span className="eyebrow">{activeRecipe.category}</span>
              <h1>{activeRecipe.title}</h1>
              <div className="recipe-meta">
                <span><Clock3 size={17} /> 30 min</span>
                <span><Utensils size={17} /> {activeRecipe.servings} serving{activeRecipe.servings === 1 ? '' : 's'}</span>
              </div>
              <p className="detail-intro">A nourishing recipe saved in your NutriScale collection, ready to plan, shop and prepare together.</p>
              <div className="detail-tabs"><strong>Ingredients</strong><span>Instructions</span><span>Nutrition</span></div>
              <ul className="ingredient-list">
                {activeRecipe.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.name}-${index}`}>
                    <span className="ingredient-check"><Check size={13} /></span>
                    <span>{ingredient.name}</span>
                    <strong>{ingredient.quantity} {ingredient.unit}</strong>
                  </li>
                ))}
              </ul>
              <div className="detail-actions">
                <button className="secondary-button" onClick={() => toggleSelected(activeRecipe.id)}>
                  <ShoppingCart size={18} /> {selected.includes(activeRecipe.id) ? 'Added to Shopping' : 'Add to Shopping'}
                </button>
                <button className="primary-button" onClick={() => navigate('planner')}><ListChecks size={18} /> Add to Meal Plan</button>
              </div>
            </div>
          </article>
        </main>
        <BottomNav navItems={navItems} screen={screen} navigate={navigate} />
      </div>
    );
  }

  return (
    <div className="shell">
      <TopBar navItems={navItems} screen={screen} navigate={navigate} />
      <main className="content">
        {screen === 'home' && (
          <HomeScreen recipes={recipes} categories={categories} query={query} setQuery={setQuery} setActiveRecipe={setActiveRecipe} navigate={navigate} />
        )}
        {screen === 'scan' && (
          <ScanScreen form={form} setForm={setForm} categories={categories} saveRecipe={saveRecipe} handleOCR={handleOCR} ocrStatus={ocrStatus} />
        )}
        {screen === 'recipes' && (
          <RecipesScreen recipes={filtered} query={query} setQuery={setQuery} selected={selected} toggleSelected={toggleSelected} deleteRecipe={deleteRecipe} setActiveRecipe={setActiveRecipe} categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} addCategory={addCategory} />
        )}
        {screen === 'shopping' && (
          <ShoppingScreen shoppingList={shoppingList} selectedCount={selected.length} recipes={recipes} selected={selected} toggleSelected={toggleSelected} commercialize={commercialize} />
        )}
        {screen === 'planner' && (
          <PlannerScreen recipes={recipes} navigate={navigate} />
        )}
      </main>
      <BottomNav navItems={navItems} screen={screen} navigate={navigate} />
    </div>
  );
}

function TopBar({ navItems, screen, navigate }) {
  return (
    <header className="topbar">
      <Logo />
      <nav className="desktop-nav" aria-label="Main navigation">
        {navItems.filter((item) => !item.primary).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={18} /> {item.label}</button>;
        })}
      </nav>
      <button className="profile-button" aria-label="Family profile"><Users size={19} /><span>Family</span></button>
    </header>
  );
}

function BottomNav({ navItems, screen, navigate }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={`${screen === item.id ? 'active' : ''} ${item.primary ? 'scan-nav' : ''}`} onClick={() => navigate(item.id)}>
            <span className="nav-icon"><Icon size={item.primary ? 24 : 20} /></span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeScreen({ recipes, categories, query, setQuery, setActiveRecipe, navigate }) {
  const featured = recipes.slice(0, 4);
  const visibleCategories = categories.filter((c) => ['Breakfast', 'Lunch', 'Dinner', 'Afternoon Snack'].includes(c)).slice(0, 4);
  const categoryIcons = { Breakfast: '☀️', Lunch: '🥬', Dinner: '🍽️', 'Afternoon Snack': '🍎' };

  return (
    <div className="home-screen">
      <section className="welcome-row">
        <div>
          <p className="welcome-kicker">Good morning,</p>
          <h1>Flavio</h1>
          <p>Healthy meals. Happier days.</p>
        </div>
        <div className="family-avatar"><Users size={24} /></div>
      </section>

      <div className="search-box large-search"><Search size={20} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes, ingredients or meals..." /></div>

      <section className="category-grid">
        {visibleCategories.map((category) => (
          <button key={category} className="category-card" onClick={() => navigate('recipes')}>
            <span>{categoryIcons[category] || '🥣'}</span>
            <strong>{category.replace('Afternoon ', '')}</strong>
          </button>
        ))}
      </section>

      <section className="morning-feature premium-card">
        <div className="feature-copy">
          <span className="eyebrow">NutriScale pick</span>
          <h2>Start your day well</h2>
          <p>Simple, nutritious recipes for a healthier you and the people you love.</p>
          <button className="primary-button" onClick={() => navigate('recipes')}>Explore recipes <span>→</span></button>
        </div>
        <div className="feature-photo" />
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Made for real life</span><h2>Popular Recipes</h2></div><button className="text-button" onClick={() => navigate('recipes')}>See all</button></div>
        <div className="recipe-card-grid">
          {featured.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => setActiveRecipe(recipe)} />)}
        </div>
      </section>

      <section className="family-banner">
        <div className="family-icon"><Heart size={24} /></div>
        <div><span className="eyebrow">Family table</span><h3>Better meals are easier together.</h3><p>Plan, shop and cook from one shared place.</p></div>
        <button className="secondary-button" onClick={() => navigate('planner')}>Plan the week</button>
      </section>
    </div>
  );
}

function RecipeCard({ recipe, onOpen }) {
  return (
    <article className="recipe-card" onClick={onOpen} tabIndex="0" role="button" onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="recipe-card-image" style={{ backgroundImage: `url(${recipeImage(recipe)})` }}><button className="heart-button" aria-label="Favourite"><Heart size={18} /></button></div>
      <div className="recipe-card-body">
        <span className="eyebrow">{recipe.category}</span>
        <h3>{recipe.title}</h3>
        <div className="recipe-meta"><span><Clock3 size={15} /> 30 min</span><span><Utensils size={15} /> {recipe.servings}</span></div>
      </div>
    </article>
  );
}

function ScanScreen({ form, setForm, categories, saveRecipe, handleOCR, ocrStatus }) {
  return (
    <div className="page-grid scan-layout">
      <section className="scan-intro">
        <span className="eyebrow">Build your collection</span>
        <h1>Scan a Recipe</h1>
        <p>Take a photo of a recipe from a book, magazine or handwritten note. NutriScale will extract the text for you to review before saving.</p>
        <div className="scan-visual premium-card">
          <div className="scan-paper">
            <span className="paper-label">Spaghetti Carbonara</span>
            <span>200g spaghetti</span><span>100g pancetta</span><span>2 eggs</span><span>50g parmesan</span><span>Black pepper</span>
            <div className="scan-corners" />
          </div>
        </div>
        <div className="scan-options">
          <label className="scan-option active"><Camera size={22} /><strong>Photo</strong><input type="file" accept="image/*" capture="environment" onChange={(e) => handleOCR(e.target.files[0])} /></label>
          <label className="scan-option"><ImageIcon size={22} /><strong>Upload</strong><input type="file" accept="image/*" onChange={(e) => handleOCR(e.target.files[0])} /></label>
          <div className="scan-option"><Menu size={22} /><strong>Paste text</strong></div>
        </div>
        {ocrStatus && <div className="status-note"><Sparkles size={17} /> {ocrStatus}</div>}
      </section>

      <section className="premium-card form-card">
        <div className="section-heading"><div><span className="eyebrow">Review before saving</span><h2>Recipe details</h2></div><ChefHat size={30} /></div>
        <form onSubmit={saveRecipe} className="recipe-form">
          <label>Recipe name<input placeholder="e.g. Sunday chicken bowl" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <div className="form-row">
            <label>Meal<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Servings<input type="number" min="1" max="6" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} /></label>
          </div>
          <label>Ingredients<textarea rows="8" placeholder="One ingredient per line — e.g. 200 g Greek yogurt" value={form.rawIngredients} onChange={(e) => setForm({ ...form, rawIngredients: e.target.value })} /></label>
          <label>Instructions<textarea rows="5" placeholder="Preparation steps" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label>
          <label>Notes<input placeholder="Optional family notes or standardization comments" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <button className="primary-button full-button"><Plus size={19} /> Save Standardized Recipe</button>
        </form>
      </section>
    </div>
  );
}

function RecipesScreen({ recipes, query, setQuery, selected, toggleSelected, deleteRecipe, setActiveRecipe, categories, newCategory, setNewCategory, addCategory }) {
  return (
    <div>
      <section className="page-title-row"><div><span className="eyebrow">Your kitchen library</span><h1>Recipes</h1><p>Everything you save, organized for planning, shopping and cooking.</p></div><div className="recipe-count">{recipes.length}<span>recipes</span></div></section>
      <div className="search-box"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by recipe, meal type or ingredient..." /></div>
      <div className="catalog-layout">
        <section>
          <div className="recipe-card-grid catalog-grid">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="catalog-card-wrap">
                <RecipeCard recipe={recipe} onOpen={() => setActiveRecipe(recipe)} />
                <div className="catalog-actions">
                  <button className={`select-button ${selected.includes(recipe.id) ? 'selected' : ''}`} onClick={() => toggleSelected(recipe.id)}>{selected.includes(recipe.id) ? <Check size={16} /> : <ShoppingCart size={16} />} {selected.includes(recipe.id) ? 'Selected' : 'For shopping'}</button>
                  <button className="delete-button" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.title}`}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="premium-card category-panel">
          <span className="eyebrow">Make it yours</span><h2>Meal categories</h2><p>Keep your family's routine organized with custom meal moments.</p>
          <div className="chips">{categories.map((category) => <span key={category}>{category}</span>)}</div>
          <div className="category-add"><input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} /><button onClick={addCategory}><Plus size={17} /></button></div>
        </aside>
      </div>
    </div>
  );
}

function ShoppingScreen({ shoppingList, selectedCount, recipes, selected, toggleSelected, commercialize: packageLabel }) {
  return (
    <div className="page-grid shopping-layout">
      <section>
        <div className="page-title-row"><div><span className="eyebrow">Less waste, less guesswork</span><h1>Shopping</h1><p>Your selected recipes become one simple consolidated list.</p></div><div className="recipe-count">{selectedCount}<span>selected</span></div></div>
        <div className="premium-card shopping-card">
          {shoppingList.length === 0 ? <div className="empty-state"><ShoppingCart size={38} /><h2>Your list is waiting</h2><p>Select recipes from your catalogue to build a shopping list automatically.</p></div> : (
            <ul className="shopping-list">
              {shoppingList.map((item, index) => (
                <li key={`${item.name}-${index}`}><span className="shopping-check" /><div><strong>{item.name}</strong><small>Need {item.quantity} {item.unit}</small></div><span className="buy-pill">Buy {packageLabel(item.quantity, item.unit, item.packageSize, item.packageUnit)}</span></li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <aside className="premium-card selected-recipes-panel"><span className="eyebrow">Included recipes</span><h2>This trip</h2>{recipes.map((recipe) => <label key={recipe.id} className="recipe-toggle"><input type="checkbox" checked={selected.includes(recipe.id)} onChange={() => toggleSelected(recipe.id)} /><span><strong>{recipe.title}</strong><small>{recipe.category} · {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}</small></span></label>)}</aside>
    </div>
  );
}

function PlannerScreen({ recipes, navigate }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div>
      <section className="page-title-row"><div><span className="eyebrow">A calmer week starts here</span><h1>Meal Planner</h1><p>Place your recipes into the week, then turn the plan into a shopping list.</p></div></section>
      <section className="planner-grid">
        {days.map((day, index) => (
          <article className="day-card premium-card" key={day}><div className="day-heading"><span>{day}</span><strong>{index + 14}</strong></div>{index < recipes.length ? <button className="planned-meal"><span className="meal-thumb" style={{ backgroundImage: `url(${recipeImage(recipes[index])})` }} /><span><small>{recipes[index].category}</small><strong>{recipes[index].title}</strong></span></button> : <button className="add-meal" onClick={() => navigate('recipes')}><Plus size={18} /> Add meal</button>}</article>
        ))}
      </section>
      <section className="family-banner planner-banner"><div className="family-icon"><Users size={24} /></div><div><span className="eyebrow">Family planning</span><h3>One plan. One list. Fewer last-minute decisions.</h3></div><button className="primary-button" onClick={() => navigate('shopping')}>Build shopping list</button></section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
