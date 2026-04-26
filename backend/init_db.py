from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "cozycup.db"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_nrs REAL NOT NULL,
    price_usd REAL NOT NULL,
    price_eur REAL NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('food', 'drinks')),
    subcategory TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    visit_time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

MENU_ITEMS = [
    # FOODS -> Nepali Cuisine
    ("Chicken Momo", "Hand-folded chicken dumplings, steamed to a silky finish and paired with house achar.", 750, 5.0, 3.8, "food", "Nepali Cuisine"),
    ("Buff Momo", "Classic buffalo dumplings with aromatic herbs and a refined chili-tomato relish.", 800, 5.3, 4.0, "food", "Nepali Cuisine"),
    ("Dal Bhat with Chicken", "Fragrant rice and lentils with slow-cooked chicken curry in elevated Nepali style.", 1100, 7.3, 5.5, "food", "Nepali Cuisine"),
    ("Buff Thukpa", "Warming Himalayan noodle broth with tender buffalo and mountain aromatics.", 900, 6.0, 4.5, "food", "Nepali Cuisine"),
    ("Chicken Chowmein", "Wok-charred noodles with marinated chicken and crisp seasonal vegetables.", 850, 5.7, 4.3, "food", "Nepali Cuisine"),
    ("Buff Sekuwa", "Open-flame grilled buffalo skewers in a bold Nepali spice marinade.", 1200, 8.0, 6.0, "food", "Nepali Cuisine"),
    ("Chicken Choila", "Fire-smoked chicken tossed in mustard oil, toasted spices, and fresh herbs.", 1100, 7.3, 5.5, "food", "Nepali Cuisine"),
    ("Bara with Meat", "Crisp lentil bara topped with savory minced meat and Newari spice depth.", 700, 4.7, 3.5, "food", "Nepali Cuisine"),
    ("Chicken Chatamari", "Crisp rice-flour flatbread layered with seasoned chicken and elegant garnish.", 950, 6.3, 4.8, "food", "Nepali Cuisine"),
    ("Mutton Aloo Tama", "Braised mutton with bamboo shoot and potato in a deeply layered Nepali gravy.", 1150, 7.7, 5.8, "food", "Nepali Cuisine"),

    # FOODS -> Indian Cuisine
    ("Butter Chicken", "Tandoor-charred chicken in velvety tomato-butter sauce with subtle fenugreek perfume.", 1300, 8.7, 6.5, "food", "Indian Cuisine"),
    ("Chicken Biryani", "Saffron basmati layered with tender chicken and fragrant whole spices.", 1200, 8.0, 6.0, "food", "Indian Cuisine"),
    ("Mutton Rogan Josh", "Kashmiri-style mutton curry with polished heat and rich spice complexity.", 1400, 9.3, 7.0, "food", "Indian Cuisine"),
    ("Chicken Tandoori", "Yogurt-marinated chicken roasted in tandoor for smoke and succulence.", 1300, 8.7, 6.5, "food", "Indian Cuisine"),
    ("Goat Curry", "Traditional goat curry, slowly cooked to tender perfection with layered aromatics.", 1350, 9.0, 6.8, "food", "Indian Cuisine"),
    ("Chicken Korma", "Luxurious cashew-cream chicken korma finished with cardamom warmth.", 1250, 8.3, 6.3, "food", "Indian Cuisine"),
    ("Lamb Vindaloo", "Goan lamb vindaloo with balanced acidity, depth, and elegant spice heat.", 1350, 9.0, 6.8, "food", "Indian Cuisine"),
    ("Chicken Tikka Masala", "Char-grilled tikka in refined tomato-cream masala, smooth and expressive.", 1300, 8.7, 6.5, "food", "Indian Cuisine"),
    ("Mutton Keema", "Finely minced mutton sauteed with peas, ginger, and aromatic spice oils.", 1200, 8.0, 6.0, "food", "Indian Cuisine"),
    ("Chicken Chettinad", "South Indian black-pepper chicken with roasted spice intensity and curry leaves.", 1300, 8.7, 6.5, "food", "Indian Cuisine"),

    # FOODS -> Asian Cuisine
    ("Chicken Sushi", "Precision-rolled sushi with marinated chicken, seasoned rice, and clean umami notes.", 1400, 9.3, 7.0, "food", "Asian Cuisine"),
    ("Chicken Ramen", "Silky broth ramen topped with tender chicken, spring onions, and classic garnishes.", 1300, 8.7, 6.5, "food", "Asian Cuisine"),
    ("Pork Dim Sum", "Delicate pork dim sum with ginger-soy accents and a refined steamed finish.", 1100, 7.3, 5.5, "food", "Asian Cuisine"),
    ("Chicken Pad Thai", "Wok-seared rice noodles with chicken, tamarind glaze, and toasted peanut crunch.", 1200, 8.0, 6.0, "food", "Asian Cuisine"),
    ("Korean BBQ Pork", "Caramelized pork in Korean barbecue glaze with sesame and spring onion lift.", 1600, 10.7, 8.0, "food", "Asian Cuisine"),
    ("Chicken Fried Rice", "Fragrant jasmine fried rice with marinated chicken and signature wok char.", 900, 6.0, 4.5, "food", "Asian Cuisine"),
    ("Chicken Spring Rolls", "Golden spring rolls filled with seasoned chicken and crisp vegetables.", 850, 5.7, 4.3, "food", "Asian Cuisine"),
    ("Teriyaki Chicken", "Glazed teriyaki chicken with balanced sweetness, umami depth, and gentle smoke.", 1300, 8.7, 6.5, "food", "Asian Cuisine"),
    ("Lamb Pho", "Aromatic Vietnamese-style broth with rice noodles, tender lamb, and fresh herbs.", 1300, 8.7, 6.5, "food", "Asian Cuisine"),
    ("Pork Bao Buns", "Pillowy steamed buns filled with succulent pork, pickles, and house glaze.", 1100, 7.3, 5.5, "food", "Asian Cuisine"),

    # FOODS -> American Cuisine
    ("Chicken Burger", "Gourmet chicken burger on toasted brioche with aged cheese and house sauce.", 1200, 8.0, 6.0, "food", "American Cuisine"),
    ("BBQ Pork Ribs", "Slow-cooked pork ribs lacquered in smoky barbecue reduction.", 1800, 12.0, 9.0, "food", "American Cuisine"),
    ("Southern Fried Chicken", "Golden-crisp fried chicken with seasoned crust and juicy center.", 1200, 8.0, 6.0, "food", "American Cuisine"),
    ("Chicken Hot Dog", "Premium chicken frank in a toasted roll with artisanal mustard relish.", 900, 6.0, 4.5, "food", "American Cuisine"),
    ("Lamb Steak", "Pan-seared lamb steak finished with herb butter and reduced jus.", 2200, 14.7, 11.0, "food", "American Cuisine"),
    ("Chicken Mac and Cheese", "Creamy baked macaroni with roasted chicken and matured cheese blend.", 1100, 7.3, 5.5, "food", "American Cuisine"),
    ("Buffalo Wings", "House-spiced wings glazed for bold flavor and balanced heat.", 1100, 7.3, 5.5, "food", "American Cuisine"),
    ("Chicken Club Sandwich", "Triple-layer toasted sandwich with carved chicken and crisp greens.", 1000, 6.7, 5.0, "food", "American Cuisine"),
    ("Chicken Caesar Salad", "Romaine hearts with grilled chicken, parmesan, and classic Caesar dressing.", 900, 6.0, 4.5, "food", "American Cuisine"),
    ("Pulled Pork Sandwich", "Slow-braised pulled pork in a soft bun with tangy slaw.", 1200, 8.0, 6.0, "food", "American Cuisine"),

    # FOODS -> European Cuisine
    ("Chicken Alfredo", "Fresh pasta in silky parmesan cream with pan-seared chicken.", 1200, 8.0, 6.0, "food", "European Cuisine"),
    ("Chicken Lasagna", "Layered pasta bake with rich chicken ragout, bechamel, and aged cheese.", 1300, 8.7, 6.5, "food", "European Cuisine"),
    ("Lamb Risotto", "Arborio risotto finished with braised lamb, parmesan, and white wine reduction.", 1400, 9.3, 7.0, "food", "European Cuisine"),
    ("Chicken Pizza", "Stone-baked pizza with roasted chicken, mozzarella, and basil tomato sauce.", 1200, 8.0, 6.0, "food", "European Cuisine"),
    ("Pork Sausage Plate", "Herb-forward pork sausages served with refined mustard jus.", 1000, 6.7, 5.0, "food", "European Cuisine"),
    ("Chicken Schnitzel", "Crisp breaded chicken cutlet with lemon butter and parsley.", 1300, 8.7, 6.5, "food", "European Cuisine"),
    ("Lamb Goulash", "Slow-stewed lamb in a paprika-rich sauce with continental depth.", 1400, 9.3, 7.0, "food", "European Cuisine"),
    ("Chicken Bruschetta", "Toasted artisan bread with herbed chicken and vibrant tomato concasse.", 900, 6.0, 4.5, "food", "European Cuisine"),
    ("Pork Carbonara", "Al dente pasta with cured pork, egg yolk emulsion, and pecorino.", 1300, 8.7, 6.5, "food", "European Cuisine"),
    ("Herb Roast Chicken", "Oven-roasted chicken with aromatic herb crust and pan jus.", 1400, 9.3, 7.0, "food", "European Cuisine"),

    # DRINKS -> Hard Drinks
    ("Jack Daniel's Old No. 7", "Iconic Tennessee whiskey with mellow oak sweetness and spice.", 1600, 10.7, 8.0, "drinks", "Hard Drinks"),
    ("Johnnie Walker Black Label", "12-year blended Scotch with layered smoke, vanilla, and dried fruit.", 1800, 12.0, 9.0, "drinks", "Hard Drinks"),
    ("Absolut Vodka", "Exceptionally clean Swedish vodka with a polished neutral finish.", 1400, 9.3, 7.0, "drinks", "Hard Drinks"),
    ("Smirnoff No. 21", "Smooth triple-distilled vodka ideal for premium mixed service.", 1200, 8.0, 6.0, "drinks", "Hard Drinks"),
    ("Bacardi Carta Blanca", "Light-bodied rum with bright citrus tones and soft vanilla.", 1300, 8.7, 6.5, "drinks", "Hard Drinks"),
    ("Captain Morgan Original Spiced", "Caribbean spiced rum with warm cinnamon-clove character.", 1400, 9.3, 7.0, "drinks", "Hard Drinks"),
    ("Bombay Sapphire", "London dry gin infused with ten botanicals and elegant juniper lift.", 1500, 10.0, 7.5, "drinks", "Hard Drinks"),
    ("Tanqueray London Dry", "Classic dry gin with crisp botanicals and a long clean finish.", 1500, 10.0, 7.5, "drinks", "Hard Drinks"),
    ("Jose Cuervo Especial", "Celebrated tequila with agave warmth and subtle oak detail.", 1600, 10.7, 8.0, "drinks", "Hard Drinks"),

    # DRINKS -> Soft Drinks / Juices
    ("Coca-Cola", "Chilled classic cola with lively effervescence and balanced sweetness.", 300, 2.0, 1.5, "drinks", "Soft Drinks / Juices"),
    ("Sprite", "Crisp lemon-lime soda served ice-cold for a bright clean palate.", 300, 2.0, 1.5, "drinks", "Soft Drinks / Juices"),
    ("Fanta Orange", "Sparkling orange soda with vibrant citrus aromatics.", 300, 2.0, 1.5, "drinks", "Soft Drinks / Juices"),
    ("Red Bull", "Premium energy drink with brisk carbonation and focused flavor.", 600, 4.0, 3.0, "drinks", "Soft Drinks / Juices"),
    ("Fresh Orange Juice", "Cold-pressed orange juice with natural sweetness and acidity.", 500, 3.3, 2.5, "drinks", "Soft Drinks / Juices"),
    ("Fresh Apple Juice", "Clarified apple juice with crisp texture and gentle sweetness.", 500, 3.3, 2.5, "drinks", "Soft Drinks / Juices"),
    ("Mango Juice", "Velvety mango juice with tropical depth and fragrant ripeness.", 600, 4.0, 3.0, "drinks", "Soft Drinks / Juices"),
    ("Pineapple Juice", "Bright pineapple juice with refreshing tang and clean finish.", 600, 4.0, 3.0, "drinks", "Soft Drinks / Juices"),

    # DRINKS -> Wines
    ("Jacob's Creek Shiraz", "Structured Australian red with dark fruit and soft spice.", 1600, 10.7, 8.0, "drinks", "Wines"),
    ("Barefoot Merlot", "Approachable red wine with ripe berry notes and smooth texture.", 1500, 10.0, 7.5, "drinks", "Wines"),
    ("Yellow Tail Chardonnay", "Rounded white wine with orchard fruit and gentle oak nuance.", 1700, 11.3, 8.5, "drinks", "Wines"),
    ("Sula Dindori Reserve", "Elegant Indian reserve wine with refined fruit expression.", 1400, 9.3, 7.0, "drinks", "Wines"),
    ("Provence Style Rose", "Delicate rose with floral aromatics and crisp red-fruit finish.", 1500, 10.0, 7.5, "drinks", "Wines"),
    ("Cabernet Sauvignon Reserve", "Full-bodied cabernet with cassis depth and polished tannins.", 1800, 12.0, 9.0, "drinks", "Wines"),
    ("Sauvignon Blanc", "Fresh white with citrus brightness and mineral precision.", 1700, 11.3, 8.5, "drinks", "Wines"),
    ("Pinot Noir", "Silky red with red cherry notes and an elegant earthy finish.", 1800, 12.0, 9.0, "drinks", "Wines"),

    # DRINKS -> Champagne
    ("Moet and Chandon Brut Imperial", "Celebrated brut champagne with fine mousse and citrus brioche notes.", 3200, 21.3, 16.0, "drinks", "Champagne"),
    ("Dom Perignon Vintage", "Iconic prestige cuvee with remarkable depth and mineral length.", 7000, 46.7, 35.0, "drinks", "Champagne"),
    ("Veuve Clicquot Yellow Label", "Structured champagne with ripe fruit and toasted complexity.", 4500, 30.0, 22.5, "drinks", "Champagne"),
    ("Laurent-Perrier La Cuvee", "Lifted style champagne with bright fruit and elegant bubbles.", 4200, 28.0, 21.0, "drinks", "Champagne"),
    ("Taittinger Brut Reserve", "Chardonnay-led champagne with finesse and creamy persistence.", 4000, 26.7, 20.0, "drinks", "Champagne"),
    ("Bollinger Special Cuvee", "Rich and vinous champagne with depth and refined power.", 4800, 32.0, 24.0, "drinks", "Champagne"),
    ("Piper-Heidsieck Cuvee Brut", "Energetic champagne with citrus precision and modern profile.", 3800, 25.3, 19.0, "drinks", "Champagne"),
    ("Nicolas Feuillatte Brut Reserve", "Balanced champagne with floral notes and gentle toast.", 3600, 24.0, 18.0, "drinks", "Champagne"),

    # DRINKS -> Beers
    ("Heineken", "Premium Dutch lager with clean bitterness and crisp finish.", 700, 4.7, 3.5, "drinks", "Beers"),
    ("Budweiser", "Smooth American lager with light malt body and easy drinkability.", 600, 4.0, 3.0, "drinks", "Beers"),
    ("Corona Extra", "Bright Mexican lager served chilled with a clean citrus edge.", 700, 4.7, 3.5, "drinks", "Beers"),
    ("Carlsberg Pilsner", "Balanced Danish pilsner with soft malt and floral hop notes.", 600, 4.0, 3.0, "drinks", "Beers"),
    ("Kingfisher Premium", "Classic Indian lager with lively carbonation and dry finish.", 600, 4.0, 3.0, "drinks", "Beers"),
    ("Tuborg Green", "Crisp continental lager with smooth bitterness and clean profile.", 600, 4.0, 3.0, "drinks", "Beers"),
    ("Stella Artois", "Belgian pilsner with elegant malt sweetness and noble hops.", 800, 5.3, 4.0, "drinks", "Beers"),
    ("Guinness Draught", "Legendary stout with creamy texture and roasted cocoa depth.", 800, 5.3, 4.0, "drinks", "Beers"),

    # DRINKS -> Nepali Drinks (alcoholic only)
    ("Raksi", "Traditional Nepali distilled spirit with bold rustic character.", 600, 4.0, 3.0, "drinks", "Nepali Drinks"),
    ("Aila", "Heritage Newari spirit with aromatic intensity and warming finish.", 800, 5.3, 4.0, "drinks", "Nepali Drinks"),
    ("Khukri Rum", "Nepal's signature dark rum with molasses richness and spice.", 1100, 7.3, 5.5, "drinks", "Nepali Drinks"),
    ("Old Durbar Whisky", "Matured Nepali whisky with mellow oak and soft malt tones.", 1200, 8.0, 6.0, "drinks", "Nepali Drinks"),
    ("Ruslan Vodka", "Locally crafted vodka with a clean palate and smooth finish.", 1100, 7.3, 5.5, "drinks", "Nepali Drinks"),
    ("Golden Oak Whisky", "Full-bodied Nepali whisky with caramel and toasted grain.", 1200, 8.0, 6.0, "drinks", "Nepali Drinks"),
    ("Nepal Ice Beer", "Crisp Nepali lager with bright carbonation and freshness.", 600, 4.0, 3.0, "drinks", "Nepali Drinks"),
    ("Everest Beer", "Refreshing national lager with balanced malt character.", 600, 4.0, 3.0, "drinks", "Nepali Drinks"),

    # DRINKS -> Cocktails
    ("Mojito", "White rum, mint, and lime built for a bright cooling finish.", 1000, 6.7, 5.0, "drinks", "Cocktails"),
    ("Margarita", "Tequila and citrus shaken to an elegant salt-kissed profile.", 1100, 7.3, 5.5, "drinks", "Cocktails"),
    ("Cosmopolitan", "Vodka, cranberry, and orange liqueur in polished tart balance.", 1100, 7.3, 5.5, "drinks", "Cocktails"),
    ("Old Fashioned", "Bourbon stirred with bitters and orange oils for timeless depth.", 1200, 8.0, 6.0, "drinks", "Cocktails"),
    ("Long Island Iced Tea", "A multi-spirit classic finished with citrus and cola sparkle.", 1300, 8.7, 6.5, "drinks", "Cocktails"),
    ("Daiquiri", "Crisp rum sour with fresh lime and restrained sweetness.", 1000, 6.7, 5.0, "drinks", "Cocktails"),
    ("Negroni", "Gin, vermouth, and bitter aperitif in perfect bitter-sweet harmony.", 1200, 8.0, 6.0, "drinks", "Cocktails"),
    ("Martini", "Chilled spirit-forward classic with precise botanical clarity.", 1200, 8.0, 6.0, "drinks", "Cocktails"),

    # DRINKS -> Mocktails
    ("Virgin Mojito", "Mint, lime, and soda layered for a bright non-alcoholic classic.", 500, 3.3, 2.5, "drinks", "Mocktails"),
    ("Fruit Punch", "Seasonal fruit blend with vibrant acidity and gentle sweetness.", 500, 3.3, 2.5, "drinks", "Mocktails"),
    ("Mango Mule", "Mango, ginger, and citrus over ice with sparkling finish.", 600, 4.0, 3.0, "drinks", "Mocktails"),
    ("Sunrise", "Tropical citrus medley with a beautifully layered presentation.", 500, 3.3, 2.5, "drinks", "Mocktails"),
    ("Lemon Iced Tea", "Fresh-brewed tea with lemon brightness and refreshing tannin lift.", 400, 2.7, 2.0, "drinks", "Mocktails"),
    ("Virgin Pina Colada", "Creamy pineapple-coconut cooler with smooth island character.", 600, 4.0, 3.0, "drinks", "Mocktails"),
    ("Shirley Temple", "Sparkling pomegranate-citrus blend with polished sweetness.", 500, 3.3, 2.5, "drinks", "Mocktails"),
    ("Blue Lagoon", "Vibrant citrus cooler with a crisp modern finish.", 600, 4.0, 3.0, "drinks", "Mocktails"),
]

def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        conn.executescript(SCHEMA_SQL)

        columns = [row[1] for row in conn.execute("PRAGMA table_info(menu)").fetchall()]
        if "subcategory" not in columns:
            conn.execute("ALTER TABLE menu ADD COLUMN subcategory TEXT NOT NULL DEFAULT 'Uncategorized'")

        conn.execute("DELETE FROM menu")
        conn.executemany(
            "INSERT INTO menu (name, description, price_nrs, price_usd, price_eur, category, subcategory) VALUES (?, ?, ?, ?, ?, ?, ?)",
            MENU_ITEMS,
        )
        conn.commit()
        print("Database initialized with structured menu.")
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()