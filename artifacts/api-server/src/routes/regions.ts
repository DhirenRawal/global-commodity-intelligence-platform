import { Router } from "express";

// ---------------------------------------------------------------------------
// Commodity metadata
//   globalProduction: annual total in the commodity's native unit
//   unit: human-readable unit string
//   priceMultiplier: multiplies native production unit → Yahoo Finance price unit
//     Gold/Silver/Platinum/Palladium: tonnes → troy oz  (×32,150.7)
//     Copper: tonnes → lb  (×2,204.623)
//     WTI/Brent: bbl/day → bbl/yr  (×365)
//     NatGas: bcm/yr → MMBtu/yr  (×35,314,666)
//     Wheat/Soybeans: tonnes → bu  (×36.744)
//     Corn: tonnes → bu  (×39.368)
//     Rice: tonnes → cwt  (×22.046)
//     Cocoa: tonnes = MT  (×1)
//     Coffee/Sugar/Cotton: tonnes → lb  (×2,204.623)
// ---------------------------------------------------------------------------
const COMMODITY_META: Record<string, { globalProduction: number; unit: string; priceMultiplier: number }> = {
  gold:      { globalProduction: 3700,          unit: "tonnes/yr",  priceMultiplier: 32150.7      },
  silver:    { globalProduction: 26000,         unit: "tonnes/yr",  priceMultiplier: 32150.7      },
  platinum:  { globalProduction: 190,           unit: "tonnes/yr",  priceMultiplier: 32150.7      },
  palladium: { globalProduction: 210,           unit: "tonnes/yr",  priceMultiplier: 32150.7      },
  copper:    { globalProduction: 21000000,      unit: "tonnes/yr",  priceMultiplier: 2204.623     },
  wti:       { globalProduction: 100000000,     unit: "bbl/day",    priceMultiplier: 365          },
  brent:     { globalProduction: 100000000,     unit: "bbl/day",    priceMultiplier: 365          },
  natgas:    { globalProduction: 4100,          unit: "bcm/yr",     priceMultiplier: 35314666     },
  wheat:     { globalProduction: 780000000,     unit: "tonnes/yr",  priceMultiplier: 36.744       },
  corn:      { globalProduction: 1150000000,    unit: "tonnes/yr",  priceMultiplier: 39.368       },
  soybeans:  { globalProduction: 390000000,     unit: "tonnes/yr",  priceMultiplier: 36.744       },
  rice:      { globalProduction: 790000000,     unit: "tonnes/yr",  priceMultiplier: 22.046       },
  cocoa:     { globalProduction: 5000000,       unit: "MT/yr",      priceMultiplier: 1            },
  coffee:    { globalProduction: 10500000,      unit: "tonnes/yr",  priceMultiplier: 2204.623     },
  sugar:     { globalProduction: 185000000,     unit: "tonnes/yr",  priceMultiplier: 2204.623     },
  cotton:    { globalProduction: 25000000,      unit: "tonnes/yr",  priceMultiplier: 2204.623     },
};

