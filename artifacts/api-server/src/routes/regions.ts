import { Router } from "express";

export const REGIONS = [
  // GOLD
  { id: "gold-witwatersrand", commodityId: "gold", name: "Witwatersrand Basin", country: "South Africa", lat: -26.2041, lon: 28.0473, type: "mine", shareOfWorld: 11, annualOutput: "100 tonnes", outputUnit: "tonnes/yr", description: "Historically the world's largest gold producing region, responsible for over 40% of all gold ever mined." },
  { id: "gold-nevada", commodityId: "gold", name: "Carlin Trend, Nevada", country: "USA", lat: 40.7753, lon: -116.0769, type: "mine", shareOfWorld: 9, annualOutput: "180 tonnes", outputUnit: "tonnes/yr", description: "The Carlin Trend is the most productive gold mining district in the United States, hosting numerous large open-pit mines." },
  { id: "gold-kalgoorlie", commodityId: "gold", name: "Kalgoorlie Super Pit", country: "Australia", lat: -30.7549, lon: 121.4695, type: "mine", shareOfWorld: 10, annualOutput: "670,000 oz", outputUnit: "oz/yr", description: "One of the world's largest open-pit gold mines, visible from space, located in Western Australia." },
  { id: "gold-krasnoyarsk", commodityId: "gold", name: "Krasnoyarsk Region", country: "Russia", lat: 56.0153, lon: 92.8932, type: "mine", shareOfWorld: 8, annualOutput: "70 tonnes", outputUnit: "tonnes/yr", description: "Russia's richest gold mining region, home to the Olimpiada mine — Russia's largest gold producer." },
  { id: "gold-ghana", commodityId: "gold", name: "Ashanti Gold Belt", country: "Ghana", lat: 6.6885, lon: -1.6244, type: "mine", shareOfWorld: 5, annualOutput: "130 tonnes", outputUnit: "tonnes/yr", description: "Ghana's Ashanti region is Africa's second-largest gold producer, historically significant since the 15th century." },
  { id: "gold-china", commodityId: "gold", name: "Shandong Province", country: "China", lat: 36.6683, lon: 116.9974, type: "mine", shareOfWorld: 13, annualOutput: "370 tonnes", outputUnit: "tonnes/yr", description: "China is the world's largest gold producer. Shandong province houses the densest concentration of gold mines." },

  // SILVER
  { id: "silver-mexico", commodityId: "silver", name: "Fresnillo Silver District", country: "Mexico", lat: 23.1779, lon: -102.8784, type: "mine", shareOfWorld: 23, annualOutput: "6,300 tonnes", outputUnit: "tonnes/yr", description: "Mexico is the world's top silver producer. Fresnillo hosts the world's largest primary silver mine." },
  { id: "silver-peru", commodityId: "silver", name: "Lima Silver Belt", country: "Peru", lat: -11.9890, lon: -76.2440, type: "mine", shareOfWorld: 16, annualOutput: "3,800 tonnes", outputUnit: "tonnes/yr", description: "Peru's central highlands are rich in polymetallic deposits containing significant silver concentrations." },
  { id: "silver-china-inner", commodityId: "silver", name: "Inner Mongolia", country: "China", lat: 44.0935, lon: 113.9448, type: "mine", shareOfWorld: 14, annualOutput: "3,500 tonnes", outputUnit: "tonnes/yr", description: "China is the second-largest silver producer globally, with production concentrated in Inner Mongolia." },
  { id: "silver-russia", commodityId: "silver", name: "Dukat Mine, Magadan", country: "Russia", lat: 60.3500, lon: 154.5167, type: "mine", shareOfWorld: 7, annualOutput: "1,800 tonnes", outputUnit: "tonnes/yr", description: "Dukat is one of the world's largest primary silver mines, located in Russia's remote Magadan region." },

  // PLATINUM
  { id: "platinum-bushveld", commodityId: "platinum", name: "Bushveld Complex", country: "South Africa", lat: -24.9028, lon: 29.4539, type: "mine", shareOfWorld: 72, annualOutput: "130 tonnes", outputUnit: "tonnes/yr", description: "The Bushveld Complex holds the world's largest known platinum group metal reserves, dominating global supply." },
  { id: "platinum-russia-norilsk", commodityId: "platinum", name: "Norilsk", country: "Russia", lat: 69.3558, lon: 88.1893, type: "mine", shareOfWorld: 11, annualOutput: "22 tonnes", outputUnit: "tonnes/yr", description: "Norilsk Nickel is the world's largest producer of nickel and palladium, also a major platinum producer." },

  // PALLADIUM
  { id: "palladium-russia", commodityId: "palladium", name: "Norilsk Nickel Complex", country: "Russia", lat: 69.3558, lon: 88.1893, type: "mine", shareOfWorld: 40, annualOutput: "85 tonnes", outputUnit: "tonnes/yr", description: "Russia dominates global palladium production through the Norilsk Nickel complex." },
  { id: "palladium-sa", commodityId: "palladium", name: "Merensky Reef, Bushveld", country: "South Africa", lat: -25.1000, lon: 29.5000, type: "mine", shareOfWorld: 37, annualOutput: "82 tonnes", outputUnit: "tonnes/yr", description: "South Africa's Bushveld Complex is the world's second-largest palladium producer." },

  // COPPER
  { id: "copper-atacama", commodityId: "copper", name: "Atacama Desert Mines", country: "Chile", lat: -23.8634, lon: -69.0881, type: "mine", shareOfWorld: 28, annualOutput: "5.7M tonnes", outputUnit: "tonnes/yr", description: "Chile's Atacama Desert holds the world's largest copper deposits, with Escondida being the single largest copper mine globally." },
  { id: "copper-peru", commodityId: "copper", name: "Las Bambas, Apurimac", country: "Peru", lat: -14.1500, lon: -72.0833, type: "mine", shareOfWorld: 12, annualOutput: "2.3M tonnes", outputUnit: "tonnes/yr", description: "Peru is the world's second-largest copper producer, with Las Bambas being one of the largest copper mines in the world." },
  { id: "copper-dem-congo", commodityId: "copper", name: "Copperbelt", country: "DRC", lat: -11.0000, lon: 27.5000, type: "mine", shareOfWorld: 10, annualOutput: "2.0M tonnes", outputUnit: "tonnes/yr", description: "The Central African Copperbelt spans DRC and Zambia, containing some of the highest-grade copper ore in the world." },
  { id: "copper-china", commodityId: "copper", name: "Jiangxi Province", country: "China", lat: 27.1610, lon: 115.9102, type: "mine", shareOfWorld: 8, annualOutput: "1.7M tonnes", outputUnit: "tonnes/yr", description: "China is the world's largest consumer and a major producer of copper, with Jiangxi as the primary mining province." },

  // WTI OIL
  { id: "wti-permian", commodityId: "wti", name: "Permian Basin", country: "USA", lat: 31.8457, lon: -102.3676, type: "oilfield", shareOfWorld: 13, annualOutput: "5.7M bbl/day", outputUnit: "bbl/day", description: "The Permian Basin is the most productive US oil basin and a global driver of oil supply. Production has surged due to shale technology." },
  { id: "wti-ghawar", commodityId: "wti", name: "Ghawar Field", country: "Saudi Arabia", lat: 25.1333, lon: 49.0833, type: "oilfield", shareOfWorld: 6, annualOutput: "3.8M bbl/day", outputUnit: "bbl/day", description: "The world's largest conventional oil field, Ghawar has produced more oil than any other field in history." },
  { id: "wti-siberia", commodityId: "wti", name: "West Siberian Basin", country: "Russia", lat: 62.0000, lon: 75.0000, type: "oilfield", shareOfWorld: 11, annualOutput: "5.0M bbl/day", outputUnit: "bbl/day", description: "Russia's West Siberian Basin is one of the world's largest petroleum-bearing provinces." },
  { id: "wti-nigeria", commodityId: "wti", name: "Niger Delta", country: "Nigeria", lat: 4.8593, lon: 6.9919, type: "oilfield", shareOfWorld: 2.5, annualOutput: "1.3M bbl/day", outputUnit: "bbl/day", description: "The Niger Delta is Africa's largest oil-producing region, though output is constrained by security issues and infrastructure challenges." },

  // BRENT OIL
  { id: "brent-north-sea", commodityId: "brent", name: "North Sea Fields", country: "UK/Norway", lat: 57.8000, lon: 2.5000, type: "oilfield", shareOfWorld: 3, annualOutput: "3.0M bbl/day", outputUnit: "bbl/day", description: "The North Sea oil fields, straddling UK and Norwegian waters, gave their name to Brent crude — the global oil price benchmark." },
  { id: "brent-uae", commodityId: "brent", name: "Abu Dhabi Oil Fields", country: "UAE", lat: 23.5000, lon: 53.5000, type: "oilfield", shareOfWorld: 5.5, annualOutput: "3.0M bbl/day", outputUnit: "bbl/day", description: "The UAE's Abu Dhabi holds 6% of world's proven oil reserves, including the giant Murban and Bu Hasa fields." },
  { id: "brent-kuwait", commodityId: "brent", name: "Burgan Field, Kuwait", country: "Kuwait", lat: 29.0000, lon: 47.8000, type: "oilfield", shareOfWorld: 7, annualOutput: "2.5M bbl/day", outputUnit: "bbl/day", description: "Greater Burgan is the world's second-largest oil field and Kuwait's main source of petroleum revenue." },

  // NATURAL GAS
  { id: "natgas-south-pars", commodityId: "natgas", name: "South Pars / North Dome", country: "Iran/Qatar", lat: 26.8000, lon: 52.0000, type: "reserve", shareOfWorld: 19, annualOutput: "580 bcm", outputUnit: "bcm/yr", description: "The world's largest natural gas field, shared between Iran (South Pars) and Qatar (North Dome), holding nearly 20% of global proven reserves." },
  { id: "natgas-russia", commodityId: "natgas", name: "Urengoy Gas Field", country: "Russia", lat: 65.9667, lon: 78.3500, type: "oilfield", shareOfWorld: 14, annualOutput: "290 bcm", outputUnit: "bcm/yr", description: "The Urengoy gas field is the world's second-largest natural gas field, a cornerstone of Russia's energy exports." },
  { id: "natgas-marcellus", commodityId: "natgas", name: "Marcellus Shale", country: "USA", lat: 41.2033, lon: -77.1945, type: "reserve", shareOfWorld: 7, annualOutput: "110 bcm", outputUnit: "bcm/yr", description: "The Marcellus Shale is the largest natural gas field in the US and one of the largest in the world, responsible for the US shale gas revolution." },

  // WHEAT
  { id: "wheat-china", commodityId: "wheat", name: "North China Plain", country: "China", lat: 35.8617, lon: 104.1954, type: "farm", shareOfWorld: 17, annualOutput: "136M tonnes", outputUnit: "tonnes/yr", description: "China is the world's largest wheat producer. The North China Plain, watered by the Yellow River, is the primary wheat-growing region." },
  { id: "wheat-india", commodityId: "wheat", name: "Punjab & Haryana", country: "India", lat: 30.9010, lon: 75.8573, type: "farm", shareOfWorld: 13, annualOutput: "108M tonnes", outputUnit: "tonnes/yr", description: "India's 'breadbasket' states of Punjab and Haryana dominate wheat production, integral to India's food security." },
  { id: "wheat-russia", commodityId: "wheat", name: "Southern Russia Steppes", country: "Russia", lat: 51.0000, lon: 46.0000, type: "farm", shareOfWorld: 12, annualOutput: "92M tonnes", outputUnit: "tonnes/yr", description: "Russia's Black Earth region and southern steppes make it one of the world's top wheat exporters." },
  { id: "wheat-kansas", commodityId: "wheat", name: "Great Plains, Kansas", country: "USA", lat: 38.5266, lon: -96.7265, type: "farm", shareOfWorld: 9, annualOutput: "49M tonnes", outputUnit: "tonnes/yr", description: "Kansas — 'the Wheat State' — sits at the heart of the US Great Plains, the world's most productive winter wheat zone." },
  { id: "wheat-ukraine", commodityId: "wheat", name: "Ukrainian Black Earth", country: "Ukraine", lat: 48.3794, lon: 31.1656, type: "farm", shareOfWorld: 6, annualOutput: "33M tonnes", outputUnit: "tonnes/yr", description: "Ukraine's fertile black-earth (chernozem) soils have made it a top-5 global wheat exporter, critical to food security in the Middle East and Africa." },

  // CORN
  { id: "corn-iowa", commodityId: "corn", name: "US Corn Belt", country: "USA", lat: 42.0046, lon: -93.2140, type: "farm", shareOfWorld: 33, annualOutput: "384M tonnes", outputUnit: "tonnes/yr", description: "The US Corn Belt, centered on Iowa and Illinois, is the world's most productive corn-growing region, supplying animal feed and ethanol globally." },
  { id: "corn-brazil", commodityId: "corn", name: "Mato Grosso, Brazil", country: "Brazil", lat: -12.6400, lon: -55.4245, type: "farm", shareOfWorld: 9, annualOutput: "116M tonnes", outputUnit: "tonnes/yr", description: "Brazil has become the world's second-largest corn exporter, with Mato Grosso state driving rapid production growth." },
  { id: "corn-china-northeast", commodityId: "corn", name: "Northeast China Plains", country: "China", lat: 43.9170, lon: 125.3290, type: "farm", shareOfWorld: 20, annualOutput: "273M tonnes", outputUnit: "tonnes/yr", description: "China's northeastern provinces form the world's second-largest corn production zone after the US Corn Belt." },

  // SOYBEANS
  { id: "soybeans-brazil", commodityId: "soybeans", name: "Mato Grosso, Brazil", country: "Brazil", lat: -12.6400, lon: -55.4245, type: "farm", shareOfWorld: 37, annualOutput: "154M tonnes", outputUnit: "tonnes/yr", description: "Brazil is now the world's largest soybean producer. Mato Grosso alone accounts for nearly 30% of Brazilian output." },
  { id: "soybeans-us", commodityId: "soybeans", name: "US Midwest Soy Belt", country: "USA", lat: 40.0000, lon: -91.0000, type: "farm", shareOfWorld: 31, annualOutput: "124M tonnes", outputUnit: "tonnes/yr", description: "The US Midwest, particularly Illinois and Iowa, forms the core of North American soybean production." },
  { id: "soybeans-argentina", commodityId: "soybeans", name: "Pampas, Argentina", country: "Argentina", lat: -34.6036, lon: -58.3816, type: "farm", shareOfWorld: 12, annualOutput: "49M tonnes", outputUnit: "tonnes/yr", description: "Argentina's fertile Pampas region is the world's third-largest soybean producer and largest exporter of soybean meal and oil." },

  // RICE
  { id: "rice-yangtze", commodityId: "rice", name: "Yangtze River Delta", country: "China", lat: 30.5928, lon: 114.3055, type: "farm", shareOfWorld: 27, annualOutput: "212M tonnes", outputUnit: "tonnes/yr", description: "China is the world's largest rice producer. The fertile lands along the Yangtze River have been cultivated for rice for thousands of years." },
  { id: "rice-india", commodityId: "rice", name: "Ganges Delta", country: "India", lat: 22.3511, lon: 87.1158, type: "farm", shareOfWorld: 22, annualOutput: "172M tonnes", outputUnit: "tonnes/yr", description: "India is the world's largest rice exporter. The Ganges-Brahmaputra delta provides ideal conditions for multiple rice harvests per year." },
  { id: "rice-indonesia", commodityId: "rice", name: "Java Island", country: "Indonesia", lat: -6.2088, lon: 106.8456, type: "farm", shareOfWorld: 8, annualOutput: "55M tonnes", outputUnit: "tonnes/yr", description: "Java, Indonesia's most densely populated island, is a major rice-producing region with centuries of terraced paddy culture." },
  { id: "rice-mekong", commodityId: "rice", name: "Mekong Delta", country: "Vietnam", lat: 10.0452, lon: 105.7469, type: "farm", shareOfWorld: 6, annualOutput: "43M tonnes", outputUnit: "tonnes/yr", description: "Vietnam's Mekong Delta is known as the 'rice bowl' of Southeast Asia, producing multiple crops per year and vital for export." },

  // COCOA
  { id: "cocoa-ivory-coast", commodityId: "cocoa", name: "Ivory Coast Belt", country: "Ivory Coast", lat: 6.8276, lon: -5.2893, type: "farm", shareOfWorld: 44, annualOutput: "2.2M tonnes", outputUnit: "tonnes/yr", description: "Ivory Coast is the world's largest cocoa producer by a wide margin. The country's climate is ideal for cacao cultivation." },
  { id: "cocoa-ghana", commodityId: "cocoa", name: "Ashanti Cocoa Belt", country: "Ghana", lat: 7.9465, lon: -1.0232, type: "farm", shareOfWorld: 15, annualOutput: "800K tonnes", outputUnit: "tonnes/yr", description: "Ghana is the second-largest cocoa producer globally, known for premium-quality beans." },
  { id: "cocoa-indonesia", commodityId: "cocoa", name: "Sulawesi Island", country: "Indonesia", lat: -1.4300, lon: 121.4456, type: "farm", shareOfWorld: 10, annualOutput: "500K tonnes", outputUnit: "tonnes/yr", description: "Indonesia is the third-largest cocoa producer, with most production concentrated on Sulawesi island." },
  { id: "cocoa-ecuador", commodityId: "cocoa", name: "Coastal Ecuador", country: "Ecuador", lat: -1.8312, lon: -78.1834, type: "farm", shareOfWorld: 7, annualOutput: "290K tonnes", outputUnit: "tonnes/yr", description: "Ecuador produces premium fine-flavor cacao, the 'Arriba Nacional' variety, prized by high-end chocolate makers worldwide." },

  // COFFEE
  { id: "coffee-brazil", commodityId: "coffee", name: "Minas Gerais, Brazil", country: "Brazil", lat: -19.9191, lon: -43.9386, type: "farm", shareOfWorld: 38, annualOutput: "3.8M tonnes", outputUnit: "tonnes/yr", description: "Brazil is the world's largest coffee producer, growing both Arabica and Robusta, with Minas Gerais state producing the most coffee." },
  { id: "coffee-vietnam", commodityId: "coffee", name: "Central Highlands", country: "Vietnam", lat: 12.0674, lon: 108.2109, type: "farm", shareOfWorld: 19, annualOutput: "1.8M tonnes", outputUnit: "tonnes/yr", description: "Vietnam is the world's second-largest coffee producer and largest Robusta exporter, with the Central Highlands as the production heartland." },
  { id: "coffee-colombia", commodityId: "coffee", name: "Coffee Triangle (Eje Cafetero)", country: "Colombia", lat: 5.0000, lon: -75.5000, type: "farm", shareOfWorld: 8, annualOutput: "860K tonnes", outputUnit: "tonnes/yr", description: "Colombia's Coffee Triangle, blessed by altitude and climate, produces premium washed Arabica coffee celebrated worldwide." },
  { id: "coffee-ethiopia", commodityId: "coffee", name: "Yirgacheffe & Sidamo", country: "Ethiopia", lat: 6.1300, lon: 38.2000, type: "farm", shareOfWorld: 4, annualOutput: "480K tonnes", outputUnit: "tonnes/yr", description: "Ethiopia is the birthplace of coffee. Regions like Yirgacheffe and Sidamo produce prized single-origin beans with unique berry and floral notes." },

  // SUGAR
  { id: "sugar-sao-paulo", commodityId: "sugar", name: "Sao Paulo State", country: "Brazil", lat: -22.9068, lon: -43.1729, type: "farm", shareOfWorld: 26, annualOutput: "41M tonnes", outputUnit: "tonnes/yr", description: "Brazil dominates global sugar production and exports. The state of São Paulo is the world's single largest sugarcane producer." },
  { id: "sugar-india-up", commodityId: "sugar", name: "Uttar Pradesh", country: "India", lat: 26.8467, lon: 80.9462, type: "farm", shareOfWorld: 20, annualOutput: "36M tonnes", outputUnit: "tonnes/yr", description: "India is the world's second-largest sugar producer. Uttar Pradesh alone accounts for over 40% of India's sugarcane production." },
  { id: "sugar-thailand", commodityId: "sugar", name: "Central Thailand", country: "Thailand", lat: 13.7563, lon: 100.5018, type: "farm", shareOfWorld: 8, annualOutput: "10M tonnes", outputUnit: "tonnes/yr", description: "Thailand is a major sugar exporter, with extensive sugarcane cultivation in the central and northeastern regions." },

  // COTTON
  { id: "cotton-xinjiang", commodityId: "cotton", name: "Xinjiang Province", country: "China", lat: 41.1129, lon: 85.2401, type: "farm", shareOfWorld: 22, annualOutput: "6.4M tonnes", outputUnit: "tonnes/yr", description: "China's Xinjiang province produces over 85% of China's cotton and is one of the world's most important cotton-growing regions." },
  { id: "cotton-india", commodityId: "cotton", name: "Gujarat & Maharashtra", country: "India", lat: 22.3039, lon: 70.8022, type: "farm", shareOfWorld: 24, annualOutput: "6.6M tonnes", outputUnit: "tonnes/yr", description: "India is the world's largest cotton producer, with Gujarat and Maharashtra accounting for a significant share of national output." },
  { id: "cotton-texas", commodityId: "cotton", name: "Texas High Plains", country: "USA", lat: 33.5779, lon: -101.8552, type: "farm", shareOfWorld: 14, annualOutput: "4.4M tonnes", outputUnit: "tonnes/yr", description: "The Texas High Plains, centering on the Lubbock area, is the single largest cotton-producing region in the United States." },
];

const router = Router();

router.get("/", (req, res) => {
  const { commodityId } = req.query as { commodityId?: string };
  const filtered = commodityId
    ? REGIONS.filter((r) => r.commodityId === commodityId)
    : REGIONS;
  res.json(filtered);
});

export default router;
