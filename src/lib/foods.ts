/** Nährwerte pro 100 g bzw. 100 ml (Durchschnittswerte). */
export type Food = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Typische Portion in Gramm, als Vorschlag beim Hinzufügen. */
  portion: number;
  portionLabel?: string;
  /** Einheit der Menge: Gramm (Essen) oder Milliliter (Getränke). Standard: 'g'. */
  unit?: Unit;
};

export type Unit = 'g' | 'ml';

export function unitOf(f: { unit?: Unit }): Unit {
  return f.unit ?? 'g';
}

export function isDrink(f: { unit?: Unit }): boolean {
  return unitOf(f) === 'ml';
}

export const FOODS: Food[] = [
  // Obst
  { id: 'apfel', name: 'Apfel', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, portion: 180, portionLabel: '1 Stück' },
  { id: 'banane', name: 'Banane', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: 120, portionLabel: '1 Stück' },
  { id: 'orange', name: 'Orange', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, portion: 150, portionLabel: '1 Stück' },
  { id: 'erdbeeren', name: 'Erdbeeren', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, portion: 150, portionLabel: '1 Schale' },
  { id: 'weintrauben', name: 'Weintrauben', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, portion: 100 },
  { id: 'heidelbeeren', name: 'Heidelbeeren', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3, portion: 100 },
  { id: 'birne', name: 'Birne', kcal: 57, protein: 0.4, carbs: 15, fat: 0.1, portion: 170, portionLabel: '1 Stück' },
  { id: 'avocado', name: 'Avocado', kcal: 160, protein: 2, carbs: 8.5, fat: 15, portion: 70, portionLabel: '½ Stück' },
  // Gemüse
  { id: 'tomate', name: 'Tomate', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, portion: 120, portionLabel: '1 Stück' },
  { id: 'gurke', name: 'Gurke', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, portion: 100 },
  { id: 'karotte', name: 'Karotte', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, portion: 80, portionLabel: '1 Stück' },
  { id: 'brokkoli', name: 'Brokkoli', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, portion: 150 },
  { id: 'paprika', name: 'Paprika rot', kcal: 31, protein: 1, carbs: 6, fat: 0.3, portion: 150, portionLabel: '1 Stück' },
  { id: 'salat', name: 'Blattsalat', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, portion: 80 },
  { id: 'kartoffeln', name: 'Kartoffeln gekocht', kcal: 86, protein: 1.7, carbs: 20, fat: 0.1, portion: 200 },
  { id: 'pommes', name: 'Pommes frites', kcal: 312, protein: 3.4, carbs: 41, fat: 15, portion: 150 },
  // Getreide & Beilagen
  { id: 'reis', name: 'Reis gekocht', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, portion: 180 },
  { id: 'nudeln', name: 'Nudeln gekocht', kcal: 158, protein: 5.8, carbs: 31, fat: 0.9, portion: 200 },
  { id: 'haferflocken', name: 'Haferflocken', kcal: 372, protein: 13.5, carbs: 59, fat: 7, portion: 50 },
  { id: 'vollkornbrot', name: 'Vollkornbrot', kcal: 220, protein: 7.5, carbs: 41, fat: 1.5, portion: 50, portionLabel: '1 Scheibe' },
  { id: 'broetchen', name: 'Brötchen', kcal: 270, protein: 9, carbs: 54, fat: 1.5, portion: 55, portionLabel: '1 Stück' },
  { id: 'toast', name: 'Toastbrot', kcal: 265, protein: 8, carbs: 49, fat: 3.5, portion: 25, portionLabel: '1 Scheibe' },
  { id: 'muesli', name: 'Müsli', kcal: 360, protein: 9, carbs: 62, fat: 6.5, portion: 60 },
  { id: 'cornflakes', name: 'Cornflakes', kcal: 357, protein: 7.5, carbs: 84, fat: 0.4, portion: 30 },
  // Milchprodukte & Eier
  { id: 'milch', name: 'Milch 1,5 %', kcal: 47, protein: 3.4, carbs: 4.8, fat: 1.5, portion: 250, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'joghurt', name: 'Naturjoghurt 3,5 %', kcal: 66, protein: 3.8, carbs: 4.5, fat: 3.5, portion: 150 },
  { id: 'skyr', name: 'Skyr', kcal: 63, protein: 11, carbs: 4, fat: 0.2, portion: 150 },
  { id: 'magerquark', name: 'Magerquark', kcal: 67, protein: 12, carbs: 4, fat: 0.3, portion: 250 },
  { id: 'gouda', name: 'Gouda', kcal: 356, protein: 25, carbs: 0, fat: 28, portion: 30, portionLabel: '1 Scheibe' },
  { id: 'mozzarella', name: 'Mozzarella', kcal: 254, protein: 18, carbs: 1, fat: 20, portion: 125, portionLabel: '1 Kugel' },
  { id: 'feta', name: 'Feta', kcal: 264, protein: 14, carbs: 4, fat: 21, portion: 50 },
  { id: 'ei', name: 'Ei', kcal: 155, protein: 13, carbs: 1.1, fat: 11, portion: 60, portionLabel: '1 Stück' },
  { id: 'butter', name: 'Butter', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81, portion: 10, portionLabel: '1 Portion' },
  // Fleisch & Fisch
  { id: 'haehnchen', name: 'Hähnchenbrust', kcal: 165, protein: 31, carbs: 0, fat: 3.6, portion: 150 },
  { id: 'rinderhack', name: 'Rinderhackfleisch', kcal: 250, protein: 26, carbs: 0, fat: 17, portion: 125 },
  { id: 'lachs', name: 'Lachs', kcal: 208, protein: 20, carbs: 0, fat: 13, portion: 125 },
  { id: 'thunfisch', name: 'Thunfisch (Dose, Wasser)', kcal: 116, protein: 26, carbs: 0, fat: 1, portion: 130, portionLabel: '1 Dose' },
  { id: 'schinken', name: 'Kochschinken', kcal: 107, protein: 19, carbs: 1, fat: 3, portion: 20, portionLabel: '1 Scheibe' },
  { id: 'salami', name: 'Salami', kcal: 380, protein: 22, carbs: 1, fat: 32, portion: 20 },
  { id: 'bratwurst', name: 'Bratwurst', kcal: 300, protein: 13, carbs: 1, fat: 27, portion: 100, portionLabel: '1 Stück' },
  { id: 'tofu', name: 'Tofu', kcal: 144, protein: 15, carbs: 2, fat: 8.5, portion: 150 },
  // Hülsenfrüchte & Nüsse
  { id: 'linsen', name: 'Linsen gekocht', kcal: 116, protein: 9, carbs: 20, fat: 0.4, portion: 150 },
  { id: 'kichererbsen', name: 'Kichererbsen gekocht', kcal: 164, protein: 9, carbs: 27, fat: 2.6, portion: 150 },
  { id: 'mandeln', name: 'Mandeln', kcal: 579, protein: 21, carbs: 22, fat: 50, portion: 30, portionLabel: '1 Handvoll' },
  { id: 'walnuesse', name: 'Walnüsse', kcal: 654, protein: 15, carbs: 14, fat: 65, portion: 30, portionLabel: '1 Handvoll' },
  { id: 'erdnussbutter', name: 'Erdnussbutter', kcal: 588, protein: 25, carbs: 20, fat: 50, portion: 15, portionLabel: '1 EL' },
  // Fertiges & Snacks
  { id: 'pizza', name: 'Pizza Margherita', kcal: 250, protein: 11, carbs: 31, fat: 9, portion: 350, portionLabel: '1 Pizza' },
  { id: 'doener', name: 'Döner Kebab', kcal: 215, protein: 12, carbs: 20, fat: 10, portion: 400, portionLabel: '1 Stück' },
  { id: 'burger', name: 'Cheeseburger', kcal: 265, protein: 14, carbs: 27, fat: 12, portion: 120, portionLabel: '1 Stück' },
  { id: 'schokolade', name: 'Vollmilchschokolade', kcal: 535, protein: 7.5, carbs: 58, fat: 30, portion: 25, portionLabel: '1 Riegel' },
  { id: 'chips', name: 'Kartoffelchips', kcal: 536, protein: 6.5, carbs: 50, fat: 34, portion: 50 },
  { id: 'gummibaerchen', name: 'Gummibärchen', kcal: 343, protein: 6.9, carbs: 77, fat: 0.1, portion: 50 },
  { id: 'croissant', name: 'Croissant', kcal: 406, protein: 8, carbs: 46, fat: 21, portion: 60, portionLabel: '1 Stück' },
  { id: 'nutella', name: 'Nuss-Nougat-Creme', kcal: 539, protein: 6.3, carbs: 57, fat: 31, portion: 15, portionLabel: '1 Portion' },
  // Getränke (Werte pro 100 ml)
  { id: 'wasser', name: 'Wasser', kcal: 0, protein: 0, carbs: 0, fat: 0, portion: 250, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'mineralwasser', name: 'Mineralwasser (Sprudel)', kcal: 0, protein: 0, carbs: 0, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'kaffee', name: 'Kaffee schwarz', kcal: 2, protein: 0.1, carbs: 0, fat: 0, portion: 200, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'kaffee-milch', name: 'Kaffee mit Milch', kcal: 15, protein: 0.8, carbs: 1.2, fat: 0.7, portion: 200, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'kaffee-milch-zucker', name: 'Kaffee mit Milch und Zucker', kcal: 35, protein: 0.8, carbs: 6.2, fat: 0.7, portion: 200, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'espresso', name: 'Espresso', kcal: 2, protein: 0.1, carbs: 0, fat: 0.2, portion: 30, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'cappuccino', name: 'Cappuccino', kcal: 36, protein: 2, carbs: 3, fat: 1.8, portion: 200, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'latte', name: 'Latte Macchiato', kcal: 45, protein: 2.5, carbs: 3.7, fat: 2.2, portion: 300, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'tee', name: 'Tee ungesüßt', kcal: 1, protein: 0, carbs: 0.2, fat: 0, portion: 250, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'tee-zucker', name: 'Tee mit Zucker', kcal: 17, protein: 0, carbs: 4.2, fat: 0, portion: 250, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'kakao', name: 'Kakao (mit Milch)', kcal: 80, protein: 3.5, carbs: 11, fat: 2.5, portion: 250, portionLabel: '1 Tasse', unit: 'ml' },
  { id: 'milch-35', name: 'Milch 3,5 %', kcal: 64, protein: 3.3, carbs: 4.8, fat: 3.5, portion: 250, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'hafermilch', name: 'Haferdrink', kcal: 45, protein: 0.5, carbs: 6.5, fat: 1.5, portion: 250, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'cola', name: 'Cola', kcal: 42, protein: 0, carbs: 10.6, fat: 0, portion: 330, portionLabel: '1 Dose', unit: 'ml' },
  { id: 'cola-zero', name: 'Cola Zero / Light', kcal: 0.3, protein: 0, carbs: 0, fat: 0, portion: 330, portionLabel: '1 Dose', unit: 'ml' },
  { id: 'limonade', name: 'Limonade (Orange/Zitrone)', kcal: 38, protein: 0, carbs: 9.3, fat: 0, portion: 330, portionLabel: '1 Dose', unit: 'ml' },
  { id: 'eistee', name: 'Eistee', kcal: 28, protein: 0, carbs: 6.8, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'energy', name: 'Energy Drink', kcal: 45, protein: 0, carbs: 11, fat: 0, portion: 250, portionLabel: '1 Dose', unit: 'ml' },
  { id: 'orangensaft', name: 'Orangensaft', kcal: 45, protein: 0.7, carbs: 10, fat: 0.2, portion: 200, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'apfelsaft', name: 'Apfelsaft', kcal: 46, protein: 0.1, carbs: 11, fat: 0.1, portion: 200, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'apfelschorle', name: 'Apfelschorle', kcal: 24, protein: 0, carbs: 5.5, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'multivitaminsaft', name: 'Multivitaminsaft', kcal: 50, protein: 0.3, carbs: 11.5, fat: 0.1, portion: 200, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'smoothie', name: 'Smoothie', kcal: 55, protein: 0.6, carbs: 12.5, fat: 0.2, portion: 250, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'proteinshake', name: 'Proteinshake (mit Wasser)', kcal: 40, protein: 8, carbs: 1, fat: 0.5, portion: 300, portionLabel: '1 Shake', unit: 'ml' },
  { id: 'bier', name: 'Bier', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'bier-alkoholfrei', name: 'Bier alkoholfrei', kcal: 25, protein: 0.4, carbs: 5.5, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'radler', name: 'Radler', kcal: 42, protein: 0.3, carbs: 7.5, fat: 0, portion: 500, portionLabel: '1 Flasche', unit: 'ml' },
  { id: 'wein', name: 'Rotwein', kcal: 85, protein: 0.1, carbs: 2.6, fat: 0, portion: 200, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'weisswein', name: 'Weißwein', kcal: 82, protein: 0.1, carbs: 2.6, fat: 0, portion: 200, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'sekt', name: 'Sekt / Prosecco', kcal: 85, protein: 0.2, carbs: 4, fat: 0, portion: 100, portionLabel: '1 Glas', unit: 'ml' },
  // Sonstiges
  { id: 'zucker', name: 'Zucker', kcal: 400, protein: 0, carbs: 100, fat: 0, portion: 4, portionLabel: '1 TL' },
  { id: 'olivenoel', name: 'Olivenöl', kcal: 884, protein: 0, carbs: 0, fat: 100, portion: 10, portionLabel: '1 EL' },
];

export function searchFoods(query: string, extra: Food[] = [], drinksOnly = false): Food[] {
  const all = [...extra, ...FOODS].filter((f) => !drinksOnly || isDrink(f));
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all
    .filter((f) => f.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name, 'de');
    });
}