// ---------------------------------------------------------------------------
// Raw producers — production is in the commodity's native unit (see above)
// ---------------------------------------------------------------------------
const RAW_PRODUCERS: {
  commodityId: string; name: string; country: string;
  lat: number; lon: number; type: string;
  production: number; taxRate: number; description: string;
}[] = [

  // =========================================================================
  // GOLD — global: ~3,700 t/yr (World Gold Council 2023)
  // =========================================================================
  { commodityId: "gold", name: "Shandong & Qinghai Belt",      country: "China",        lat: 37.5,   lon: 119.5,   type: "mine",    production: 380,  taxRate: 0,  description: "China is the world's largest gold producer. Shandong and Qinghai provinces host the densest concentration of gold mines." },
  { commodityId: "gold", name: "Siberia & Chukotka",           country: "Russia",       lat: 64.0,   lon: 112.0,   type: "mine",    production: 310,  taxRate: 6,  description: "Russia's vast Siberian and Far East gold fields, anchored by Polyus's Olimpiada and Blagodatnoye mines." },
  { commodityId: "gold", name: "Western Australia",            country: "Australia",    lat: -30.7,  lon: 121.5,   type: "mine",    production: 310,  taxRate: 2,  description: "The Kalgoorlie Super Pit and surrounding Goldfields region make Western Australia the world's third-largest gold producer." },
  { commodityId: "gold", name: "Ontario & Quebec Shield",      country: "Canada",       lat: 48.5,   lon: -81.3,   type: "mine",    production: 200,  taxRate: 0,  description: "Canada's Canadian Shield hosts prolific gold camps including Timmins, Kirkland Lake, and Red Lake." },
  { commodityId: "gold", name: "Nevada Carlin Trend",          country: "USA",          lat: 40.8,   lon: -116.1,  type: "mine",    production: 170,  taxRate: 0,  description: "Nevada's Carlin, Battle Mountain, and Cortez trends are the most productive gold districts in the United States." },
  { commodityId: "gold", name: "Ashanti Gold Belt",            country: "Ghana",        lat: 6.7,    lon: -1.6,    type: "mine",    production: 130,  taxRate: 5,  description: "Ghana is Africa's top gold producer. The Ashanti Belt hosts major mines including Ahafo, Akyem, and Obuasi." },
  { commodityId: "gold", name: "Sonora-Durango Corridor",      country: "Mexico",       lat: 25.0,   lon: -108.0,  type: "mine",    production: 125,  taxRate: 0,  description: "Mexico's northern states of Sonora and Durango hold significant gold-silver polymetallic deposits." },
  { commodityId: "gold", name: "North Kazakhstan Steppes",     country: "Kazakhstan",   lat: 52.0,   lon: 71.0,    type: "mine",    production: 100,  taxRate: 8,  description: "Kazakhstan's Altyn-Emel and Vasilkovsky deposits make it a top-10 global gold producer." },
  { commodityId: "gold", name: "Navoi Region",                 country: "Uzbekistan",   lat: 40.5,   lon: 65.5,    type: "mine",    production: 100,  taxRate: 10, description: "The Muruntau mine in Uzbekistan's Navoi region is one of the world's largest open-pit gold mines." },
  { commodityId: "gold", name: "Witwatersrand Basin",          country: "South Africa", lat: -26.2,  lon: 28.0,    type: "mine",    production: 90,   taxRate: 10, description: "Once the world's dominant gold source, Witwatersrand still produces significant tonnage from deep-level mines." },
  { commodityId: "gold", name: "Cajamarca & La Libertad",      country: "Peru",         lat: -7.2,   lon: -78.5,   type: "mine",    production: 95,   taxRate: 4,  description: "Peru's Yanacocha and La Arena mines in the northern Andes are among the most productive in Latin America." },
  { commodityId: "gold", name: "Grasberg & Martabe",           country: "Indonesia",    lat: -4.1,   lon: 137.1,   type: "mine",    production: 90,   taxRate: 10, description: "Freeport's Grasberg complex in Papua is the world's largest gold mine by reserves, alongside Sumatra's Martabe." },
  { commodityId: "gold", name: "Pará & Minas Gerais",          country: "Brazil",       lat: -5.5,   lon: -51.0,   type: "mine",    production: 90,   taxRate: 0,  description: "Brazil's Amazon state of Pará hosts the Serra Pelada legacy and modern Serra Norte complex operated by Vale." },
  { commodityId: "gold", name: "Northern State",               country: "Sudan",        lat: 19.0,   lon: 32.0,    type: "mine",    production: 75,   taxRate: 15, description: "Artisanal and small-scale miners in Sudan's northern desert make it a surprising top-15 global gold producer." },
  { commodityId: "gold", name: "Lihir & Porgera Mines",        country: "Papua New Guinea", lat: -5.5, lon: 143.5, type: "mine",  production: 60,   taxRate: 2,  description: "PNG's Lihir Island and Porgera Valley host world-class gold deposits managed by Newcrest and Barrick." },
  { commodityId: "gold", name: "Loulo-Gounkoto Complex",       country: "Mali",         lat: 13.5,   lon: -11.0,   type: "mine",    production: 70,   taxRate: 6,  description: "Barrick's Loulo-Gounkoto complex in western Mali is one of the largest gold mines in West Africa." },
  { commodityId: "gold", name: "Geita & North Mara",           country: "Tanzania",     lat: -2.8,   lon: 32.2,    type: "mine",    production: 50,   taxRate: 6,  description: "AngloGold's Geita mine and Barrick's North Mara are Tanzania's flagship gold operations." },
  { commodityId: "gold", name: "Essakane & Bissa-Bouly",       country: "Burkina Faso", lat: 13.5,   lon: -1.5,    type: "mine",    production: 50,   taxRate: 5,  description: "Despite political instability, Burkina Faso remains a significant West African gold producer." },
  { commodityId: "gold", name: "Kibali & Kilo-Moto",           country: "DRC",          lat: 3.0,    lon: 29.5,    type: "mine",    production: 55,   taxRate: 10, description: "Kibali is one of Africa's largest gold mines and the DRC's most important formal mining operation." },
  { commodityId: "gold", name: "Chocó & Antioquia",            country: "Colombia",     lat: 5.5,    lon: -76.9,   type: "mine",    production: 40,   taxRate: 0,  description: "Colombia has a long gold-mining history. Chocó and Antioquia together account for most of its output." },
  { commodityId: "gold", name: "Maricunga & Atacama",          country: "Chile",        lat: -26.5,  lon: -69.3,   type: "mine",    production: 40,   taxRate: 5,  description: "Chile's high-altitude Atacama and Maricunga belts host significant gold-copper porphyry deposits." },
  { commodityId: "gold", name: "Kumtor Mine, Tian Shan",       country: "Kyrgyzstan",   lat: 41.0,   lon: 78.2,    type: "mine",    production: 25,   taxRate: 5,  description: "Centerra's Kumtor is one of the largest gold mines in Central Asia, operating at 4,000 metres altitude." },
  { commodityId: "gold", name: "Kwekwe & Midlands Belt",       country: "Zimbabwe",     lat: -18.9,  lon: 29.8,    type: "mine",    production: 35,   taxRate: 5,  description: "Zimbabwe has a long mining heritage, with artisanal and large-scale mines in the Midlands greenstone belt." },
  { commodityId: "gold", name: "Salave'a & Amayapua",          country: "Philippines",  lat: 7.2,    lon: 125.2,   type: "mine",    production: 25,   taxRate: 5,  description: "The Philippines hosts significant epithermal gold deposits on Mindanao and in the Cordillera region." },
  { commodityId: "gold", name: "Oyu Tolgoi & Gatsuurt",        country: "Mongolia",     lat: 43.0,   lon: 106.9,   type: "mine",    production: 25,   taxRate: 5,  description: "Mongolia's Oyu Tolgoi (jointly with copper) and several smaller deposits contribute to growing gold output." },

  // =========================================================================
  // SILVER — global: ~26,000 t/yr (Silver Institute 2023)
  // =========================================================================
  { commodityId: "silver", name: "Fresnillo & Zacatecas",      country: "Mexico",       lat: 23.2,   lon: -102.9,  type: "mine",    production: 6300, taxRate: 0,  description: "Mexico is the world's top silver producer. Fresnillo hosts the world's largest primary silver mine." },
  { commodityId: "silver", name: "Lima & Junín Highlands",     country: "Peru",         lat: -11.9,  lon: -76.2,   type: "mine",    production: 3800, taxRate: 4,  description: "Peru's Antamina, Buenaventura, and Hochschild mines make it a top-3 global silver producer." },
  { commodityId: "silver", name: "Inner Mongolia & Yunnan",    country: "China",        lat: 44.1,   lon: 113.9,   type: "mine",    production: 3500, taxRate: 0,  description: "China is the world's second-largest silver producer, with output spread across Inner Mongolia and Yunnan." },
  { commodityId: "silver", name: "Atacama Desert Mines",       country: "Chile",        lat: -23.9,  lon: -69.1,   type: "mine",    production: 1300, taxRate: 5,  description: "Chile's copper porphyry deposits yield significant silver as a byproduct from mines like Collahuasi and Escondida." },
  { commodityId: "silver", name: "Coeur & Hecla Mines",        country: "USA",          lat: 47.5,   lon: -115.9,  type: "mine",    production: 1100, taxRate: 0,  description: "Idaho's Coeur d'Alene silver belt and Nevada operations are the primary US silver-producing districts." },
  { commodityId: "silver", name: "Dukat & Khakanja",           country: "Russia",       lat: 60.4,   lon: 154.5,   type: "mine",    production: 1800, taxRate: 6,  description: "Dukat is one of the world's largest primary silver mines, located in Russia's remote Magadan region." },
  { commodityId: "silver", name: "Cerro de Pasco & Potosí",    country: "Bolivia",      lat: -19.6,  lon: -65.7,   type: "mine",    production: 1300, taxRate: 5,  description: "Bolivia's historic Potosí silver mines remain significant, alongside modern polymetallic operations." },
  { commodityId: "silver", name: "Greens Creek & Lucky Friday", country: "USA",         lat: 57.5,   lon: -134.9,  type: "mine",    production: 600,  taxRate: 0,  description: "Alaska's Greens Creek is one of the world's largest primary silver mines, operated by Hecla Mining." },
  { commodityId: "silver", name: "New South Wales Silver",     country: "Australia",    lat: -33.9,  lon: 141.5,   type: "mine",    production: 1700, taxRate: 2,  description: "Australia's Cannington and Broken Hill mines contribute substantially to global silver supply." },
  { commodityId: "silver", name: "Sinaloa & Sonora Belt",      country: "Mexico",       lat: 25.5,   lon: -107.5,  type: "mine",    production: 900,  taxRate: 0,  description: "Secondary silver operations in Sinaloa and Sonora supplement Mexico's world-leading silver output." },
  { commodityId: "silver", name: "Pirquitas & Andes Belt",     country: "Argentina",    lat: -22.7,  lon: -66.5,   type: "mine",    production: 450,  taxRate: 0,  description: "Argentina's northwest Andes host significant silver-rich polymetallic deposits." },
  { commodityId: "silver", name: "Cobalt & Northern Ontario",  country: "Canada",       lat: 47.4,   lon: -79.7,   type: "mine",    production: 500,  taxRate: 0,  description: "Ontario's Cobalt camp and newer Ontario mines contribute to Canada's byproduct silver production." },

  // =========================================================================
  // PLATINUM — global: ~190 t/yr (World Platinum Investment Council 2023)
  // =========================================================================
  { commodityId: "platinum", name: "Bushveld Complex",         country: "South Africa", lat: -24.9,  lon: 29.5,    type: "mine",    production: 130,  taxRate: 10, description: "The Bushveld Complex holds ~75% of world platinum reserves. Anglo American Platinum, Impala, and Sibanye operate here." },
  { commodityId: "platinum", name: "Norilsk Complex",          country: "Russia",       lat: 69.4,   lon: 88.2,    type: "mine",    production: 22,   taxRate: 6,  description: "Norilsk Nickel's Siberian smelter complex is the world's second-largest platinum and palladium producer." },
  { commodityId: "platinum", name: "Stillwater Mine, Montana", country: "USA",          lat: 45.3,   lon: -109.9,  type: "mine",    production: 14,   taxRate: 0,  description: "Sibanye-Stillwater's Montana operations are the only primary platinum group metal mine in North America." },
  { commodityId: "platinum", name: "Great Dyke, Zimbabwe",     country: "Zimbabwe",     lat: -18.0,  lon: 30.0,    type: "mine",    production: 14,   taxRate: 5,  description: "Zimbabwe's Great Dyke is a world-class platinum-group metal deposit, mined by Zimplats and Unki." },
  { commodityId: "platinum", name: "Lac des Iles, Ontario",    country: "Canada",       lat: 49.8,   lon: -90.0,   type: "mine",    production: 7,    taxRate: 0,  description: "North American Palladium's Lac des Iles mine in Ontario is Canada's only primary platinum producer." },

  // =========================================================================
  // PALLADIUM — global: ~210 t/yr (2023 estimate)
  // =========================================================================
  { commodityId: "palladium", name: "Norilsk Nickel Complex",  country: "Russia",       lat: 69.4,   lon: 88.2,    type: "mine",    production: 85,   taxRate: 6,  description: "Russia produces ~40% of global palladium through the world's largest nickel-palladium complex." },
  { commodityId: "palladium", name: "Merensky Reef, Bushveld", country: "South Africa", lat: -25.1,  lon: 29.5,    type: "mine",    production: 80,   taxRate: 10, description: "South Africa's Bushveld Complex is the world's second-largest palladium source." },
  { commodityId: "palladium", name: "Stillwater Mine, Montana",country: "USA",          lat: 45.3,   lon: -109.9,  type: "mine",    production: 20,   taxRate: 0,  description: "Sibanye-Stillwater's Stillwater and East Boulder mines are the primary North American palladium source." },
  { commodityId: "palladium", name: "Great Dyke, Zimbabwe",    country: "Zimbabwe",     lat: -18.0,  lon: 30.0,    type: "mine",    production: 14,   taxRate: 5,  description: "Zimbabwe's Great Dyke is gaining prominence as a palladium-rich alternative to the depleting Bushveld." },
  { commodityId: "palladium", name: "Lac des Iles, Ontario",   country: "Canada",       lat: 49.8,   lon: -90.0,   type: "mine",    production: 8,    taxRate: 0,  description: "Canada's primary palladium mine, located near Thunder Bay in Northwestern Ontario." },

  // =========================================================================
  // COPPER — global: ~21,000,000 t/yr (USGS/ICSG 2023)
  // =========================================================================
  { commodityId: "copper", name: "Atacama Desert Mines",       country: "Chile",        lat: -23.9,  lon: -69.1,   type: "mine",    production: 5700000, taxRate: 5, description: "Chile produces 28% of world copper. Escondida alone is the world's single largest copper mine." },
  { commodityId: "copper", name: "Cerro Verde & Antamina",     country: "Peru",         lat: -16.5,  lon: -71.4,   type: "mine",    production: 2800000, taxRate: 4, description: "Peru's Cerro Verde, Antamina, and Las Bambas form one of the most productive copper districts on Earth." },
  { commodityId: "copper", name: "Democratic Republic of Congo", country: "DRC",        lat: -11.0,  lon: 27.5,    type: "mine",    production: 2400000, taxRate: 10, description: "The Central African Copperbelt hosts ultra-high grade deposits. Production growth has been dramatic since 2020." },
  { commodityId: "copper", name: "Zambian Copperbelt",         country: "Zambia",       lat: -13.0,  lon: 28.0,    type: "mine",    production: 800000,  taxRate: 8, description: "Zambia has been a major copper producer since the 1920s. First Quantum and Vedanta operate the main mines." },
  { commodityId: "copper", name: "Jiangxi & Qinghai Province", country: "China",        lat: 27.2,   lon: 115.9,   type: "mine",    production: 1800000, taxRate: 0, description: "China mines significant domestic copper, though it is also the world's largest copper importer." },
  { commodityId: "copper", name: "Morenci & Bingham Canyon",   country: "USA",          lat: 33.0,   lon: -109.4,  type: "mine",    production: 1200000, taxRate: 0, description: "Freeport's Morenci in Arizona and Rio Tinto's Bingham Canyon in Utah are the USA's flagship copper mines." },
  { commodityId: "copper", name: "Olympic Dam & Mount Isa",    country: "Australia",    lat: -30.4,  lon: 136.9,   type: "mine",    production: 950000,  taxRate: 2, description: "BHP's Olympic Dam is a unique polymetallic deposit containing copper, uranium, gold, and silver." },
  { commodityId: "copper", name: "Udokan & Zhezkazgan",        country: "Russia",       lat: 56.7,   lon: 118.5,   type: "mine",    production: 900000,  taxRate: 0, description: "Russia's Udokan (Baikal Mining) and Kazakhstan's Zhezkazgan are major copper producers." },
  { commodityId: "copper", name: "Chuquicamata & El Teniente", country: "Chile",        lat: -22.3,  lon: -68.9,   type: "mine",    production: 700000,  taxRate: 5, description: "Codelco's Chuquicamata and El Teniente mines have operated for over a century and are among the world's deepest." },
  { commodityId: "copper", name: "Aktogay & Bozshakol",        country: "Kazakhstan",   lat: 47.0,   lon: 80.0,    type: "mine",    production: 500000,  taxRate: 8, description: "Kazakhstan has rapidly grown copper output through KAZ Minerals' modern open-pit operations." },
  { commodityId: "copper", name: "Salobo & Carajás Complex",   country: "Brazil",       lat: -6.0,   lon: -50.5,   type: "mine",    production: 500000,  taxRate: 0, description: "Vale's Carajás copper project in Pará is one of the world's largest underdeveloped copper resources." },
  { commodityId: "copper", name: "Toquepala & Cuajone",        country: "Mexico",       lat: 27.5,   lon: -110.0,  type: "mine",    production: 750000,  taxRate: 0, description: "Southern Copper's Mexican operations, including La Caridad, make Mexico a top-10 copper producer." },
  { commodityId: "copper", name: "Grasberg & Batu Hijau",      country: "Indonesia",    lat: -4.1,   lon: 137.1,   type: "mine",    production: 800000,  taxRate: 10, description: "Freeport's Grasberg mine in Papua is one of the world's largest copper-gold deposits." },

  // =========================================================================
  // WTI CRUDE OIL — global: ~100M bbl/day (IEA 2023, production in bbl/day)
  // =========================================================================
  { commodityId: "wti", name: "Permian Basin",                 country: "USA",          lat: 31.8,   lon: -102.4,  type: "oilfield", production: 5700000,  taxRate: 0,  description: "The Permian is the most productive US basin and a global shale oil powerhouse, driven by horizontal drilling." },
  { commodityId: "wti", name: "Eagle Ford & Bakken Shale",     country: "USA",          lat: 28.8,   lon: -98.5,   type: "oilfield", production: 2800000,  taxRate: 0,  description: "Texas's Eagle Ford and North Dakota's Bakken are the second and third most productive US shale plays." },
  { commodityId: "wti", name: "Ghawar & Khurais Fields",       country: "Saudi Arabia", lat: 25.1,   lon: 49.1,    type: "oilfield", production: 9500000,  taxRate: 0,  description: "Ghawar is the world's largest conventional oil field, alone producing ~5 million bbl/day at peak." },
  { commodityId: "wti", name: "West Siberian Basin",           country: "Russia",       lat: 62.0,   lon: 75.0,    type: "oilfield", production: 10500000, taxRate: 30, description: "Russia's West Siberian Basin is one of the world's largest petroleum provinces, operated by Rosneft and Lukoil." },
  { commodityId: "wti", name: "Rumaila & Basra Fields",        country: "Iraq",         lat: 30.5,   lon: 47.8,    type: "oilfield", production: 4600000,  taxRate: 10, description: "Iraq's southern Basra region is home to super-giant fields including Rumaila and West Qurna." },
  { commodityId: "wti", name: "Rub al-Khali & Abu Dhabi",      country: "UAE",          lat: 23.5,   lon: 53.5,    type: "oilfield", production: 4000000,  taxRate: 0,  description: "The UAE's ADNOC operates the vast Murban, Bu Hasa, and Zakum offshore fields in Abu Dhabi." },
  { commodityId: "wti", name: "Oil Sands, Alberta",            country: "Canada",       lat: 57.0,   lon: -111.5,  type: "oilfield", production: 5500000,  taxRate: 0,  description: "Alberta's Athabasca Oil Sands hold the world's third-largest proven oil reserves." },
  { commodityId: "wti", name: "Tengiz & Kashagan",             country: "Kazakhstan",   lat: 45.5,   lon: 53.0,    type: "oilfield", production: 2000000,  taxRate: 10, description: "Kazakhstan's Tengiz (Chevron) and Kashagan (international consortium) are giant Caspian Sea deposits." },
  { commodityId: "wti", name: "Greater Burghan Field",         country: "Kuwait",       lat: 29.0,   lon: 47.8,    type: "oilfield", production: 2700000,  taxRate: 0,  description: "Greater Burgan is the world's second-largest oil field. Kuwait's entire output flows from this region." },
  { commodityId: "wti", name: "Khuzestan Province",            country: "Iran",         lat: 31.3,   lon: 48.7,    type: "oilfield", production: 3800000,  taxRate: 0,  description: "Iran's Khuzestan province hosts Ahvaz, Marun, and dozens of other giant oil fields." },
  { commodityId: "wti", name: "Niger Delta",                   country: "Nigeria",      lat: 4.9,    lon: 6.9,     type: "oilfield", production: 1500000,  taxRate: 20, description: "The Niger Delta is Africa's largest oil-producing region. NNPC, Shell, and Chevron operate joint ventures." },
  { commodityId: "wti", name: "Lula & Búzios Pre-salt",        country: "Brazil",       lat: -23.0,  lon: -41.5,   type: "oilfield", production: 3500000,  taxRate: 0,  description: "Brazil's deepwater pre-salt fields in the Santos Basin are among the most productive in the western hemisphere." },
  { commodityId: "wti", name: "North Sea (UK Sector)",         country: "UK",           lat: 57.8,   lon: 1.5,     type: "oilfield", production: 900000,   taxRate: 65, description: "The UK North Sea, though in decline, still produces substantial oil from ageing Brent-era fields." },
  { commodityId: "wti", name: "Kirkuk & Kurdistan Fields",     country: "Iraq",         lat: 35.5,   lon: 44.4,    type: "oilfield", production: 500000,   taxRate: 10, description: "Northern Iraq's Kirkuk is one of the world's oldest oil fields, alongside newer Kurdistan Regional Government developments." },

  // =========================================================================
  // BRENT CRUDE OIL — same producers, different benchmark
  // =========================================================================
  { commodityId: "brent", name: "North Sea Fields",            country: "UK/Norway",    lat: 58.0,   lon: 2.5,     type: "oilfield", production: 3600000,  taxRate: 65, description: "The North Sea's Brent, Forties, Oseberg, Ekofisk, and Troll fields define the Brent crude benchmark." },
  { commodityId: "brent", name: "Abu Dhabi & Murban Fields",   country: "UAE",          lat: 23.5,   lon: 53.5,    type: "oilfield", production: 4000000,  taxRate: 0,  description: "ADNOC's onshore and offshore fields collectively produce ~4 million bbl/day. Murban crude is a key Brent component." },
  { commodityId: "brent", name: "Greater Burghan Field",       country: "Kuwait",       lat: 29.0,   lon: 47.8,    type: "oilfield", production: 2700000,  taxRate: 0,  description: "Kuwait's Greater Burghan, the world's second-largest oil field, underpins Brent's Middle East premium." },
  { commodityId: "brent", name: "Ghawar & Arab Light",         country: "Saudi Arabia", lat: 25.1,   lon: 49.1,    type: "oilfield", production: 9500000,  taxRate: 0,  description: "Saudi Arab Light crude is the primary contributor to the Brent complex alongside North Sea grades." },
  { commodityId: "brent", name: "West Siberian Fields",        country: "Russia",       lat: 62.0,   lon: 75.0,    type: "oilfield", production: 10500000, taxRate: 30, description: "Russia's Ural blend crude is a major Brent-priced export traded across European and Asian markets." },
  { commodityId: "brent", name: "Agbami & Egina Offshore",     country: "Nigeria",      lat: 3.5,    lon: 5.0,     type: "oilfield", production: 1500000,  taxRate: 20, description: "Nigeria's deepwater offshore fields export sweet crude grades priced at a Brent premium." },
  { commodityId: "brent", name: "Lula & Búzios Fields",        country: "Brazil",       lat: -23.0,  lon: -41.5,   type: "oilfield", production: 3500000,  taxRate: 0,  description: "Brazil's pre-salt Lula and Búzios fields export Tupi Sweet crude, priced on the Brent complex." },
  { commodityId: "brent", name: "Johan Sverdrup & Ekofisk",    country: "Norway",       lat: 59.0,   lon: 2.5,     type: "oilfield", production: 2000000,  taxRate: 78, description: "Johan Sverdrup is Europe's largest oilfield. Norway's continental shelf remains highly prolific." },
  { commodityId: "brent", name: "Rumaila & West Qurna",        country: "Iraq",         lat: 30.5,   lon: 47.8,    type: "oilfield", production: 4600000,  taxRate: 10, description: "Iraq's Basra Heavy and Basra Light crude exports price off the Brent benchmark." },
  { commodityId: "brent", name: "El Sharara & Waha Fields",    country: "Libya",        lat: 28.0,   lon: 14.0,    type: "oilfield", production: 1300000,  taxRate: 0,  description: "Libya's low-sulfur Saharan Blend and Es Sider crude are flagship Brent-grade exports." },

  // =========================================================================
  // NATURAL GAS — global: ~4,100 bcm/yr (IEA 2023, production in bcm/yr)
  // =========================================================================
  { commodityId: "natgas", name: "South Pars / North Dome",    country: "Iran/Qatar",   lat: 26.8,   lon: 52.0,    type: "reserve",  production: 800,  taxRate: 0,  description: "The world's largest gas field — shared between Iran (South Pars) and Qatar (North Dome) — holds 20% of global reserves." },
  { commodityId: "natgas", name: "West Siberian Gas Fields",   country: "Russia",       lat: 65.0,   lon: 74.0,    type: "oilfield", production: 680,  taxRate: 30, description: "Russia's Urengoy, Yamburg, and Bovanenkovo fields make it the world's second-largest gas producer." },
  { commodityId: "natgas", name: "Marcellus & Haynesville",    country: "USA",          lat: 40.5,   lon: -77.5,   type: "reserve",  production: 350,  taxRate: 0,  description: "The US shale gas revolution is anchored by Marcellus (Appalachians) and Haynesville (Louisiana-Texas)." },
  { commodityId: "natgas", name: "Permian & Gulf Coast Gas",   country: "USA",          lat: 29.0,   lon: -95.0,   type: "oilfield", production: 600,  taxRate: 0,  description: "Associated gas from Permian oil wells plus Gulf Coast fields make the US the world's largest gas producer." },
  { commodityId: "natgas", name: "Oman LNG & Khazzan",        country: "Oman",          lat: 23.6,   lon: 58.6,    type: "reserve",  production: 40,   taxRate: 0,  description: "Oman's BP Khazzan tight gas development and LNG complex supply Asia's growing LNG demand." },
  { commodityId: "natgas", name: "Cooper & Surat Basins",      country: "Australia",    lat: -27.5,  lon: 140.0,   type: "reserve",  production: 145,  taxRate: 2,  description: "Australia is the world's largest LNG exporter. Cooper Basin CSG and North-West Shelf LNG are the flagship projects." },
  { commodityId: "natgas", name: "Groningen & North Sea Gas",  country: "Netherlands",  lat: 53.4,   lon: 6.8,     type: "reserve",  production: 12,   taxRate: 50, description: "Groningen, once Europe's largest gas field, is winding down due to induced seismicity concerns." },
  { commodityId: "natgas", name: "North Sea Norwegian Gas",    country: "Norway",       lat: 61.0,   lon: 2.5,     type: "reserve",  production: 120,  taxRate: 78, description: "Norway's Troll, Ormen Lange, and Åsgard fields supply ~25% of Europe's gas needs via pipeline." },
  { commodityId: "natgas", name: "Sabah & Sarawak Fields",     country: "Malaysia",     lat: 4.5,    lon: 113.5,   type: "reserve",  production: 74,   taxRate: 0,  description: "Malaysia's offshore Sabah and Sarawak fields feed the Bintulu LNG complex, a top-5 global LNG exporter." },
  { commodityId: "natgas", name: "Tamar & Leviathan Fields",   country: "Israel",       lat: 32.6,   lon: 34.5,    type: "reserve",  production: 22,   taxRate: 12, description: "Israel's Leviathan gas field transformed the country from importer to exporter, with gas piped to Egypt and Jordan." },
  { commodityId: "natgas", name: "Rovuma LNG Basin",           country: "Mozambique",   lat: -12.3,  lon: 40.5,    type: "reserve",  production: 5,    taxRate: 5,  description: "One of the world's largest LNG discoveries, Mozambique's Rovuma Basin is being developed by TotalEnergies and Eni." },
  { commodityId: "natgas", name: "Sendje & Punta Europa",      country: "Equatorial Guinea", lat: 3.5, lon: 8.7,   type: "reserve",  production: 8,    taxRate: 0,  description: "Equatorial Guinea's offshore fields feed the Bioko LNG plant, the only LNG exporter in West Africa." },
  { commodityId: "natgas", name: "Krishna-Godavari Basin",     country: "India",        lat: 16.0,   lon: 82.0,    type: "reserve",  production: 28,   taxRate: 0,  description: "Reliance's KG-D6 block and ONGC fields make India a modest but growing domestic gas producer." },
  { commodityId: "natgas", name: "Sichuan & Tarim Basin",      country: "China",        lat: 30.5,   lon: 104.0,   type: "reserve",  production: 210,  taxRate: 0,  description: "China is rapidly growing domestic gas production from Sichuan shale and Tarim Basin conventional reservoirs." },

  // =========================================================================
  // WHEAT — global: ~780,000,000 t/yr (FAO 2023, production in tonnes)
  // =========================================================================
  { commodityId: "wheat", name: "North China Plain",           country: "China",        lat: 35.9,   lon: 114.0,   type: "farm",    production: 136000000, taxRate: 0,  description: "China is the world's largest wheat producer. The Yellow River basin and North China Plain dominate output." },
  { commodityId: "wheat", name: "Punjab & Haryana",            country: "India",        lat: 30.9,   lon: 75.9,    type: "farm",    production: 108000000, taxRate: 20, description: "India's Green Revolution breadbasket states supply the national buffer stock and export markets." },
  { commodityId: "wheat", name: "Southern Russia & Volga",     country: "Russia",       lat: 51.0,   lon: 46.0,    type: "farm",    production: 92000000,  taxRate: 15, description: "Russia's Black Earth belt is the most fertile in the world. Russia is now the world's largest wheat exporter." },
  { commodityId: "wheat", name: "Great Plains & Kansas",       country: "USA",          lat: 38.5,   lon: -98.0,   type: "farm",    production: 44000000,  taxRate: 0,  description: "Kansas and the Great Plains anchor US hard winter wheat production. Soft red winter wheat is grown further east." },
  { commodityId: "wheat", name: "Ukrainian Black Earth",       country: "Ukraine",      lat: 48.4,   lon: 31.2,    type: "farm",    production: 33000000,  taxRate: 9,  description: "Ukraine's chernozem soils make it Europe's breadbasket. The Russia-Ukraine war severely disrupted exports." },
  { commodityId: "wheat", name: "Punjab & Sindh",              country: "Pakistan",     lat: 30.4,   lon: 71.0,    type: "farm",    production: 28000000,  taxRate: 0,  description: "Pakistan is a major wheat producer and occasionally exports surplus. Punjab province dominates output." },
  { commodityId: "wheat", name: "West Australia & Victoria",   country: "Australia",    lat: -31.0,  lon: 117.0,   type: "farm",    production: 34000000,  taxRate: 0,  description: "Australia's southern grain belt exports premium wheat to Asia and the Middle East." },
  { commodityId: "wheat", name: "Danube Plain & Banat",        country: "Romania",      lat: 44.5,   lon: 26.0,    type: "farm",    production: 10000000,  taxRate: 0,  description: "Romania's fertile Danube Plain makes it a leading EU wheat exporter to Middle Eastern markets." },
  { commodityId: "wheat", name: "Alberta & Saskatchewan",      country: "Canada",       lat: 51.5,   lon: -107.0,  type: "farm",    production: 36000000,  taxRate: 0,  description: "Canada's Prairie provinces produce premium Canadian Western Red Spring wheat sought worldwide for its high protein content." },
  { commodityId: "wheat", name: "Ile-de-France & Picardie",    country: "France",       lat: 48.9,   lon: 2.4,     type: "farm",    production: 35000000,  taxRate: 0,  description: "France is the EU's largest wheat producer, exporting to Africa and the Middle East." },
  { commodityId: "wheat", name: "Bavaria & Brandenburg",       country: "Germany",      lat: 51.5,   lon: 12.0,    type: "farm",    production: 22000000,  taxRate: 0,  description: "Germany is a major European wheat producer and exporter, with the north particularly productive." },
  { commodityId: "wheat", name: "Kazakh Steppe",               country: "Kazakhstan",   lat: 51.0,   lon: 67.0,    type: "farm",    production: 16000000,  taxRate: 10, description: "Kazakhstan produces high-protein spring wheat from vast steppe farmlands, critical to Central Asian food security." },
  { commodityId: "wheat", name: "Sinai & Nile Delta",          country: "Egypt",        lat: 30.6,   lon: 30.9,    type: "farm",    production: 10000000,  taxRate: 0,  description: "Egypt grows wheat along the Nile Valley but imports far more than it produces, making it the world's largest buyer." },
  { commodityId: "wheat", name: "La Pampa & Buenos Aires",     country: "Argentina",    lat: -36.6,  lon: -63.6,   type: "farm",    production: 22000000,  taxRate: 12, description: "Argentina's Pampas produce high-quality wheat exported to Brazil and Southeast Asia." },

  // =========================================================================
  // CORN — global: ~1,150,000,000 t/yr (FAO 2023, production in tonnes)
  // =========================================================================
  { commodityId: "corn", name: "US Corn Belt (Iowa-Illinois)", country: "USA",          lat: 42.0,   lon: -93.2,   type: "farm",    production: 384000000, taxRate: 0,  description: "The US Corn Belt is the world's most productive corn region. Iowa alone produces more than most countries." },
  { commodityId: "corn", name: "Northeast China Plains",       country: "China",        lat: 43.9,   lon: 125.3,   type: "farm",    production: 277000000, taxRate: 0,  description: "China's northeastern 'Corn Belt' — Heilongjiang, Jilin, Inner Mongolia — rivals the US in total output." },
  { commodityId: "corn", name: "Mato Grosso & Paraná",         country: "Brazil",       lat: -14.0,  lon: -54.0,   type: "farm",    production: 135000000, taxRate: 0,  description: "Brazil's second-season 'safrinha' corn, grown after soybeans, has turned it into a world-class corn exporter." },
  { commodityId: "corn", name: "Buenos Aires & Santa Fe",      country: "Argentina",    lat: -34.0,  lon: -60.0,   type: "farm",    production: 55000000,  taxRate: 12, description: "Argentina is a leading corn exporter. Buenos Aires province is the heart of its productive Pampas." },
  { commodityId: "corn", name: "Maharashtra & Karnataka",      country: "India",        lat: 18.5,   lon: 75.8,    type: "farm",    production: 35000000,  taxRate: 0,  description: "India produces corn mainly for animal feed and starch. Maharashtra and Karnataka are the top states." },
  { commodityId: "corn", name: "Central Anatolian Plateau",    country: "Turkey",       lat: 38.0,   lon: 32.0,    type: "farm",    production: 8000000,   taxRate: 0,  description: "Turkey is a significant corn producer in the Black Sea and Central Anatolian regions." },
  { commodityId: "corn", name: "South Africa Maize Belt",      country: "South Africa", lat: -26.5,  lon: 27.5,    type: "farm",    production: 16000000,  taxRate: 0,  description: "South Africa is a net corn exporter in good years. The highveld of Mpumalanga and North West are the main growing areas." },
  { commodityId: "corn", name: "Rift Valley & Coast",          country: "Kenya",        lat: -0.1,   lon: 36.8,    type: "farm",    production: 4000000,   taxRate: 0,  description: "Kenya is East Africa's main corn producer, with the Rift Valley and Western regions growing most of the crop." },
  { commodityId: "corn", name: "Giza & Fayoum",                country: "Egypt",        lat: 29.3,   lon: 30.8,    type: "farm",    production: 6000000,   taxRate: 0,  description: "Egypt grows corn along the Nile Valley and Delta, mainly for domestic animal feed use." },
  { commodityId: "corn", name: "Central & Western Ukraine",    country: "Ukraine",      lat: 49.0,   lon: 32.0,    type: "farm",    production: 30000000,  taxRate: 9,  description: "Ukraine is a major corn exporter to Asia and Europe. War-related disruptions have affected global corn markets significantly." },
  { commodityId: "corn", name: "Mekong Delta Uplands",         country: "Vietnam",      lat: 12.5,   lon: 107.5,   type: "farm",    production: 5000000,   taxRate: 0,  description: "Vietnam grows corn primarily in the northern uplands and Central Highlands for domestic feed use." },

  // =========================================================================
  // SOYBEANS — global: ~390,000,000 t/yr (FAO/USDA 2023, production in tonnes)
  // =========================================================================
  { commodityId: "soybeans", name: "Mato Grosso & Paraná",     country: "Brazil",       lat: -12.6,  lon: -54.0,   type: "farm",    production: 154000000, taxRate: 0,  description: "Brazil is now the world's top soybean producer. Mato Grosso alone produces ~30% of Brazilian output." },
  { commodityId: "soybeans", name: "US Midwest Soy Belt",      country: "USA",          lat: 40.0,   lon: -90.0,   type: "farm",    production: 116000000, taxRate: 0,  description: "Iowa and Illinois anchor US soybean production. The US is the world's largest soy exporter." },
  { commodityId: "soybeans", name: "Pampas, Argentina",        country: "Argentina",    lat: -34.6,  lon: -62.0,   type: "farm",    production: 49000000,  taxRate: 33, description: "Argentina's Pampas produce vast quantities of soybeans. It is the world's largest soybean oil and meal exporter." },
  { commodityId: "soybeans", name: "Heilongjiang Province",    country: "China",        lat: 47.0,   lon: 128.0,   type: "farm",    production: 20000000,  taxRate: 0,  description: "China grows soybeans mainly in Heilongjiang, though it imports far more than it produces." },
  { commodityId: "soybeans", name: "Gran Chaco, Bolivia",      country: "Bolivia",      lat: -17.0,  lon: -62.0,   type: "farm",    production: 3200000,   taxRate: 0,  description: "Bolivia is a growing soybean exporter, with production expanding into the Santa Cruz department." },
  { commodityId: "soybeans", name: "Canindeyú & Alto Paraná",  country: "Paraguay",     lat: -23.5,  lon: -55.0,   type: "farm",    production: 11000000,  taxRate: 0,  description: "Paraguay is a top-5 global soybean exporter relative to its size, with virtually no domestic value-add." },
  { commodityId: "soybeans", name: "Ontario & Manitoba",       country: "Canada",       lat: 43.0,   lon: -80.0,   type: "farm",    production: 6500000,   taxRate: 0,  description: "Canada grows soybeans primarily in Ontario, where they have expanded due to warming temperatures." },
  { commodityId: "soybeans", name: "Andhra Pradesh & Madhya Pradesh", country: "India",lat: 22.7,   lon: 77.4,    type: "farm",    production: 13000000,  taxRate: 0,  description: "India grows soybeans mainly in Madhya Pradesh, Rajasthan, and Maharashtra for domestic crush and oil." },

  // =========================================================================
  // RICE — global: ~520,000,000 t/yr milled (FAO 2023, production in tonnes)
  // =========================================================================
  { commodityId: "rice", name: "Yangtze River Delta",          country: "China",        lat: 30.6,   lon: 114.3,   type: "farm",    production: 212000000, taxRate: 0,  description: "China is the world's largest rice producer. The Yangtze and Pearl River deltas are key growing areas." },
  { commodityId: "rice", name: "Ganges-Brahmaputra Delta",     country: "India",        lat: 22.4,   lon: 87.1,    type: "farm",    production: 132000000, taxRate: 20, description: "India is the world's largest rice exporter. West Bengal and Andhra Pradesh are key producing states." },
  { commodityId: "rice", name: "Java & Sulawesi Islands",      country: "Indonesia",    lat: -7.0,   lon: 110.0,   type: "farm",    production: 55000000,  taxRate: 0,  description: "Indonesia is a major rice producer but also a significant importer to meet its large population's demand." },
  { commodityId: "rice", name: "Mekong Delta",                 country: "Vietnam",      lat: 10.0,   lon: 105.7,   type: "farm",    production: 43000000,  taxRate: 0,  description: "Vietnam's Mekong Delta, the 'rice bowl' of Southeast Asia, produces multiple crops per year for export." },
  { commodityId: "rice", name: "Irrawaddy Delta",              country: "Myanmar",      lat: 17.0,   lon: 95.5,    type: "farm",    production: 26000000,  taxRate: 0,  description: "Myanmar's Irrawaddy Delta was once the world's largest rice exporter. Output is now constrained by infrastructure issues." },
  { commodityId: "rice", name: "Chao Phraya Basin",            country: "Thailand",     lat: 14.5,   lon: 100.5,   type: "farm",    production: 31000000,  taxRate: 0,  description: "Thailand is a top-5 rice exporter. Jasmine rice from the Central Plains commands a global premium." },
  { commodityId: "rice", name: "Punjab & Sindh",               country: "Pakistan",     lat: 31.0,   lon: 72.0,    type: "farm",    production: 9000000,   taxRate: 0,  description: "Pakistan is a major basmati and IRRI rice exporter, mainly from Punjab province." },
  { commodityId: "rice", name: "Cagayan Valley & Central Luzon", country: "Philippines", lat: 15.5,  lon: 121.0,   type: "farm",    production: 19000000,  taxRate: 0,  description: "The Philippines grows rice across Luzon and Visayas but remains a net importer due to high domestic demand." },
  { commodityId: "rice", name: "California & Arkansas",        country: "USA",          lat: 39.5,   lon: -122.0,  type: "farm",    production: 8000000,   taxRate: 0,  description: "California and Arkansas produce US rice, which is exported to the Middle East and Pacific Rim." },
  { commodityId: "rice", name: "Rio Grande do Sul",            country: "Brazil",       lat: -29.0,  lon: -53.0,   type: "farm",    production: 12000000,  taxRate: 0,  description: "Brazil's southernmost state Rio Grande do Sul grows temperate irrigated rice for domestic consumption." },
  { commodityId: "rice", name: "Rift Valley & Lake Victoria Basin", country: "Tanzania", lat: -5.0,  lon: 34.0,   type: "farm",    production: 4000000,   taxRate: 0,  description: "Tanzania's Kilombero Valley and Lake Victoria basin grow rice for domestic and regional markets." },

  // =========================================================================
  // COCOA — global: ~5,000,000 MT/yr (ICCO 2023, production in tonnes = MT)
  // =========================================================================
  { commodityId: "cocoa", name: "Ivory Coast Belt",            country: "Ivory Coast",  lat: 6.8,    lon: -5.3,    type: "farm",    production: 2200000, taxRate: 22, description: "Côte d'Ivoire produces 44% of the world's cocoa, making it entirely dependent on the commodity." },
  { commodityId: "cocoa", name: "Ashanti & Brong-Ahafo",       country: "Ghana",        lat: 7.9,    lon: -1.0,    type: "farm",    production: 800000,  taxRate: 4.75, description: "Ghana produces premium Ghanaian cocoa, known for its quality. The government controls pricing through COCOBOD." },
  { commodityId: "cocoa", name: "Sulawesi & Kalimantan",       country: "Indonesia",    lat: -1.4,   lon: 121.4,   type: "farm",    production: 500000,  taxRate: 15, description: "Indonesia is the third-largest cocoa producer. Most output is bulk fermented beans from Sulawesi." },
  { commodityId: "cocoa", name: "Esmeraldas & Coastal Region", country: "Ecuador",      lat: 0.9,    lon: -79.7,   type: "farm",    production: 290000,  taxRate: 0,  description: "Ecuador produces the world's finest Arriba Nacional cacao, prized by premium chocolate makers." },
  { commodityId: "cocoa", name: "San Pedro & Man Regions",     country: "Ivory Coast",  lat: 4.7,    lon: -6.6,    type: "farm",    production: 220000,  taxRate: 22, description: "The western Ivory Coast near San Pedro port is an increasingly important cocoa-growing zone." },
  { commodityId: "cocoa", name: "Cross River & Ondo",          country: "Nigeria",      lat: 5.5,    lon: 8.3,     type: "farm",    production: 280000,  taxRate: 0,  description: "Nigeria is Africa's third-largest cocoa producer, with Cross River and Ondo states dominating." },
  { commodityId: "cocoa", name: "Cameroon Southwest",          country: "Cameroon",     lat: 4.1,    lon: 9.3,     type: "farm",    production: 280000,  taxRate: 12, description: "Cameroon's humid southwest produces forastero cocoa sold primarily to European processors." },
  { commodityId: "cocoa", name: "Caquetá & Huila",             country: "Colombia",     lat: 1.5,    lon: -75.0,   type: "farm",    production: 70000,   taxRate: 0,  description: "Colombia is a small but growing fine cacao producer with premium genetics from indigenous varieties." },
  { commodityId: "cocoa", name: "Tabasco & Chiapas",           country: "Mexico",       lat: 18.0,   lon: -93.0,   type: "farm",    production: 28000,   taxRate: 0,  description: "Mexico grows cacao in the Gulf Coast states of Tabasco and Chiapas. It is the birthplace of chocolate cultivation." },

  // =========================================================================
  // COFFEE — global: ~10,500,000 t/yr (ICO 2023, production in tonnes)
  // =========================================================================
  { commodityId: "coffee", name: "Minas Gerais & São Paulo",   country: "Brazil",       lat: -19.9,  lon: -45.0,   type: "farm",    production: 3800000, taxRate: 0,  description: "Brazil is the world's largest coffee producer by a wide margin, growing both Arabica and Robusta." },
  { commodityId: "coffee", name: "Central Highlands",          country: "Vietnam",      lat: 12.1,   lon: 108.2,   type: "farm",    production: 1800000, taxRate: 0,  description: "Vietnam is the world's second-largest coffee producer and the largest Robusta exporter." },
  { commodityId: "coffee", name: "Coffee Triangle (Eje Cafetero)", country: "Colombia", lat: 5.0,    lon: -75.5,   type: "farm",    production: 860000,  taxRate: 0,  description: "Colombia's Eje Cafetero produces washed Arabica celebrated for its balanced acidity and bright fruit notes." },
  { commodityId: "coffee", name: "Yirgacheffe & Sidamo",       country: "Ethiopia",     lat: 6.1,    lon: 38.2,    type: "farm",    production: 480000,  taxRate: 5,  description: "Ethiopia is the birthplace of coffee. Yirgacheffe and Sidamo produce world-famous specialty Arabica." },
  { commodityId: "coffee", name: "Bugisu & Rwenzori",          country: "Uganda",       lat: 1.2,    lon: 34.2,    type: "farm",    production: 280000,  taxRate: 0,  description: "Uganda is Africa's second-largest coffee producer, exporting Robusta and high-altitude Arabica from Mount Elgon." },
  { commodityId: "coffee", name: "Huila & Nariño Highlands",   country: "Colombia",     lat: 2.0,    lon: -75.5,   type: "farm",    production: 130000,  taxRate: 0,  description: "Southern Colombia's Huila and Nariño departments produce some of the world's most sought specialty coffees." },
  { commodityId: "coffee", name: "Kona & Ka'ū Districts",      country: "Indonesia",    lat: -8.2,   lon: 114.4,   type: "farm",    production: 800000,  taxRate: 10, description: "Indonesia's Sumatra (Mandheling, Gayo), Java, and Bali produce diverse Robusta and wet-hulled Arabica styles." },
  { commodityId: "coffee", name: "Coatepec & Veracruz",        country: "Mexico",       lat: 19.5,   lon: -97.0,   type: "farm",    production: 234000,  taxRate: 0,  description: "Mexico is a leading specialty coffee origin. Chiapas, Oaxaca, and Veracruz produce washed highland Arabica." },
  { commodityId: "coffee", name: "Kilimanjaro & Mbeya",        country: "Tanzania",     lat: -3.1,   lon: 36.7,    type: "farm",    production: 64000,   taxRate: 0,  description: "Tanzania's Mt. Kilimanjaro Arabica and Robusta from Mbeya are exported through Dar es Salaam." },
  { commodityId: "coffee", name: "Blue Mountains & Manchester", country: "Jamaica",     lat: 18.1,   lon: -76.5,   type: "farm",    production: 1500,    taxRate: 0,  description: "Jamaica Blue Mountain is among the world's most expensive coffees, produced in tiny quantities." },
  { commodityId: "coffee", name: "Kerala & Karnataka",         country: "India",        lat: 12.8,   lon: 75.7,    type: "farm",    production: 360000,  taxRate: 0,  description: "India produces both Arabica and Robusta in the Western Ghats. Indian coffee is a significant export." },
  { commodityId: "coffee", name: "Manabi & Loja",              country: "Honduras",     lat: 14.5,   lon: -87.2,   type: "farm",    production: 500000,  taxRate: 0,  description: "Honduras became the largest coffee producer in Central America by 2011, known for washed highland Arabica." },

  // =========================================================================
  // SUGAR — global: ~185,000,000 t/yr (ISO 2023, production in tonnes)
  // =========================================================================
  { commodityId: "sugar", name: "São Paulo & Minas Gerais",    country: "Brazil",       lat: -22.9,  lon: -47.0,   type: "farm",    production: 38000000, taxRate: 0,  description: "Brazil is the world's largest sugar producer and exporter. São Paulo state holds 60% of Brazilian output." },
  { commodityId: "sugar", name: "Uttar Pradesh & Maharashtra", country: "India",        lat: 26.8,   lon: 80.9,    type: "farm",    production: 34000000, taxRate: 20, description: "India is the world's second-largest sugar producer. UP alone accounts for over 40% of Indian cane." },
  { commodityId: "sugar", name: "Central Thailand",            country: "Thailand",     lat: 15.0,   lon: 101.0,   type: "farm",    production: 10000000, taxRate: 5,  description: "Thailand is Asia's largest sugar exporter, with production centered in the Central Plains and Kanchanaburi." },
  { commodityId: "sugar", name: "Camaguey & Villa Clara",      country: "Cuba",         lat: 21.4,   lon: -77.9,   type: "farm",    production: 400000,   taxRate: 0,  description: "Cuba was once the world's largest sugar exporter. Output has collapsed to a fraction of peak levels." },
  { commodityId: "sugar", name: "Natal & Zululand",            country: "South Africa", lat: -29.5,  lon: 30.9,    type: "farm",    production: 2000000,  taxRate: 0,  description: "South Africa's KwaZulu-Natal province produces most of the country's sugar for domestic use and export." },
  { commodityId: "sugar", name: "Queensland & NSW",            country: "Australia",    lat: -23.0,  lon: 150.0,   type: "farm",    production: 4500000,  taxRate: 0,  description: "Australia's Queensland coast grows high-quality raw sugar exported primarily to Asian markets." },
  { commodityId: "sugar", name: "Havana & Matanzas",           country: "Pakistan",     lat: 30.2,   lon: 72.5,    type: "farm",    production: 7000000,  taxRate: 0,  description: "Pakistan is a major sugarcane grower in Punjab province, with exports to Afghanistan and Central Asia." },
  { commodityId: "sugar", name: "Cancún & Yucatan Peninsula",  country: "Mexico",       lat: 20.9,   lon: -89.6,   type: "farm",    production: 6000000,  taxRate: 0,  description: "Mexico produces sugar from both highlands and coastal lowlands. It exports to the US under NAFTA quotas." },
  { commodityId: "sugar", name: "Pampas & Tucumán",            country: "Argentina",    lat: -26.8,  lon: -65.2,   type: "farm",    production: 2500000,  taxRate: 5,  description: "Argentina's Tucumán province produces most of the country's sugar, mainly for the domestic market." },
  { commodityId: "sugar", name: "Gauteng & Mpumalanga",        country: "China",        lat: 29.9,   lon: 121.6,   type: "farm",    production: 10500000, taxRate: 0,  description: "China is a significant sugar producer in Guangxi and Yunnan provinces, primarily from sugarcane." },
  { commodityId: "sugar", name: "Krasnodar & Belgorod",        country: "Russia",       lat: 45.0,   lon: 39.0,    type: "farm",    production: 6500000,  taxRate: 0,  description: "Russia grows sugar beet in Krasnodar and Central Black Earth regions, becoming self-sufficient in recent years." },
  { commodityId: "sugar", name: "Kanchanaburi & Suphan Buri",  country: "Philippines",  lat: 13.5,   lon: 120.5,   type: "farm",    production: 2200000,  taxRate: 0,  description: "The Philippines produces sugar in Negros Occidental (the 'Sugarbowl of the Philippines') and Leyte." },

  // =========================================================================
  // COTTON — global: ~25,000,000 t/yr (ICAC 2023, production in tonnes)
  // =========================================================================
  { commodityId: "cotton", name: "Xinjiang Province",          country: "China",        lat: 41.1,   lon: 85.2,    type: "farm",    production: 5900000,  taxRate: 0,  description: "Xinjiang produces 85% of China's cotton and over 20% of world supply. Human rights scrutiny has affected trade." },
  { commodityId: "cotton", name: "Gujarat & Maharashtra",      country: "India",        lat: 22.3,   lon: 72.6,    type: "farm",    production: 6300000,  taxRate: 11, description: "India is the world's largest cotton grower. Bt cotton transformed Indian yields after 2002." },
  { commodityId: "cotton", name: "Texas High Plains",          country: "USA",          lat: 33.6,   lon: -101.9,  type: "farm",    production: 4200000,  taxRate: 0,  description: "Texas produces half of all US cotton. The Lubbock area is the single largest cotton-producing region in the US." },
  { commodityId: "cotton", name: "Fergana Valley",             country: "Uzbekistan",   lat: 40.8,   lon: 72.0,    type: "farm",    production: 1100000,  taxRate: 10, description: "Uzbekistan is a top-5 cotton producer. The Fergana Valley benefits from Amu Darya irrigation." },
  { commodityId: "cotton", name: "Punjab & Sindh",             country: "Pakistan",     lat: 29.7,   lon: 72.4,    type: "farm",    production: 1700000,  taxRate: 0,  description: "Pakistan's cotton crop underpins its massive textile industry, the country's top export sector." },
  { commodityId: "cotton", name: "São Paulo & Mato Grosso",    country: "Brazil",       lat: -14.0,  lon: -51.0,   type: "farm",    production: 2400000,  taxRate: 0,  description: "Brazil has become the world's second-largest cotton exporter, with Mato Grosso as the new frontier." },
  { commodityId: "cotton", name: "Aegean & Çukurova Regions",  country: "Turkey",       lat: 37.5,   lon: 29.0,    type: "farm",    production: 750000,   taxRate: 0,  description: "Turkey is a top cotton producer in the Mediterranean region, with Aegean cotton prized for its extra-long staple." },
  { commodityId: "cotton", name: "Burkina Faso & Benin",       country: "Burkina Faso", lat: 11.5,   lon: -2.0,    type: "farm",    production: 420000,   taxRate: 0,  description: "West African cotton from Burkina Faso, Mali, and Benin is high quality but produced at low volumes." },
  { commodityId: "cotton", name: "Khorezm & Kashkadaryo",      country: "Turkmenistan", lat: 40.0,   lon: 60.0,    type: "farm",    production: 250000,   taxRate: 0,  description: "Turkmenistan and its neighbors in Central Asia grow cotton under state-controlled farming systems." },
  { commodityId: "cotton", name: "Luanda & Malanje",           country: "Australia",    lat: -25.0,  lon: 136.0,   type: "farm",    production: 600000,   taxRate: 0,  description: "Australia grows premium machine-picked cotton in Queensland and New South Wales river valleys." },
];

