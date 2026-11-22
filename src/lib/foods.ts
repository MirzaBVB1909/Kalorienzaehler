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
  // Österreichische Küche
  { id: 'wiener-schnitzel', name: 'Wiener Schnitzel (Kalb, paniert)', kcal: 230, protein: 18, carbs: 12, fat: 12, portion: 200, portionLabel: '1 Schnitzel' },
  { id: 'schnitzel-schwein', name: 'Schnitzel vom Schwein (paniert)', kcal: 250, protein: 17, carbs: 13, fat: 14, portion: 200, portionLabel: '1 Schnitzel' },
  { id: 'backhendl', name: 'Backhendl', kcal: 240, protein: 19, carbs: 10, fat: 14, portion: 250, portionLabel: '1 Portion' },
  { id: 'cordon-bleu', name: 'Cordon bleu', kcal: 260, protein: 18, carbs: 12, fat: 15, portion: 250, portionLabel: '1 Stück' },
  { id: 'tafelspitz', name: 'Tafelspitz', kcal: 150, protein: 26, carbs: 0, fat: 5, portion: 200, portionLabel: '1 Portion' },
  { id: 'schweinsbraten', name: 'Schweinsbraten', kcal: 240, protein: 22, carbs: 0, fat: 17, portion: 200, portionLabel: '1 Portion' },
  { id: 'gulasch', name: 'Rindsgulasch', kcal: 130, protein: 12, carbs: 4, fat: 7, portion: 300, portionLabel: '1 Teller' },
  { id: 'tiroler-groestl', name: 'Tiroler Gröstl', kcal: 160, protein: 7, carbs: 14, fat: 8, portion: 350, portionLabel: '1 Teller' },
  { id: 'kasnocken', name: 'Kasnocken / Käsespätzle', kcal: 230, protein: 9, carbs: 25, fat: 11, portion: 350, portionLabel: '1 Teller' },
  { id: 'kasnudeln', name: 'Kärntner Kasnudeln', kcal: 210, protein: 8, carbs: 28, fat: 7, portion: 300, portionLabel: '1 Portion' },
  { id: 'semmelknoedel', name: 'Semmelknödel', kcal: 190, protein: 6, carbs: 30, fat: 5, portion: 100, portionLabel: '1 Knödel' },
  { id: 'erdaepfelknoedel', name: 'Erdäpfelknödel (Kartoffelknödel)', kcal: 120, protein: 2.5, carbs: 25, fat: 1, portion: 100, portionLabel: '1 Knödel' },
  { id: 'speckknoedel', name: 'Speckknödel', kcal: 220, protein: 8, carbs: 25, fat: 10, portion: 100, portionLabel: '1 Knödel' },
  { id: 'leberkaese', name: 'Leberkäse', kcal: 290, protein: 12, carbs: 2, fat: 26, portion: 100, portionLabel: '1 Scheibe' },
  { id: 'leberkaessemmel', name: 'Leberkässemmel', kcal: 270, protein: 10, carbs: 22, fat: 16, portion: 160, portionLabel: '1 Stück' },
  { id: 'kaesekrainer', name: 'Käsekrainer', kcal: 300, protein: 13, carbs: 2, fat: 27, portion: 120, portionLabel: '1 Stück' },
  { id: 'frankfurter', name: 'Frankfurter Würstel', kcal: 290, protein: 13, carbs: 1, fat: 26, portion: 100, portionLabel: '1 Paar' },
  { id: 'kuerbissuppe', name: 'Kürbissuppe (Kürbiscremesuppe)', kcal: 55, protein: 1.2, carbs: 6, fat: 3, portion: 300, portionLabel: '1 Teller' },
  { id: 'frittatensuppe', name: 'Frittatensuppe', kcal: 45, protein: 2, carbs: 4, fat: 2, portion: 300, portionLabel: '1 Teller' },
  { id: 'leberknoedelsuppe', name: 'Leberknödelsuppe', kcal: 55, protein: 3, carbs: 4, fat: 3, portion: 350, portionLabel: '1 Teller' },
  { id: 'griessnockerlsuppe', name: 'Grießnockerlsuppe', kcal: 50, protein: 2, carbs: 5, fat: 2.5, portion: 300, portionLabel: '1 Teller' },
  { id: 'gulaschsuppe', name: 'Gulaschsuppe', kcal: 75, protein: 5, carbs: 5, fat: 4, portion: 350, portionLabel: '1 Teller' },
  { id: 'erdaepfelsalat', name: 'Erdäpfelsalat (Kartoffelsalat)', kcal: 120, protein: 2, carbs: 15, fat: 6, portion: 200, portionLabel: '1 Portion' },
  { id: 'krautsalat', name: 'Krautsalat', kcal: 60, protein: 1.2, carbs: 6, fat: 3.5, portion: 150, portionLabel: '1 Portion' },
  { id: 'liptauer', name: 'Liptauer', kcal: 250, protein: 9, carbs: 4, fat: 22, portion: 30, portionLabel: '1 Portion' },
  { id: 'kaisersemmel', name: 'Kaisersemmel', kcal: 285, protein: 9, carbs: 56, fat: 2, portion: 55, portionLabel: '1 Stück' },
  { id: 'kornspitz', name: 'Kornspitz', kcal: 290, protein: 10, carbs: 48, fat: 6, portion: 60, portionLabel: '1 Stück' },
  { id: 'topfen', name: 'Topfen 20 %', kcal: 110, protein: 12, carbs: 3, fat: 5, portion: 250, portionLabel: '1 Becher' },
  { id: 'kaiserschmarrn', name: 'Kaiserschmarrn', kcal: 230, protein: 7, carbs: 30, fat: 9, portion: 300, portionLabel: '1 Portion' },
  { id: 'apfelstrudel', name: 'Apfelstrudel', kcal: 230, protein: 3, carbs: 32, fat: 10, portion: 150, portionLabel: '1 Stück' },
  { id: 'topfenstrudel', name: 'Topfenstrudel', kcal: 230, protein: 7, carbs: 28, fat: 10, portion: 150, portionLabel: '1 Stück' },
  { id: 'sachertorte', name: 'Sachertorte', kcal: 370, protein: 5, carbs: 45, fat: 19, portion: 100, portionLabel: '1 Stück' },
  { id: 'linzer-torte', name: 'Linzer Torte', kcal: 410, protein: 6, carbs: 52, fat: 20, portion: 100, portionLabel: '1 Stück' },
  { id: 'germknoedel', name: 'Germknödel', kcal: 260, protein: 6, carbs: 42, fat: 7, portion: 200, portionLabel: '1 Knödel' },
  { id: 'marillenknoedel', name: 'Marillenknödel', kcal: 200, protein: 5, carbs: 33, fat: 5, portion: 70, portionLabel: '1 Knödel' },
  { id: 'palatschinken', name: 'Palatschinken (mit Marmelade)', kcal: 220, protein: 6, carbs: 32, fat: 7, portion: 120, portionLabel: '1 Stück' },
  // Türkische Küche
  { id: 'duerum', name: 'Dürüm Döner', kcal: 220, protein: 12, carbs: 22, fat: 9, portion: 400, portionLabel: '1 Stück' },
  { id: 'lahmacun', name: 'Lahmacun', kcal: 200, protein: 9, carbs: 30, fat: 5, portion: 180, portionLabel: '1 Stück' },
  { id: 'pide-kaese', name: 'Pide mit Käse', kcal: 270, protein: 11, carbs: 35, fat: 10, portion: 300, portionLabel: '1 Stück' },
  { id: 'pide-hack', name: 'Pide mit Hackfleisch', kcal: 250, protein: 12, carbs: 32, fat: 8, portion: 300, portionLabel: '1 Stück' },
  { id: 'koefte', name: 'Köfte', kcal: 240, protein: 17, carbs: 5, fat: 17, portion: 150, portionLabel: '1 Portion' },
  { id: 'adana', name: 'Adana Kebap', kcal: 260, protein: 17, carbs: 3, fat: 20, portion: 200, portionLabel: '1 Portion' },
  { id: 'boerek-kaese', name: 'Börek mit Käse', kcal: 300, protein: 9, carbs: 28, fat: 17, portion: 150, portionLabel: '1 Stück' },
  { id: 'boerek-spinat', name: 'Börek mit Spinat', kcal: 250, protein: 7, carbs: 26, fat: 13, portion: 150, portionLabel: '1 Stück' },
  { id: 'goezleme', name: 'Gözleme', kcal: 230, protein: 9, carbs: 30, fat: 8, portion: 250, portionLabel: '1 Stück' },
  { id: 'manti', name: 'Mantı', kcal: 200, protein: 9, carbs: 25, fat: 7, portion: 300, portionLabel: '1 Teller' },
  { id: 'linsensuppe', name: 'Linsensuppe (Mercimek)', kcal: 60, protein: 3.5, carbs: 9, fat: 1.2, portion: 350, portionLabel: '1 Teller' },
  { id: 'menemen', name: 'Menemen', kcal: 110, protein: 5, carbs: 5, fat: 8, portion: 250, portionLabel: '1 Portion' },
  { id: 'sucuk', name: 'Sucuk', kcal: 330, protein: 18, carbs: 2, fat: 28, portion: 50, portionLabel: '1 Portion' },
  { id: 'imam-bayildi', name: 'İmam bayıldı (gefüllte Melanzani)', kcal: 110, protein: 1.5, carbs: 8, fat: 8, portion: 250, portionLabel: '1 Portion' },
  { id: 'dolma', name: 'Dolma (gefüllte Weinblätter)', kcal: 160, protein: 3, carbs: 20, fat: 8, portion: 100, portionLabel: '5 Stück' },
  { id: 'cig-koefte', name: 'Çiğ Köfte', kcal: 170, protein: 4, carbs: 34, fat: 2, portion: 150, portionLabel: '1 Portion' },
  { id: 'falafel', name: 'Falafel', kcal: 330, protein: 13, carbs: 32, fat: 18, portion: 100, portionLabel: '5 Stück' },
  { id: 'hummus', name: 'Hummus', kcal: 170, protein: 8, carbs: 14, fat: 10, portion: 50, portionLabel: '1 Portion' },
  { id: 'cacik', name: 'Cacık / Zaziki', kcal: 70, protein: 3.5, carbs: 4, fat: 4.5, portion: 100, portionLabel: '1 Portion' },
  { id: 'bulgur-pilav', name: 'Bulgur-Pilav', kcal: 140, protein: 3.5, carbs: 24, fat: 3.5, portion: 200, portionLabel: '1 Portion' },
  { id: 'reis-pilav', name: 'Reis-Pilav (Butterreis)', kcal: 150, protein: 3, carbs: 28, fat: 3, portion: 200, portionLabel: '1 Portion' },
  { id: 'fladenbrot', name: 'Fladenbrot (Pide-Brot)', kcal: 260, protein: 8.5, carbs: 52, fat: 1.5, portion: 100, portionLabel: '1 Stück' },
  { id: 'simit', name: 'Simit', kcal: 300, protein: 9, carbs: 55, fat: 5, portion: 100, portionLabel: '1 Stück' },
  { id: 'baklava', name: 'Baklava', kcal: 430, protein: 6, carbs: 52, fat: 22, portion: 60, portionLabel: '2 Stück' },
  { id: 'kuenefe', name: 'Künefe', kcal: 330, protein: 8, carbs: 40, fat: 16, portion: 150, portionLabel: '1 Portion' },
  { id: 'ayran', name: 'Ayran', kcal: 37, protein: 1.7, carbs: 2.7, fat: 2, portion: 250, portionLabel: '1 Becher', unit: 'ml' },
  { id: 'cay', name: 'Türkischer Tee (Çay)', kcal: 1, protein: 0, carbs: 0.2, fat: 0, portion: 100, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'cay-zucker', name: 'Türkischer Tee mit Zucker', kcal: 40, protein: 0, carbs: 10, fat: 0, portion: 100, portionLabel: '1 Glas', unit: 'ml' },
  { id: 'tuerk-kaffee', name: 'Türkischer Kaffee', kcal: 5, protein: 0.2, carbs: 0.5, fat: 0.2, portion: 70, portionLabel: '1 Tasse', unit: 'ml' },
  // Italienische Küche
  { id: 'pizza-salami', name: 'Pizza Salami', kcal: 270, protein: 12, carbs: 30, fat: 11, portion: 350, portionLabel: '1 Pizza' },
  { id: 'pizza-tonno', name: 'Pizza Tonno', kcal: 240, protein: 12, carbs: 28, fat: 9, portion: 350, portionLabel: '1 Pizza' },
  { id: 'pizza-funghi', name: 'Pizza Funghi', kcal: 230, protein: 10, carbs: 30, fat: 8, portion: 350, portionLabel: '1 Pizza' },
  { id: 'pizza-prosciutto', name: 'Pizza Prosciutto (Schinken)', kcal: 240, protein: 12, carbs: 29, fat: 8.5, portion: 350, portionLabel: '1 Pizza' },
  { id: 'calzone', name: 'Calzone', kcal: 230, protein: 10, carbs: 28, fat: 9, portion: 400, portionLabel: '1 Stück' },
  { id: 'spaghetti-bolognese', name: 'Spaghetti Bolognese', kcal: 140, protein: 7, carbs: 18, fat: 4.5, portion: 400, portionLabel: '1 Teller' },
  { id: 'spaghetti-carbonara', name: 'Spaghetti Carbonara', kcal: 200, protein: 8, carbs: 22, fat: 9, portion: 400, portionLabel: '1 Teller' },
  { id: 'aglio-olio', name: 'Spaghetti Aglio e Olio', kcal: 210, protein: 6, carbs: 30, fat: 8, portion: 350, portionLabel: '1 Teller' },
  { id: 'arrabbiata', name: "Penne all'Arrabbiata", kcal: 140, protein: 4.5, carbs: 25, fat: 3, portion: 400, portionLabel: '1 Teller' },
  { id: 'lasagne', name: 'Lasagne', kcal: 150, protein: 8, carbs: 13, fat: 7, portion: 400, portionLabel: '1 Portion' },
  { id: 'cannelloni', name: 'Cannelloni', kcal: 150, protein: 7, carbs: 14, fat: 7, portion: 400, portionLabel: '1 Portion' },
  { id: 'tortellini', name: 'Tortellini mit Käsefüllung (gekocht)', kcal: 180, protein: 8, carbs: 26, fat: 5, portion: 250, portionLabel: '1 Portion' },
  { id: 'ravioli', name: 'Ravioli (gekocht)', kcal: 170, protein: 7, carbs: 24, fat: 5, portion: 250, portionLabel: '1 Portion' },
  { id: 'gnocchi', name: 'Gnocchi (gekocht)', kcal: 130, protein: 3, carbs: 28, fat: 0.5, portion: 250, portionLabel: '1 Portion' },
  { id: 'risotto', name: 'Risotto (mit Pilzen)', kcal: 140, protein: 3.5, carbs: 20, fat: 5, portion: 350, portionLabel: '1 Teller' },
  { id: 'minestrone', name: 'Minestrone', kcal: 45, protein: 2, carbs: 7, fat: 1, portion: 350, portionLabel: '1 Teller' },
  { id: 'bruschetta', name: 'Bruschetta', kcal: 190, protein: 5, carbs: 25, fat: 8, portion: 100, portionLabel: '2 Stück' },
  { id: 'caprese', name: 'Insalata Caprese (Tomate-Mozzarella)', kcal: 180, protein: 10, carbs: 3, fat: 14, portion: 200, portionLabel: '1 Portion' },
  { id: 'vitello-tonnato', name: 'Vitello tonnato', kcal: 180, protein: 18, carbs: 2, fat: 11, portion: 150, portionLabel: '1 Portion' },
  { id: 'antipasti', name: 'Antipasti (Gemüse in Öl)', kcal: 120, protein: 1.5, carbs: 6, fat: 10, portion: 100, portionLabel: '1 Portion' },
  { id: 'focaccia', name: 'Focaccia', kcal: 270, protein: 7, carbs: 38, fat: 10, portion: 100, portionLabel: '1 Stück' },
  { id: 'parmesan', name: 'Parmesan', kcal: 390, protein: 35, carbs: 0, fat: 28, portion: 10, portionLabel: '1 EL gerieben' },
  { id: 'prosciutto', name: 'Prosciutto (Rohschinken)', kcal: 250, protein: 26, carbs: 0, fat: 16, portion: 30, portionLabel: '2 Scheiben' },
  { id: 'pesto', name: 'Pesto Genovese', kcal: 450, protein: 5, carbs: 5, fat: 45, portion: 15, portionLabel: '1 EL' },
  { id: 'tiramisu', name: 'Tiramisu', kcal: 280, protein: 5, carbs: 28, fat: 16, portion: 150, portionLabel: '1 Portion' },
  { id: 'panna-cotta', name: 'Panna cotta', kcal: 230, protein: 3, carbs: 22, fat: 14, portion: 120, portionLabel: '1 Portion' },
  { id: 'gelato', name: 'Gelato / Speiseeis', kcal: 200, protein: 3.5, carbs: 25, fat: 10, portion: 100, portionLabel: '2 Kugeln' },
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

/** Für die Suche: Kleinbuchstaben, ohne Akzente/Umlaute (ä→a, ç→c, ı→i), ß→ss. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function searchFoods(query: string, extra: Food[] = [], drinksOnly = false): Food[] {
  const all = [...extra, ...FOODS].filter((f) => !drinksOnly || isDrink(f));
  const q = norm(query.trim());
  if (!q) return all;
  return all
    .filter((f) => norm(f.name).includes(q))
    .sort((a, b) => {
      const aStarts = norm(a.name).startsWith(q) ? 0 : 1;
      const bStarts = norm(b.name).startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name, 'de');
    });
}
