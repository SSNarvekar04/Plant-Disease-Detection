/**
 * Disease knowledge base.
 *
 * Every document here becomes one record in the `diseases` MongoDB collection
 * (inserted by `npm run seed`). The React pages read this content from the API,
 * so no agricultural text is hardcoded inside a component.
 *
 * `mlLabels` links a record to the class names produced by the AI model
 * (`PlantVillage` style: "Tomato___Early_blight"). Keeping the mapping in the
 * database means the model can be retrained or renamed without touching code.
 *
 * Fields
 *   diseaseName           short name shown on cards, e.g. "Early Blight"
 *   plantName             e.g. "Tomato"
 *   description           1-3 sentence summary
 *   symptoms              what the farmer actually sees on the leaf
 *   causes                why it happens
 *   severity              Low | Medium | High | Critical
 *   organicRemedies       chemical-free / biological options
 *   chemicalTreatment     registered fungicide / bactericide options
 *   prevention            how to avoid it next season
 *   precautions           safety + handling notes
 *   pathogenType          informational banner
 *   favourableConditions  agronomic context
 *
 * NOTE: always follow local labels, the local extension officer and the
 * product label. Dosages are intentionally not hardcoded -- they differ per
 * country and per formulation.
 */

/** @type {Array<Record<string, any>>} */
const diseases = [
  // ==========================================================================
  // APPLE
  // ==========================================================================
  {
    diseaseName: 'Apple Scab',
    plantName: 'Apple',
    description:
      'Apple scab is a fungal disease caused by Venturia inaequalis. It attacks leaves, young shoots, blossoms and fruit. Infected leaves turn olive-brown and later drop early, which weakens the tree and defoliates it weeks before normal autumn.',
    symptoms: [
      'Olive-green to brown velvety spots on the upper leaf surface',
      'Spots develop an olive-black edge with a feathery, undefined margin',
      'Scabby, corky lesions on the skin of young fruit',
      'Premature leaf fall, often starting on one branch only',
      'Twigs may show small blister-like lesions',
    ],
    causes: [
      'Spores released from fallen leaves that overwinter on the orchard floor',
      'Wet leaf surfaces for more than 9 hours between 10-25 °C',
      'Spring rain spreading spores during primary infection',
      'Dense, unpruned canopies that stay humid for long periods',
    ],
    severity: 'High',
    pathogenType: 'Fungal (ascomycete) pathogen',
    favourableConditions: 'Cool, wet spring weather with prolonged leaf wetness.',
    organicRemedies: [
      'Rake up and destroy fallen leaves so the spore layer cannot overwinter',
      'Apply lime sulphur or a copper-based fungicide during dormancy',
      'Encourage airflow by pruning crowded interior branches',
      'Grow a tolerant cultivar such as "Prima" or "Topaz" in scab-prone areas',
    ],
    chemicalTreatment: [
      'Protectant fungicides such as mancozeb or captan from green tip onwards',
      'Systemic products (for example myclobutanil or difenoconazole) during primary infection periods',
      'Alternate modes of action (FRAC groups) to slow resistance build-up',
      'Spray to run-off and never mix unless the label allows it',
    ],
    prevention: [
      'Remove and destroy leaf litter before bud break every year',
      'Prune annually to open up the canopy',
      'Plant resistant rootstock and cultivars in high-risk regions',
      'Avoid overhead irrigation, use drip instead',
    ],
    precautions: [
      'Re-harvest intervals must be respected before picking fruit',
      'Never spray in high wind or when bees are foraging',
      'Ask a local extension officer which products are approved in your region',
    ],
    mlLabels: ['Apple___Apple_scab'],
  },
  {
    diseaseName: 'Black Rot',
    plantName: 'Apple',
    description:
      'Black rot (also called frog-eye leaf spot) is caused by the fungus Botryosphaeria obtusa. Leaves show purple spots with tan centres, while fruit develops firm black rot near the calyx end and eventually shrivels into a black mummy.',
    symptoms: [
      'Small purple flecks that enlarge into "frog-eye" spots with a tan centre',
      'Spots usually 1-3 mm with a purple margin',
      'Black rot on the fruit at the stem end, spreading slowly',
      'Infected fruit dries out and stays attached as a black mummy',
      'Dead bark cankers on limbs and branches',
    ],
    causes: [
      'Spores from mummified fruit and dead bark',
      'Warm, humid weather with frequent summer rainfall',
      'Injuries on fruit and dead tissue on branches',
      'Poorly managed orchards with a lot of dead wood',
    ],
    severity: 'High',
    pathogenType: 'Fungal (botryosphaeria) pathogen',
    favourableConditions: 'Warm (20-30 °C), humid summers with frequent rain.',
    organicRemedies: [
      'Prune out and burn dead wood and mummified fruit during dormancy',
      'Remove all fruit mummies from the tree and the ground',
      'Apply a dormant copper spray before bud swell',
      'Maintain canopy openness so fruit dries quickly after rain',
    ],
    chemicalTreatment: [
      'Captan or mancozeb from the first leaf fall through early summer',
      'Myclobutanil or thiophanate-methyl where black rot is severe',
      'Target fruit protection from petal fall until 4 weeks after harvest',
    ],
    prevention: [
      'Prune dead and diseased wood every winter',
      'Destroy mummies and keep dropped fruit off the orchard floor',
      'Avoid wounding trees during harvest',
      'Maintain balanced nutrition, stressed trees are more susceptible',
    ],
    precautions: [
      'Wear gloves and a mask when removing mummified fruit',
      'Observe pre-harvest intervals strictly',
    ],
    mlLabels: ['Apple___Black_rot'],
  },
  {
    diseaseName: 'Cedar Apple Rust',
    plantName: 'Apple',
    description:
      'Cedar apple rust is caused by the fungus Gymnosporangium juniperi-virginianae, which needs a nearby juniper host to complete its life cycle. Bright orange-yellow spots appear on the upper leaf surface in spring.',
    symptoms: [
      'Bright yellow-orange spots on the upper leaf surface',
      'Spots later develop tiny black dots in their centre',
      'Leaves can twist, curl and drop early',
      'Tube-like structures on the leaf underside and small galls on twigs',
      'Fruit may show rough scabby areas near the calyx',
    ],
    causes: [
      'Spores blowing from juniper (cedar) galls within a few hundred metres',
      'Spring rain washing spores onto young apple leaves',
      'Wet spring weather during the primary infection window',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (rust) pathogen',
    favourableConditions: 'Cool wet springs near juniper trees, temperatures 10-18 °C.',
    organicRemedies: [
      'Remove nearby juniper trees or galls within 500 m of the orchard',
      'Dormant lime sulphur or copper sprays reduce spore viability',
      'Rake and destroy infected leaves early',
    ],
    chemicalTreatment: [
      'Myclobutanil or propiconazole at pink through petal fall',
      'Metconazole or tebuconazole where the disease is recurring',
      'Two well-timed sprays are normally enough',
    ],
    prevention: [
      'Check for juniper hosts before planting an orchard',
      'Plant cultivars with good rust tolerance where possible',
      'Maintain good air movement with annual pruning',
    ],
    precautions: [
      'Spraying during petal fall may harm pollinating insects, spray early in the day',
      'Do not spray when the orchard is in bloom and bees are active',
    ],
    mlLabels: ['Apple___Cedar_apple_rust'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Apple',
    description:
      'The model found no visible signs of disease on this apple leaf. Continue routine care and keep monitoring the orchard weekly, especially during spring and wet periods.',
    symptoms: [
      'Uniform green colour without olive, brown or purple spotting',
      'Intact leaf margins with no scab-like lesions',
      'No premature defoliation',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Any, as long as the canopy is ventilated and dry after rain.',
    organicRemedies: [
      'Keep a regular preventive leaf-litter clean-up routine',
      'Maintain balanced nitrogen, potassium and water supply',
      'Prune yearly to keep light and air moving through the canopy',
    ],
    chemicalTreatment: [
      'No treatment required',
      'Keep a preventive scab/rust protection programme in high-risk orchards',
    ],
    prevention: [
      'Inspect leaves weekly in spring and after heavy rain',
      'Remove fallen leaves and prune dead wood in winter',
      'Use drip irrigation and avoid wetting the foliage',
    ],
    precautions: [
      'A healthy result does not rule out very early or internal infection',
      'If symptoms appear later, get the sample checked by an agronomist',
    ],
    mlLabels: ['Apple___healthy'],
  },

  // ==========================================================================
  // CORN (MAIZE)
  // ==========================================================================
  {
    diseaseName: 'Common Rust',
    plantName: 'Corn',
    description:
      'Common rust of corn, caused by Puccinia sorghi, is one of the most widespread maize diseases. Small brick-red pustules erupt from both leaf surfaces and can rub off onto your fingers like rust.',
    symptoms: [
      'Small, oval brick-red to brown pustules scattered on the leaves',
      'Pustules are powdery and easily rubbed off',
      'Later the pustules turn black as spores darken',
      'Pustules also appear on stalks and husks in severe cases',
      'Leaves yellow and die back prematurely if infection is heavy',
    ],
    causes: [
      'Air-borne spores blown in from warmer regions each season',
      'Cool, humid weather and prolonged leaf wetness',
      'Dense plantings that slow canopy drying',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (rust) pathogen',
    favourableConditions: 'Cool nights, high humidity, heavy dew and dense canopies.',
    organicRemedies: [
      'Select resistant hybrids with rust tolerance ratings',
      'Remove volunteer maize plants that act as a green bridge',
      'Rotate the field with a non-host crop for one season',
    ],
    chemicalTreatment: [
      'Foliar fungicides containing azoxystrobin, pyraclostrobin or chlorothalonil at the right growth stage',
      'Spray at early tasselling if disease is moving into the ear leaf',
      'Follow a scouting-based schedule rather than calendar spraying',
    ],
    prevention: [
      'Choose resistant hybrids every season',
      'Avoid extremely dense planting',
      'Sow early so the crop avoids peak spore flights where possible',
    ],
    precautions: [
      'Sprays are most effective before pustules reach the ear leaf',
      'Observe pre-harvest intervals for maize grain',
    ],
    mlLabels: ['Corn___Common_rust'],
  },
  {
    diseaseName: 'Northern Leaf Blight',
    plantName: 'Corn',
    description:
      'Northern corn leaf blight, caused by Exserohilum turcicum, produces long grey-green cigar-shaped lesions. It can destroy the leaf area needed for grain filling and is one of the most damaging maize foliar diseases worldwide.',
    symptoms: [
      'Long elliptical cigar-shaped grey-green to tan lesions',
      'Lesions 3-15 cm long, wider in the middle',
      'Lesions often start on lower leaves and move upwards',
      'Under warm humid conditions a fuzzy olive-green growth appears on the lesion surface',
      'Severe infection leads to premature leaf death and small ears',
    ],
    causes: [
      'Survival of the fungus on maize residue left in the field',
      'Conidiospores blown in from nearby fields',
      'Moderate temperatures (18-27 °C) with heavy dew and extended leaf wetness',
    ],
    severity: 'High',
    pathogenType: 'Fungal (exserohilium) pathogen',
    favourableConditions: 'Warm humid weather, 18-27 °C, prolonged leaf wetness.',
    organicRemedies: [
      'Bury or remove crop residue to speed up decomposition',
      'Rotate with a non-host crop for at least one season',
      'Use tolerant hybrids and maintain plant nutrition',
    ],
    chemicalTreatment: [
      'Foliar fungicides such as propiconazole, tebuconazole or azoxystrobin at VT-R1',
      'Spray only if scouting shows lesions on the leaves below the ear before silking',
      'Alternate fungicide mode of action between seasons',
    ],
    prevention: [
      'Select hybrids with known NCLB resistance (Ht genes)',
      'Rotate maize with soybean or other non-hosts',
      'Manage residue by tillage where practical',
    ],
    precautions: [
      'Sprays after silking give limited benefit and may leave residues in grain',
      'Always read the label for crop stage and maximum applications',
    ],
    mlLabels: ['Corn___Northern_Leaf_Blight'],
  },
  {
    diseaseName: 'Gray Leaf Spot',
    plantName: 'Corn',
    description:
      'Gray leaf spot, caused by Cercospora zeae-maydis, produces narrow rectangular lesions restricted by the leaf veins. It thrives in warm humid weather with high-residue no-till systems.',
    symptoms: [
      'Narrow, rectangular lesions with straight parallel edges',
      'Lesions are 1-5 cm long and bounded by leaf veins',
      'Colour changes from tan to grey as the disease matures',
      'Coalescing lesions can blight the whole leaf',
      'Premature plant death and reduced kernel weight',
    ],
    causes: [
      'Fungus surviving on maize residue at or just below the soil surface',
      'Conidia splashed upward by rain onto lower leaves',
      'Warm (25-32 °C) humid weather and prolonged leaf wetness',
      'No-till systems with heavy surface residue',
    ],
    severity: 'High',
    pathogenType: 'Fungal (cercospora) pathogen',
    favourableConditions: 'Warm humid summers, no-till with maize residue, dense canopies.',
    organicRemedies: [
      'Bury residue with a one-off deep tillage pass',
      'Rotate out of maize for one season',
      'Choose hybrids with partial GLS tolerance',
    ],
    chemicalTreatment: [
      'Foliar fungicides such as azoxystrobin or pyraclostrobin at VT-R1',
      'Apply only where disease is confirmed on the leaves below the ear',
      'Rotate fungicide groups to delay resistance',
    ],
    prevention: [
      'Prefer resistant/tolerant hybrids',
      'Reduce surface residue or change the tillage system',
      'Avoid very high seeding rates that create dense canopies',
    ],
    precautions: [
      'Do not exceed the label rate of strobilurin fungicides',
      'Respect pre-harvest intervals',
    ],
    mlLabels: ['Corn___Cercospora_leaf_spot Gray_leaf_spot'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Corn',
    description:
      'No foliar disease was detected on this maize leaf. Keep scouting the lower and middle canopy until the ear-leaf stage, which is the critical window for yield protection.',
    symptoms: [
      'Clean green lamina with no cigar-shaped or rectangular lesions',
      'No rust pustules visible on the leaf surface',
      'Uniform colour from base to tip',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Moderate leaf wetness and a well-ventilated canopy reduce risk.',
    organicRemedies: [
      'Rotate crops and manage residue between seasons',
      'Keep plant nutrition balanced, especially nitrogen',
      'Scout weekly from V8 to VT for early lesions',
    ],
    chemicalTreatment: ['No treatment required at this stage.'],
    prevention: [
      'Plant resistant hybrids',
      'Use a clean seed and a recommended planting density',
      'Scout at least once a week between V8 and R3',
    ],
    precautions: [
      'Healthy-looking upper leaves do not guarantee the lower canopy is clean',
      'Re-check after heavy rain events',
    ],
    mlLabels: ['Corn___healthy'],
  },

  // ==========================================================================
  // GRAPE
  // ==========================================================================
  {
    diseaseName: 'Black Rot',
    plantName: 'Grape',
    description:
      'Grape black rot is caused by Guignardia bidwellii. Brown circular leaf spots with dark margins and tiny black pycnidia appear, and infected berries shrivel into hard black mummies that stay on the cluster.',
    symptoms: [
      'Tan to brown circular leaf spots with a dark border',
      'Tiny black dots (pycnidia) in a ring around the spot margin',
      'Berries develop a light brown soft patch that later turns black and hard',
      'Affected berries shrivel into mummies and stay attached to the cluster',
      'Canes and tendrils may show elongated dark lesions',
    ],
    causes: [
      'Overwintering mummies on the ground and on the trellis',
      'Spores splashing onto young tissue during spring rains',
      'Warm (20-30 °C) humid weather with frequent rain',
      'Dense, shaded canopies that stay wet for long periods',
    ],
    severity: 'High',
    pathogenType: 'Fungal (guignardia) pathogen',
    favourableConditions: 'Warm, humid weather with rain during early shoot growth and fruit set.',
    organicRemedies: [
      'Remove all mummified berries and destroy them away from the vineyard',
      'Prune to open the canopy so clusters dry faster',
      'Apply a dormant copper or lime sulphur spray at pruning',
      'Drip irrigation instead of sprinklers',
    ],
    chemicalTreatment: [
      'Protectant fungicides such as mancozeb, captan or myclobutanil from 3-5 inch shoot growth until bloom',
      'Critical applications at bloom, fruit set and 10-14 days later',
      'Continue protection through veraison in high-pressure seasons',
    ],
    prevention: [
      'Remove mummies and prune out infected canes during dormancy',
      'Ensure good air circulation by hedging and leaf removal',
      'Start the spray programme early, at 3-5 inch shoot growth',
    ],
    precautions: [
      'Many products have a 40-day or longer pre-harvest interval in grapes',
      'Alternate modes of action to avoid resistance',
    ],
    mlLabels: ['Grape___Black_rot'],
  },
  {
    diseaseName: 'Esca (Black Measles)',
    plantName: 'Grape',
    description:
      'Esca, also called black measles, is a trunk disease caused by complex wood-colouring fungi. Leaves develop interveinal yellowing and necrosis with a tiger-stripe pattern, while trunks show dark streaked wood underneath the bark.',
    symptoms: [
      'Interveinal chlorosis with yellow bands between the green veins (tiger stripes)',
      'Marginal and interveinal scorching that progresses inward',
      'Leaf margins curl and necrotic patches appear',
      'Dark brown to black streaks in the wood just under the bark',
      'Sudden wilting and death of individual vines',
    ],
    causes: [
      'Several fungi infecting through pruning wounds',
      'Extreme heat and drought stress followed by sudden rain',
      'Poorly healed pruning cuts, especially during the rainy season',
      'Rootstock and climate stress interactions',
    ],
    severity: 'Critical',
    pathogenType: 'Fungal (complex / grapevine trunk disease)',
    favourableConditions: 'Warm climates, drought stress, heavy rain events, poor wound healing.',
    organicRemedies: [
      'Prune during dry weather only and apply a wound sealant',
      'Remove and destroy infected wood; do not compost it',
      'Replace dead vines with certified disease-free planting material',
      'Reduce vine stress with correct irrigation and balanced nutrition',
    ],
    chemicalTreatment: [
      'No curative treatment exists for infected trunk tissue',
      'Protective trunk paints containing thiabendazole or similar may reduce new infections',
      'Focus on sanitation rather than spraying',
    ],
    prevention: [
      'Always prune in dry weather, never before rain',
      'Use T-budding or double-budding to improve wound healing',
      'Remove diseased vines promptly and replant with clean material',
    ],
    precautions: [
      'Disinfect cutting tools between vines (10% bleach or approved disinfectant)',
      'Never propagate from Esca-infected vines',
    ],
    mlLabels: ['Grape___Esca_(Black_Measles)'],
  },
  {
    diseaseName: 'Leaf Blight (Isariopsis Leaf Spot)',
    plantName: 'Grape',
    description:
      'Grape leaf blight, caused by Pseudocercospora vitis, produces dark angular spots on the underside of the leaf that turn brown and brittle as they age. Severe infection causes early leaf drop and weak canes for the next season.',
    symptoms: [
      'Dark brown to black spots on the lower leaf surface',
      'Spots bounded by veins giving an angular appearance',
      'Spots are larger and more numerous in humid conditions',
      'Leaves turn brown and drop prematurely',
      'Weakened canes and reduced fruit quality',
    ],
    causes: [
      'Spores surviving on fallen leaves and vineyard debris',
      'Rain splash and wind dispersal during warm humid weather',
      'Poor air movement inside a dense canopy',
      'Excess nitrogen creating soft, succulent leaves',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (pseudocercospora) pathogen',
    favourableConditions: 'Warm (25-30 °C) humid summers after rainfall.',
    organicRemedies: [
      'Remove and destroy fallen leaves after harvest',
      'Improve canopy ventilation through leaf removal around the fruit zone',
      'Avoid excessive nitrogen fertiliser',
    ],
    chemicalTreatment: [
      'Copper-based or mancozeb protectant sprays after major rains',
      'Myclobutanil or tebuconazole where the disease is recurring',
      'Spray from fruit set through early veraison',
    ],
    prevention: [
      'Manage canopy density',
      'Balance nitrogen with potassium',
      'Sanitation of leaf litter after harvest',
    ],
    precautions: [
      'Copper products can accumulate in soil, use them sparingly',
      'Respect pre-harvest intervals in grapes',
    ],
    mlLabels: ['Grape___Leaf_blight_(Isariopsis_Leaf_Spot)'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Grape',
    description:
      'This grape leaf shows no signs of black rot, Esca or leaf blight. Keep scouting through the season, especially during bloom and the weeks after, when infections are most likely to start.',
    symptoms: [
      'Even green colour with clear interveinal areas',
      'No dark angular spots on the lower surface',
      'No tiger-stripe pattern or marginal scorching',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Dry canopy and good air movement strongly reduce disease pressure.',
    organicRemedies: [
      'Continue mummy removal and canopy management',
      'Keep irrigation off the foliage',
      'Maintain a preventive dormant spray',
    ],
    chemicalTreatment: ['No treatment required.'],
    prevention: [
      'Scout from bud break through veraison',
      'Remove mummies and prune during dry weather',
      'Keep the fruit zone open with leaf removal',
    ],
    precautions: [
      'Trunk diseases may show no foliar symptoms for years',
      'Consult an expert if shoot dieback is observed',
    ],
    mlLabels: ['Grape___healthy'],
  },

  // ==========================================================================
  // PEPPER (BELL)
  // ==========================================================================
  {
    diseaseName: 'Bacterial Spot',
    plantName: 'Pepper',
    description:
      'Bacterial spot is caused by Xanthomonas species and is one of the most destructive pepper diseases in warm, wet regions. Small water-soaked lesions turn brown-black with a yellow halo and can cause heavy defoliation and sunscald.',
    symptoms: [
      'Small water-soaked spots on the underside of the leaves first',
      'Spots turn brown to black, often with a yellow halo',
      'Spots become angular and slightly sunken as they age',
      'Spots tear out leaving ragged, shot-hole leaves',
      'Sunken scabby spots on fruit that may crack',
    ],
    causes: [
      'Bacteria splashed from infected soil, seed and crop residue by rain',
      'Warm (24-30 °C) wet weather and high humidity',
      'Overhead irrigation and working in wet fields',
      'Seed-borne inoculum from infected seed lots',
    ],
    severity: 'High',
    pathogenType: 'Bacterial (xanthomonas) pathogen',
    favourableConditions: 'Warm, wet weather with frequent storms and overhead irrigation.',
    organicRemedies: [
      'Use certified disease-free seed and resistant varieties',
      'Rotate with non-solanaceous crops for at least two years',
      'Avoid overhead irrigation, use drip only',
      'Apply a copper-based bactericide preventively, combined with mancozeb',
    ],
    chemicalTreatment: [
      'Copper hydroxide or copper octanoate sprays, often tank-mixed with mancozeb',
      'Streptomycin sulfate where legally registered, usually as a seed treatment',
      'Begin at first symptom and repeat every 7-10 days in wet weather',
    ],
    prevention: [
      'Rotate out of pepper, tomato and other solanaceous crops for 2-3 years',
      'Do not work in fields when foliage is wet',
      'Mulch to prevent soil splash onto lower leaves',
    ],
    precautions: [
      'Disinfect stakes, tools and hands between plants',
      'Copper phytotoxicity can burn leaves in hot weather, do not overdose',
    ],
    mlLabels: ['Pepper,_bell___Bacterial_spot'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Pepper',
    description:
      'No bacterial spot was detected on this bell pepper leaf. Maintain clean seed, drip irrigation and a 2-3 year rotation to keep the disease away.',
    symptoms: [
      'Clean green lamina without water-soaked angular spots',
      'No yellow halos around necrotic spots',
      'No shot-hole tearing of the leaf tissue',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Drip irrigation and a clean seed bed greatly reduce bacterial spot.',
    organicRemedies: [
      'Mulch to stop soil splash',
      'Rotate the crop each season',
      'Keep foliage dry with drip rather than sprinkler irrigation',
    ],
    chemicalTreatment: ['No treatment required.'],
    prevention: [
      'Plant certified disease-free seed',
      'Do not handle plants when leaves are wet',
      'Keep a 2-3 year rotation away from solanaceous crops',
    ],
    precautions: [
      'Check new plants regularly during the first month',
      'A healthy leaf does not rule out later infection in humid weather',
    ],
    mlLabels: ['Pepper,_bell___healthy'],
  },

  // ==========================================================================
  // POTATO
  // ==========================================================================
  {
    diseaseName: 'Early Blight',
    plantName: 'Potato',
    description:
      'Early blight is caused by Alternaria solani. It starts on the oldest lower leaves as small dark spots with concentric rings, often called a target or bullseye pattern, and moves upwards as the season progresses.',
    symptoms: [
      'Small dark brown spots on older, lower leaves first',
      'Spots enlarge and develop concentric rings (bullseye/target appearance)',
      'A yellow halo often surrounds each lesion',
      'Lesions cause yellowing and defoliation from the bottom up',
      'Dark sunken lesions with dry corky rot on tubers',
      'Tubers may show dark dry rot when cut open',
    ],
    causes: [
      'Fungus surviving on infected residue, volunteer plants and tubers',
      'Warm (24-29 °C) weather alternating with wet periods',
      'Stress such as drought or heavy irrigation that weakens the canopy',
      'Low nitrogen or potassium, which increases susceptibility',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (alternaria) pathogen',
    favourableConditions: 'Warm days with repeated dew, rain or overhead irrigation and crop stress.',
    organicRemedies: [
      'Remove and destroy infected leaves and crop debris',
      'Rotate with a non-solanaceous crop for 2-3 years',
      'Maintain balanced fertilisation, especially nitrogen and potassium',
      'Straw mulch to reduce soil splash of spores onto lower leaves',
    ],
    chemicalTreatment: [
      'Protectant fungicides such as chlorothalonil or mancozeb applied preventively',
      'Systemic products like azoxystrobin or difenoconazole for active infections',
      'Begin at first symptom and repeat every 7-10 days under pressure',
    ],
    prevention: [
      'Plant certified healthy seed tubers',
      'Rotate crops for 2-3 years',
      'Avoid water stress and heavy irrigation late in the season',
      'Remove volunteer potato plants',
    ],
    precautions: [
      'Harvest in dry conditions to limit tuber infection',
      'Always respect the label and pre-harvest interval',
    ],
    mlLabels: ['Potato___Early_blight'],
  },
  {
    diseaseName: 'Late Blight',
    plantName: 'Potato',
    description:
      'Late blight is caused by Phytophthora infestans and is the most destructive potato disease. Water-soaked lesions expand rapidly and turn brown-black, often with white fungal growth on the leaf underside in humid conditions.',
    symptoms: [
      'Water-soaked pale green lesions, often at leaf tips or margins',
      'Lesions turn dark brown to purplish-black and expand quickly',
      'White downy growth on the underside of lesions in humid weather',
      'Whole foliage can collapse within 3-5 days',
      'Firm brown rot inside tubers, sometimes with a reddish granular rot',
    ],
    causes: [
      'Air-borne sporangia blown in from infected plants or tubers',
      'Cool (10-20 °C) moist weather with long leaf wetness',
      'Infected seed tubers providing the primary inoculum',
      'Dense canopies and overhead irrigation',
    ],
    severity: 'Critical',
    pathogenType: 'Oomycete (phytophthora) pathogen',
    favourableConditions: 'Cool, humid, wet weather; epidemics can start from a single focus.',
    organicRemedies: [
      'Destroy infected plants immediately, do not compost them',
      'Use certified disease-free seed potatoes every season',
      'Preventive copper sprays reduce spread in small plots',
      'Improve drainage and avoid overhead irrigation',
    ],
    chemicalTreatment: [
      'Protectant metalaxyl + mancozeb mixtures or cyazofamid',
      'Systemic products such as mandipropamid, cymoxanil or fluopicolide',
      'Alternate mode of action groups on a 7-day schedule in outbreaks',
    ],
    prevention: [
      'Plant certified seed from inspected fields',
      'Monitor weather forecasts and scout at least twice a week',
      'Remove cull piles and volunteer potatoes',
      'Plant resistant varieties where available',
    ],
    precautions: [
      'This is a reportable disease in many regions, contact the agriculture department',
      'Never save seed from infected plants',
    ],
    mlLabels: ['Potato___Late_blight'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Potato',
    description:
      'No early blight or late blight was detected on this potato leaf. Keep scouting, particularly during cool wet spells when late blight can develop within days.',
    symptoms: [
      'Uniform green leaves without concentric rings',
      'No water-soaked lesions at tips or margins',
      'No white downy growth on the leaf underside',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Dry canopy and moderate temperatures keep disease risk low.',
    organicRemedies: [
      'Maintain even soil moisture',
      'Rotate the crop and remove cull piles',
      'Use clean certified seed every season',
    ],
    chemicalTreatment: ['No treatment required.'],
    prevention: [
      'Scout twice a week during cool wet weather',
      'Avoid excess nitrogen that creates a dense humid canopy',
      'Hill soil properly to protect tubers',
    ],
    precautions: [
      'Late blight symptoms can appear 2-3 days after infection',
      'If symptoms appear, act immediately, do not wait for confirmation',
    ],
    mlLabels: ['Potato___healthy'],
  },

  // ==========================================================================
  // STRAWBERRY
  // ==========================================================================
  {
    diseaseName: 'Leaf Scorch',
    plantName: 'Strawberry',
    description:
      'Strawberry leaf scorch is caused by Diplocarpon earlianum. Numerous small irregular purple spots develop, the leaf tissue between them turns reddish-brown, and the leaf looks burnt or scorched from a distance.',
    symptoms: [
      'Many small irregular dark-purple spots without a white centre',
      'Spots merge and the tissue between them turns red-brown',
      'Leaf margins curl and dry, giving a scorched appearance',
      'Petioles and runners can also develop purple streaks',
      'Weak plants with reduced root crowns and smaller fruit',
    ],
    causes: [
      'Spores surviving on infected leaves that overwinter in the planting',
      'Splash dispersal during irrigation or rain',
      'Warm, humid conditions in dense, poorly ventilated plantings',
      'Overhead irrigation that keeps foliage wet for long periods',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (diplocarpon) pathogen',
    favourableConditions: 'Warm, humid weather with prolonged leaf wetness.',
    organicRemedies: [
      'Renovate the bed after harvest by mowing and removing old leaves',
      'Mulch to keep fruit off the soil and reduce splash',
      'Use drip irrigation instead of overhead sprinklers',
      'Plant resistant cultivars and certified disease-free plants',
    ],
    chemicalTreatment: [
      'Myclobutanil or captan applied at the first sign of scorch in spring',
      'Apply protectant sprays before rainy periods',
      'Rotate modes of action if repeated applications are needed',
    ],
    prevention: [
      'Renovate beds annually and remove old foliage',
      'Use certified disease-free planting material',
      'Space plants well and control weeds for airflow',
    ],
    precautions: [
      'Do not compost infected leaves',
      'Avoid spraying during bloom when bees are active',
    ],
    mlLabels: ['Strawberry___Leaf_scorch'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Strawberry',
    description:
      'This strawberry leaf shows no signs of leaf scorch. Keep the canopy open and the irrigation water off the leaves to preserve that.',
    symptoms: [
      'Clean bright green leaflets',
      'No small purple spots or scorched margins',
      'Healthy petioles with no purple streaks',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Dry foliage between irrigation cycles keeps risk low.',
    organicRemedies: [
      'Renovate the bed after each harvest',
      'Use straw mulch and drip irrigation',
      'Remove old leaves that trap moisture',
    ],
    chemicalTreatment: ['No treatment required.'],
    prevention: [
      'Use certified disease-free plants',
      'Drip irrigate rather than sprinkling',
      'Weed and thin beds for airflow',
    ],
    precautions: [
      'Check leaf undersides regularly, scorch starts there',
      'Avoid overhead irrigation late in the day',
    ],
    mlLabels: ['Strawberry___healthy'],
  },

  // ==========================================================================
  // TOMATO
  // ==========================================================================
  {
    diseaseName: 'Bacterial Spot',
    plantName: 'Tomato',
    description:
      'Tomato bacterial spot, caused by Xanthomonas species, produces small water-soaked lesions that turn dark and scabby. It affects leaves, stems and fruit, and severe infections lead to defoliation and sunscald of exposed fruit.',
    symptoms: [
      'Small water-soaked, greasy-looking spots on leaves',
      'Spots turn brown to black with a yellow halo',
      'Spots are slightly raised on the underside in early stages',
      'Small scabby raised spots on fruit that can be rubbed off',
      'Petioles and stems may show small dark lesions',
      'Severe cases cause defoliation and sun-scalded fruit',
    ],
    causes: [
      'Bacteria splashed from infected debris, seed and stakes by rain or irrigation',
      'Warm (24-30 °C) humid weather',
      'Working in wet plants spreads the disease mechanically',
      'Overhead irrigation and high humidity in polytunnels',
    ],
    severity: 'High',
    pathogenType: 'Bacterial (xanthomonas) pathogen',
    favourableConditions: 'Warm, wet weather with frequent rain or overhead irrigation.',
    organicRemedies: [
      'Use certified pathogen-free seed and resistant varieties',
      'Remove infected plants and residues after harvest',
      'Rotate with non-solanaceous crops for 2-3 years',
      'Apply copper-based bactericide preventively in high-risk areas',
    ],
    chemicalTreatment: [
      'Copper hydroxide or copper octanoate sprays',
      'Copper combined with mancozeb gives better control',
      'Begin at first symptom, repeat every 7-10 days during wet weather',
    ],
    prevention: [
      'Stake and prune plants to improve drying',
      'Drip irrigation instead of overhead sprinklers',
      'Disinfect stakes, tools and trays between crops',
      'Do not handle wet plants',
    ],
    precautions: [
      'Copper can be phytotoxic in hot weather, keep concentrations to the label rate',
      'Disinfect seed with hot water or trisodium phosphate where advised',
    ],
    mlLabels: ['Tomato___Bacterial_spot'],
  },
  {
    diseaseName: 'Early Blight',
    plantName: 'Tomato',
    description:
      'Early blight of tomato is caused by Alternaria solani. It typically begins on the oldest leaves near the soil as brown spots with concentric rings, and can remove a large share of the canopy during fruit ripening.',
    symptoms: [
      'Dark brown spots, 3-10 mm, starting on older lower leaves',
      'Concentric rings inside each spot giving a target/bullseye pattern',
      'A yellow halo surrounds each lesion',
      'Spots enlarge and merge, causing defoliation from the bottom up',
      'Stem lesions are dark, sunken and elongated',
      'Fruit may show a firm sunken dark spot near the stem end',
    ],
    causes: [
      'Fungus surviving on tomato residue and volunteer solanaceous plants',
      'Warm (24-29 °C) weather with alternating wet and dry periods',
      'Splashing of spores from the soil surface onto lower leaves',
      'Stress from drought, heavy pruning or over-fruiting',
      'Low nitrogen or potassium nutrition',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (alternaria) pathogen',
    favourableConditions: 'Warm days with repeated dew, rain or overhead irrigation plus plant stress.',
    organicRemedies: [
      'Remove and destroy the lowest infected leaves once symptoms appear',
      'Mulch the soil with 5-8 cm of straw or plastic to stop spore splash',
      'Rotate the crop for 2-3 years away from solanaceous crops',
      'Keep plants evenly watered to avoid stress',
      'Apply a copper-based fungicide preventively in endemic areas',
    ],
    chemicalTreatment: [
      'Chlorothalonil or mancozeb as protectants from first symptom',
      'Azoxystrobin, difenoconazole or cyprodinil as systemic options',
      'Alternate mode-of-action groups on a 7-day interval under pressure',
      'Repeat every 7-10 days during warm, humid weather',
    ],
    prevention: [
      'Plant certified disease-free seed and resistant varieties',
      'Remove crop residue and volunteer plants after harvest',
      'Stake plants and remove the lowest leaves for airflow',
      'Maintain balanced nutrition and steady soil moisture',
    ],
    precautions: [
      'Respect pre-harvest intervals strictly before picking fruit',
      'Do not apply during high heat or drought stress, leaves may burn',
    ],
    mlLabels: ['Tomato___Early_blight'],
  },
  {
    diseaseName: 'Late Blight',
    plantName: 'Tomato',
    description:
      'Tomato late blight, caused by Phytophthora infestans, is the most aggressive disease of tomato. Water-soaked grey-green lesions turn dark brown and spread rapidly, and under humid conditions white growth appears on the underside of leaves.',
    symptoms: [
      'Irregular water-soaked pale green blotches, often at leaf tips',
      'Lesions turn dark brown or purplish-black and enlarge quickly',
      'White downy growth on the leaf underside in humid weather',
      'Greenish-brown greasy lesions on stems and petioles',
      'Firm brown greasy rot on fruit, sometimes with white growth',
      'Entire plants can collapse within 5-7 days in warm wet weather',
    ],
    causes: [
      'Air-borne spores blown in from infected crops or cull piles',
      'Cool (10-20 °C) moist weather with long periods of leaf wetness',
      'Warm days (20-25 °C) with cool nights, the classic epidemic condition',
      'Overhead irrigation and dense unventilated canopies',
      'Infected transplants carrying the disease into the field',
    ],
    severity: 'Critical',
    pathogenType: 'Oomycete (phytophthora) pathogen',
    favourableConditions: 'Cool wet weather with long leaf wetness; epidemics can be explosive.',
    organicRemedies: [
      'Remove and destroy infected plants immediately, bag them and do not compost',
      'Use copper-based fungicide protectively on remaining plants',
      'Grow under cover with good ventilation to keep leaves dry',
      'Plant resistant varieties where available',
    ],
    chemicalTreatment: [
      'Metalaxyl + mancozeb, or cymoxanil + mancozeb mixtures',
      'Mandipropamid, fluopicolide or cyazofamid for active outbreaks',
      'Alternate FRAC groups every 7 days to prevent resistance',
      'Spray the whole plant, including the underside of leaves',
    ],
    prevention: [
      'Use certified clean transplants and resistant cultivars',
      'Avoid overhead irrigation, use drip',
      'Remove cull piles and volunteer tomato plants',
      'Scout every 2-3 days during cool wet spells',
    ],
    precautions: [
      'Late blight is reportable in many countries, notify the agriculture department',
      'Never save seed from infected fruit',
    ],
    mlLabels: ['Tomato___Late_blight'],
  },
  {
    diseaseName: 'Leaf Mold',
    plantName: 'Tomato',
    description:
      'Leaf mold of tomato, caused by Passalora fulva (formerly Cladosporium fulvum), is mainly a greenhouse disease. It shows pale yellow blotches on the upper leaf surface with olive-green velvety mould underneath.',
    symptoms: [
      'Pale yellow blotches on the upper leaf surface',
      'Olive-green to grey-brown velvety mould on the underside',
      'Older leaves dry out and fall prematurely',
      'Petioles and stems may also show olive mould',
      'Heavy infection reduces fruit size and quality',
    ],
    causes: [
      'Air-borne spores from infected crops and contaminated greenhouses',
      'High humidity (over 85%) and moderate temperatures (22-24 °C)',
      'Poor ventilation in plastic houses',
      'Crowded planting and excessive plant density',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (passalora) pathogen',
    favourableConditions: 'High humidity inside greenhouses with 22-24 °C temperatures.',
    organicRemedies: [
      'Improve greenhouse ventilation and reduce humidity below 85%',
      'Remove and destroy infected leaves',
      'Wipe down greenhouse structures and tools between crops',
      'Space plants properly and prune for airflow',
    ],
    chemicalTreatment: [
      'Chlorothalonil, mancozeb or copper-based fungicides',
      'Sulfur products are effective in greenhouses but not above 30 °C',
      'Biofungicides such as Bacillus subtilis help preventively',
    ],
    prevention: [
      'Control greenhouse humidity with heating and venting',
      'Use resistant varieties carrying the Cf genes where available',
      'Sanitize the greenhouse between crops',
    ],
    precautions: [
      'Sulfur can scorch plants in hot greenhouses, never apply above 30 °C',
      'Rotate fungicide modes of action',
    ],
    mlLabels: ['Tomato___Leaf_Mold'],
  },
  {
    diseaseName: 'Septoria Leaf Spot',
    plantName: 'Tomato',
    description:
      'Septoria leaf spot, caused by Septoria lycopersici, is a very common fungal disease of tomato. Numerous small circular spots with grey centres and dark margins appear, and it can defoliate a plant within two weeks of the first symptom.',
    symptoms: [
      'Many small circular spots, 1.5-6 mm across',
      'Spots have a tan or grey centre with a dark brown margin',
      'Tiny black pycnidia visible in the centre of the spots',
      'Lower leaves turn yellow and drop, starting from the bottom',
      'Fruit and stems are rarely affected directly',
    ],
    causes: [
      'Spores splashing from infected debris, soil and stakes',
      'Warm (20-27 °C) humid weather with frequent leaf wetness',
      'Overhead irrigation and dense canopies',
      'Splashing rain after working in the field',
    ],
    severity: 'Medium',
    pathogenType: 'Fungal (septoria) pathogen',
    favourableConditions: 'Warm humid weather with extended leaf wetness and frequent rain.',
    organicRemedies: [
      'Remove the lowest infected leaves to slow spread upward',
      'Mulch the soil to prevent spore splash',
      'Straw mulch or plastic mulch with drip irrigation',
      'Copper-based fungicides and Bacillus-based biofungicides',
    ],
    chemicalTreatment: [
      'Chlorothalonil, mancozeb or copper fungicides from first symptom',
      'Systemic options such as azoxystrobin where pressure is high',
      'Spray every 7-10 days during wet weather',
    ],
    prevention: [
      'Rotate crops for 2-3 years',
      'Remove crop residue after harvest',
      'Use drip irrigation and space plants for airflow',
      'Stakes and mulch to prevent soil splash',
    ],
    precautions: [
      'Remove badly infected lower leaves only when the weather is dry',
      'Respect pre-harvest intervals',
    ],
    mlLabels: ['Tomato___Septoria_leaf_spot'],
  },
  {
    diseaseName: 'Spider Mites (Two-Spotted Spider Mite)',
    plantName: 'Tomato',
    description:
      'Two-spotted spider mite damage is caused by Tetranychus urticae, a tiny sap-sucking mite that is not a fungus. Fine yellow stippling spreads over the leaf, and heavy infestations are usually accompanied by fine webbing.',
    symptoms: [
      'Fine yellow or bronze stippling across the leaf surface',
      'Leaves look dusty, then turn yellow and bronze',
      'Fine silky webbing on the underside of leaves and growing points',
      'Tiny moving dots (mites) visible on the upper leaf surface',
      'Fruit may show small pale spots and sun-scald damage under the canopy',
    ],
    causes: [
      'Hot, dry weather (25-35 °C) with very low humidity',
      'Dusty plants and water stress that favour mite multiplication',
      'Predatory insects such as ladybirds and phytoseiid mites killed off',
      'Broad-spectrum insecticide use that removes natural enemies',
    ],
    severity: 'Medium',
    pathogenType: 'Pest (mite) damage',
    favourableConditions: 'Hot dry weather with low humidity and dusty plant surfaces.',
    organicRemedies: [
      'Spray the underside of leaves with water to raise humidity and knock mites off',
      'Rinse plants with a strong jet of water every few days',
      'Release or conserve predatory mites and ladybird beetles',
      'Reduce dust on plant surfaces by mulching',
    ],
    chemicalTreatment: [
      'Acaricides such as abamectin, spiromesifen or hexythiazox, rotated by mode of action',
      'Insecticidal soaps and horticultural oils for light infestations',
      'Treat the underside of leaves where mites feed',
    ],
    prevention: [
      'Avoid broad-spectrum insecticides that kill natural enemies',
      'Prevent dust build-up and water stress',
      'Maintain adequate irrigation during hot dry spells',
    ],
    precautions: [
      'Natural enemies recover slowly, avoid broad-spectrum sprays',
      'Oil and soap sprays should not be applied above 32 °C',
      'Rotate acaricide modes of action, resistance develops quickly',
    ],
    mlLabels: ['Tomato___Spider_mites Two-spotted_spider_mite'],
  },
  {
    diseaseName: 'Target Spot',
    plantName: 'Tomato',
    description:
      'Target spot is caused by the fungus Corynespora cassiicola. The lesions have light brown centres with concentric rings, closely resembling early blight, which makes field identification difficult without a laboratory test.',
    symptoms: [
      'Small light brown spots with a darker outer ring',
      'Concentric rings give a target-like appearance',
      'Spots may have a yellow halo',
      'Lesions enlarge and coalesce, causing extensive defoliation',
      'Stem lesions are dark and slightly sunken',
      'Fruit can show sunken dark lesions near the stem',
    ],
    causes: [
      'Fungus surviving on crop residue and alternative hosts such as weeds',
      'Warm (24-30 °C) humid weather with long leaf wetness',
      'Splashing rain or overhead irrigation',
      'High plant density with poor airflow',
    ],
    severity: 'High',
    pathogenType: 'Fungal (corynespora) pathogen',
    favourableConditions: 'Warm humid weather with prolonged leaf wetness.',
    organicRemedies: [
      'Remove crop residue and control weeds around the field',
      'Copper-based fungicides applied preventively',
      'Straw mulch to reduce soil splash',
      'Maintain good airflow through staking and pruning',
    ],
    chemicalTreatment: [
      'Chlorothalonil, mancozeb or copper protectants',
      'Systemic fungicides such as difenoconazole, azoxystrobin or boscalid',
      'Rotate modes of action because resistance is common',
    ],
    prevention: [
      'Plant resistant varieties where available',
      'Rotate crops and remove residues',
      'Avoid overhead irrigation',
    ],
    precautions: [
      'Target spot can be confused with early blight, confirm with an expert',
      'Follow label rates and pre-harvest intervals exactly',
    ],
    mlLabels: ['Tomato___Target_Spot'],
  },
  {
    diseaseName: 'Tomato Yellow Leaf Curl Virus',
    plantName: 'Tomato',
    description:
      'Tomato yellow leaf curl virus (TYLCV) is a whitefly-transmitted begomovirus. Infected plants become stunted with tightly curled, yellowed leaves and small, poorly filled fruit. Yield losses can reach 100 percent.',
    symptoms: [
      'Severe upward curling or cupping of the leaflets',
      'Leaflets turn bright yellow between the veins',
      'Leaflets become small, thick and brittle',
      'Strong stunting of the whole plant',
      'Flower drop and very small, poorly filled fruit',
      'Symptoms appear on the youngest leaves first',
    ],
    causes: [
      'Silverleaf whitefly (Bemisia tabaci) carrying the virus',
      'Infected transplants brought into the field',
      'Nearby tomato, cotton or weed reservoirs of the virus and vector',
      'Warm dry weather favouring whitefly populations',
    ],
    severity: 'Critical',
    pathogenType: 'Viral (begomovirus) pathogen',
    favourableConditions: 'Hot dry weather that produces large whitefly migrations.',
    organicRemedies: [
      'Use insect-proof netting (40-50 mesh) in nurseries',
      'Yellow sticky traps to monitor and reduce whitefly numbers',
      'Remove and destroy infected plants immediately, bag them',
      'Grow a border of a non-host trap crop or barrier plants',
      'Reflective mulch to deter whitefly landing',
    ],
    chemicalTreatment: [
      'There is no chemical cure for the virus itself',
      'Control the whitefly vector with systemic insecticides such as imidacloprid or spiromesifen',
      'Vector control works best on a community or area-wide basis',
    ],
    prevention: [
      'Plant TYLCV-tolerant hybrids',
      'Use virus-free seedlings raised under netting',
      'Control whitefly in neighbouring fields and on weeds',
      'Maintain a 2-week gap between crops where possible',
    ],
    precautions: [
      'Never compost infected plants, dispose of them safely',
      'Insecticide resistance in whitefly is widespread, rotate modes of action',
    ],
    mlLabels: ['Tomato___Tomato_Yellow_Leaf_Curl_Virus'],
  },
  {
    diseaseName: 'Tomato Mosaic Virus',
    plantName: 'Tomato',
    description:
      'Tomato mosaic virus (ToMV) and Tomato mottle mosaic virus (ToMMV) cause mottling, mosaic patterns and leaf distortion. ToMV is easily spread mechanically through hands, tools and contaminated seed.',
    symptoms: [
      'Light and dark green mosaic mottling on the leaves',
      'Fern-like narrowing and distortion of leaflets (shoestring symptom)',
      'Slight upward curling of leaf margins',
      'Uneven fruit ripening with blotchy internal walls',
      'Stunted plants with reduced yield',
    ],
    causes: [
      'Mechanical transmission on hands, tools, clothing and stakes',
      'Contaminated seed or planting material',
      'Contact with infected tobacco products (TMV)',
      'Weeds such as Solanum nigrum acting as reservoirs',
    ],
    severity: 'High',
    pathogenType: 'Viral (tobamovirus) pathogen',
    favourableConditions: 'Any condition that increases handling of plants when they are wet.',
    organicRemedies: [
      'Wash hands with soap before handling plants',
      'Disinfect tools with 10% bleach or a suitable disinfectant',
      'Remove and destroy infected plants',
      'Control volunteer solanaceous weeds',
    ],
    chemicalTreatment: [
      'There is no chemical treatment for the virus',
      'Insecticides are not useful because tobamoviruses spread mechanically, not by insects',
    ],
    prevention: [
      'Use certified virus-free seed and seedlings',
      'Do not smoke or handle tobacco plants near tomato crops',
      'Disinfect tools, stakes, trays and hands routinely',
      'Plant resistant varieties carrying the Tm-2 gene',
    ],
    precautions: [
      'The virus is extremely stable and survives for years in plant debris',
      'Remove infected plants early to protect the rest of the crop',
    ],
    mlLabels: ['Tomato___Tomato_mosaic_virus'],
  },
  {
    diseaseName: 'Healthy',
    plantName: 'Tomato',
    description:
      'No disease was detected on this tomato leaf. It looks clean and healthy. Keep up the good practices below, and remember to scout weekly, because tomato diseases can appear within days in warm humid weather.',
    symptoms: [
      'Uniform green colour with no spots, lesions or mottling',
      'Leaves are flat and not curled or distorted',
      'No yellowing of the leaf margins or interveinal areas',
      'Healthy stem and petiole colour',
    ],
    causes: ['No pathogen detected in the uploaded image.'],
    severity: 'Low',
    pathogenType: 'No disease detected',
    favourableConditions: 'Dry foliage, good airflow and balanced nutrition keep tomato healthy.',
    organicRemedies: [
      'Maintain a preventive routine of removing the lowest leaves for airflow',
      'Use mulch to stop soil splash onto the foliage',
      'Water at the base with drip irrigation, never over the leaves',
      'Rotate the crop and clean up residue after harvest',
    ],
    chemicalTreatment: [
      'No treatment required',
      'A preventive fungicide programme is justified in fields with a history of early or late blight',
    ],
    prevention: [
      'Scout weekly, twice a week during cool wet spells',
      'Plant certified clean seedlings and resistant varieties',
      'Space plants properly and stake them upright',
      'Keep soil moisture steady, avoid stress',
    ],
    precautions: [
      'A clean-looking leaf does not rule out very early infection',
      'If symptoms develop later, capture a photo and get advice before spraying',
    ],
    mlLabels: ['Tomato___healthy'],
  },
];

module.exports = diseases;