// ---------------------------------------------------------------------------
// Build the exported REGIONS array by computing shareOfWorld and annualOutputNum
// ---------------------------------------------------------------------------
export const REGIONS = RAW_PRODUCERS.map((p, idx) => {
  const meta = COMMODITY_META[p.commodityId];
  const share = meta ? parseFloat(((p.production / meta.globalProduction) * 100).toFixed(2)) : 0;
  const annualOutputNum = meta ? Math.round(p.production * meta.priceMultiplier) : 0;
  const outputStr = p.production >= 1000000
    ? `${(p.production / 1000000).toFixed(1)}M ${meta?.unit?.replace("/yr", "").split("/")[0] ?? ""}`
    : p.production >= 1000
    ? `${(p.production / 1000).toFixed(0)}K ${meta?.unit?.replace("/yr", "").split("/")[0] ?? ""}`
    : `${p.production} ${meta?.unit?.replace("/yr", "").split("/")[0] ?? ""}`;

  return {
    id: `${p.commodityId}-${idx}`,
    commodityId: p.commodityId,
    name: p.name,
    country: p.country,
    lat: p.lat,
    lon: p.lon,
    type: p.type,
    shareOfWorld: share,
    annualOutput: outputStr,
    outputUnit: meta?.unit ?? "",
    annualOutputNum,
    taxRate: p.taxRate,
    description: p.description,
  };
});

// ---------------------------------------------------------------------------
// Coverage validation — warn if tracked sum is far from global
// ---------------------------------------------------------------------------
export const COVERAGE = Object.entries(COMMODITY_META).map(([id, meta]) => {
  const tracked = RAW_PRODUCERS.filter(p => p.commodityId === id).reduce((s, p) => s + p.production, 0);
  const pct = parseFloat(((tracked / meta.globalProduction) * 100).toFixed(1));
  return { commodityId: id, trackedProduction: tracked, globalProduction: meta.globalProduction, coveragePct: pct };
});

const router = Router();

router.get("/", (req, res) => {
  const { commodityId } = req.query as { commodityId?: string };
  const filtered = commodityId ? REGIONS.filter((r) => r.commodityId === commodityId) : REGIONS;
  res.json(filtered);
});

router.get("/coverage", (_req, res) => {
  res.json(COVERAGE);
});

export default router;
