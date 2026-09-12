import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Upload, ShoppingCart, BookOpen, Plus, Trash2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import './styles.css';

const DEFAULT_CATEGORIES = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Before-Bed Snack'];

const starterRecipes = [
  {
    id: crypto.randomUUID(),
    title: 'Greek Yogurt Berry Bowl',
    category: 'Breakfast',
    servings: 1,
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g', packageSize: 750, packageUnit: 'g' },
      { name: 'Blueberries', quantity: 80, unit: 'g', packageSize: 170, packageUnit: 'g' },
      { name: 'Granola', quantity: 40, unit: 'g', packageSize: 300, packageUnit: 'g' }
    ],
    instructions: 'Add yogurt to a bowl. Top with blueberries and granola.',
    notes: 'Starter sample recipe.'
  },
  {
    id: crypto.randomUUID(),
    title: 'Chicken Rice Meal Prep',
    category: 'Lunch',
    servings: 2,
    ingredients: [
      { name: 'Chicken breast', quantity: 400, unit: 'g', packageSize: 900, packageUnit: 'g' },
      { name: 'Rice', quantity: 180, unit: 'g', packageSize: 1000, packageUnit: 'g' },
      { name: 'Broccoli', quantity: 300, unit: 'g', packageSize: 500, packageUnit: 'g' }
    ],
    instructions: 'Cook rice. Season and cook chicken. Steam broccoli. Portion into containers.',
    notes: 'Starter sample recipe.'
  }
];

function parseIngredientLine(line) {
  const cleaned = line.replace(/^[-•*]\s*/, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (!match) return { name: cleaned, quantity: 1, unit: 'unit', packageSize: 1, packageUnit: 'unit' };
  let quantity = match[1].includes('/') ? match[1].split('/').reduce((a, b) => Number(a) / Number(b)) : Number(match[1]);
  const unit = match[2] || 'unit';
  const name = match[3].trim();
  return { name, quantity, unit, packageSize: quantity, packageUnit: unit };
}

function commercialize(totalQty, unit, packageSize, packageUnit) {
  const size = Number(packageSize) || totalQty;
  const packs = Math.max(1, Math.ceil(totalQty / size));
  return `${packs} × ${size}${packageUnit || unit}`;
}

function App() {
  const [recipes, setRecipes] = useState(() => JSON.parse(localStorage.getItem('nutriscale_recipes') || 'null') || starterRecipes);
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('nutriscale_categories') || 'null') || DEFAULT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [ocrStatus, setOcrStatus] = useState('');
  const [form, setForm] = useState({ title: '', category: DEFAULT_CATEGORIES[0], servings: 1, rawIngredients: '', instructions: '', notes: '' });
  const [newCategory, setNewCategory] = useState('');

  function persist(nextRecipes, nextCategories = categories) {
    setRecipes(nextRecipes);
    localStorage.setItem('nutriscale_recipes', JSON.stringify(nextRecipes));
    localStorage.setItem('nutriscale_categories', JSON.stringify(nextCategories));
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recipes.filter(r => [r.title, r.category, r.instructions, ...r.ingredients.map(i => i.name)].join(' ').toLowerCase().includes(q));
  }, [recipes, query]);

  const shoppingList = useMemo(() => {
    const map = new Map();
    recipes.filter(r => selected.includes(r.id)).forEach(recipe => {
      recipe.ingredients.forEach(i => {
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
      setForm(f => ({ ...f, rawIngredients: `${f.rawIngredients}\n${result.data.text}`.trim() }));
      setOcrStatus('OCR complete. Review and clean the ingredient lines before saving.');
    } catch (e) {
      setOcrStatus('OCR failed. Try a clearer image or paste recipe text manually.');
    }
  }

  function saveRecipe(e) {
    e.preventDefault();
    const ingredients = form.rawIngredients.split('\n').map(x => x.trim()).filter(Boolean).map(parseIngredientLine);
    const recipe = { id: crypto.randomUUID(), title: form.title || 'Untitled Recipe', category: form.category, servings: Number(form.servings) || 1, ingredients, instructions: form.instructions, notes: form.notes };
    const next = [recipe, ...recipes];
    persist(next);
    setForm({ title: '', category: categories[0], servings: 1, rawIngredients: '', instructions: '', notes: '' });
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
    const next = recipes.filter(r => r.id !== id);
    setSelected(s => s.filter(x => x !== id));
    persist(next);
  }

  return <div className="app">
    <header>
      <div>
        <h1>NutriScale MVP</h1>
        <p>Personal testing app for scanning, standardizing, cataloging, searching, and shopping-list generation.</p>
      </div>
      <BookOpen size={42} />
    </header>

    <main className="grid">
      <section className="card wide">
        <h2><Upload /> Add / Scan Recipe</h2>
        <form onSubmit={saveRecipe}>
          <div className="row">
            <input placeholder="Recipe name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" min="1" max="6" value={form.servings} onChange={e => setForm({ ...form, servings: e.target.value })} />
          </div>
          <label className="file">Scan recipe image: <input type="file" accept="image/*" onChange={e => handleOCR(e.target.files[0])} /></label>
          <small>{ocrStatus}</small>
          <textarea rows="8" placeholder="Ingredients, one per line. Example: 200 g Greek yogurt" value={form.rawIngredients} onChange={e => setForm({ ...form, rawIngredients: e.target.value })} />
          <textarea rows="5" placeholder="Preparation steps / instructions" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
          <input placeholder="Notes / standardization comments" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button><Plus /> Save Standardized Recipe</button>
        </form>
      </section>

      <section className="card">
        <h2>Custom Meal Categories</h2>
        <div className="row"><input placeholder="Add category" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><button type="button" onClick={addCategory}>Add</button></div>
        <div className="chips">{categories.map(c => <span key={c}>{c}</span>)}</div>
      </section>

      <section className="card wide">
        <h2><Search /> Recipe Catalogue</h2>
        <input placeholder="Search by recipe, meal type, ingredient, or instruction" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="recipes">
          {filtered.map(r => <article key={r.id} className="recipe">
            <div className="recipeTop">
              <label><input type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /> Select</label>
              <button className="icon" onClick={() => deleteRecipe(r.id)}><Trash2 size={16} /></button>
            </div>
            <h3>{r.title}</h3>
            <p><b>{r.category}</b> · Base servings: {r.servings}</p>
            <ul>{r.ingredients.map((i, idx) => <li key={idx}>{i.quantity} {i.unit} {i.name}</li>)}</ul>
            <p>{r.instructions}</p>
          </article>)}
        </div>
      </section>

      <section className="card">
        <h2><ShoppingCart /> Shopping List</h2>
        <p>{selected.length} recipe(s) selected</p>
        {shoppingList.length === 0 ? <p>Select recipes to generate a list.</p> : <ul className="shopping">
          {shoppingList.map((i, idx) => <li key={idx}><b>{i.name}</b><br />Need: {i.quantity} {i.unit}<br />Buy approx: {commercialize(i.quantity, i.unit, i.packageSize, i.packageUnit)}</li>)}
        </ul>}
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
