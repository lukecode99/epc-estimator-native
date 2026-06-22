export const BANDS = [
  { band: 'A', min: 92, max: 100, color: '#00A651', label: 'Very energy efficient' },
  { band: 'B', min: 81, max: 91,  color: '#50B848', label: 'Energy efficient' },
  { band: 'C', min: 69, max: 80,  color: '#BED600', label: 'Fairly efficient' },
  { band: 'D', min: 55, max: 68,  color: '#FFD700', label: 'Average efficiency' },
  { band: 'E', min: 39, max: 54,  color: '#F7941D', label: 'Below average' },
  { band: 'F', min: 21, max: 38,  color: '#EF3E33', label: 'Poor efficiency' },
  { band: 'G', min: 1,  max: 20,  color: '#CC0000', label: 'Very poor efficiency' },
];

export const FLOOR_PRESETS = {
  flat:      [{ label: 'Studio',  m2: 35 }, { label: '1-bed', m2: 50 }, { label: '2-bed', m2: 65 }, { label: '3-bed', m2: 85 }],
  terraced:  [{ label: '2-bed',   m2: 70 }, { label: '3-bed', m2: 90 }, { label: '4-bed', m2: 110 }],
  semi:      [{ label: '2-bed',   m2: 75 }, { label: '3-bed', m2: 95 }, { label: '4-bed', m2: 115 }],
  detached:  [{ label: '3-bed',  m2: 110 }, { label: '4-bed', m2: 140 }, { label: '5-bed+', m2: 180 }],
  bungalow:  [{ label: '2-bed',   m2: 65 }, { label: '3-bed', m2: 85 }, { label: '4-bed', m2: 105 }],
}

export const QUESTIONS = [
  { key: 'propertyType', text: 'What type of property is it?', type: 'choice', options: [
    { label: 'Detached house', value: 'detached' },
    { label: 'Semi-detached house', value: 'semi' },
    { label: 'Terraced house', value: 'terraced' },
    { label: 'Flat / apartment', value: 'flat' },
    { label: 'Bungalow', value: 'bungalow' },
  ]},
  { key: 'storeys', text: 'How many storeys does the property have?', type: 'choice', options: [
    { label: '1 storey', value: '1' },
    { label: '2 storeys', value: '2' },
    { label: '3 or more storeys', value: '3plus' },
  ]},
  { key: 'floorArea', text: 'Approximate floor area?', type: 'number', unit: 'square metres (m²)', placeholder: 'e.g. 85' },
  { key: 'constructionEra', text: 'When was the property built?', type: 'choice', options: [
    { label: 'Before 1930', value: 'pre1930' },
    { label: '1930 – 1966', value: '1930_1966' },
    { label: '1967 – 1982', value: '1967_1982' },
    { label: '1983 – 1995', value: '1983_1995' },
    { label: '1996 – 2010', value: '1996_2010' },
    { label: 'After 2010', value: 'post2010' },
  ]},
  { key: 'wallType', text: 'What type of walls does the property have?', type: 'choice', options: [
    { label: 'Solid walls — no insulation', value: 'solid_none' },
    { label: 'Solid walls — insulated', value: 'solid_ins' },
    { label: 'Cavity walls — uninsulated', value: 'cavity_none' },
    { label: 'Cavity walls — insulated', value: 'cavity_ins' },
    { label: 'Not sure', value: 'unknown' },
  ]},
  { key: 'floorInsulation', text: 'Is the ground floor insulated?', type: 'choice', options: [
    { label: 'Yes — insulated throughout', value: 'insulated' },
    { label: 'Mixed — some areas insulated, others not (e.g. extension differs)', value: 'mixed' },
    { label: 'No — uninsulated suspended floor', value: 'uninsulated' },
    { label: 'Solid concrete floor (no insulation needed)', value: 'concrete' },
    { label: 'Not sure', value: 'unknown' },
  ]},
  { key: 'loftInsulation', text: 'How much loft insulation is there?', type: 'choice', options: [
    { label: 'No loft insulation', value: 'none' },
    { label: 'Less than 100mm', value: 'partial' },
    { label: '100mm – 200mm', value: '100mm' },
    { label: '200mm or more', value: '200mm' },
    { label: 'Flat roof / no loft', value: 'flat' },
  ]},
  { key: 'glazing', text: 'What type of windows?', type: 'choice', options: [
    { label: 'Single glazing', value: 'single' },
    { label: 'Mostly single, some double', value: 'partial' },
    { label: 'Double glazing throughout', value: 'double' },
    { label: 'Triple glazing', value: 'triple' },
  ]},
  { key: 'draughtProofing', text: 'How well draughtproofed is the property?', type: 'choice', options: [
    { label: 'Well sealed — doors, windows and floors draughtproofed', value: 'well' },
    { label: 'Partial — some gaps sealed', value: 'partial' },
    { label: 'Draughty — noticeable cold air coming in', value: 'draughty' },
    { label: 'Not sure', value: 'unknown' },
  ]},
  { key: 'conservatory', text: 'Is there a conservatory or extension?', type: 'choice', options: [
    { label: 'No conservatory or extension', value: 'none' },
    { label: 'Unheated conservatory (separated from house)', value: 'unheated' },
    { label: 'Heated conservatory (part of living space)', value: 'heated' },
    { label: 'Insulated extension', value: 'extension' },
  ]},
  { key: 'heatingType', text: 'Main heating system?', type: 'choice', options: [
    { label: 'Gas boiler (central heating)', value: 'gas' },
    { label: 'Oil boiler', value: 'oil' },
    { label: 'Heat pump (air or ground)', value: 'heatpump' },
    { label: 'Electric storage heaters', value: 'storage' },
    { label: 'Direct electric heaters', value: 'electric' },
  ]},
  { key: 'boilerAge', text: 'How old is the boiler / heating system?', type: 'choice', options: [
    { label: 'Less than 5 years', value: 'under5' },
    { label: '5 – 10 years', value: '5_10' },
    { label: '10 – 15 years', value: '10_15' },
    { label: 'Over 15 years', value: 'over15' },
    { label: 'Not applicable (heat pump / electric)', value: 'na' },
  ]},
  { key: 'heatingControls', text: 'What heating controls are fitted?', type: 'choice', options: [
    { label: 'Full controls — room thermostat, programmer and TRVs on radiators', value: 'full' },
    { label: 'Partial — thermostat and timer, but no TRVs (or TRVs but no thermostat)', value: 'partial' },
    { label: 'Thermostat only', value: 'thermostat_only' },
    { label: 'No controls / not sure', value: 'none' },
  ]},
  { key: 'hotWater', text: 'How is hot water heated?', type: 'choice', options: [
    { label: 'Same boiler as heating (combi boiler)', value: 'combi' },
    { label: 'Separate gas water heater / cylinder', value: 'gas' },
    { label: 'Electric immersion heater', value: 'immersion' },
    { label: 'Solar thermal / heat pump', value: 'solar' },
  ]},
  { key: 'solarPV', text: 'Are there solar panels (PV) on the roof?', type: 'choice', options: [
    { label: 'No solar panels', value: 'none' },
    { label: 'Small system — up to 2kW (around 6 panels)', value: 'small' },
    { label: 'Medium system — 2–4kW (around 8–12 panels)', value: 'medium' },
    { label: 'Large system — 4kW+ (13+ panels)', value: 'large' },
  ]},
  { key: 'lighting', text: 'What proportion of lights are LED or low-energy?', type: 'choice', options: [
    { label: 'All LED / low-energy bulbs', value: 'all_led' },
    { label: 'Mostly LED (over half)', value: 'mostly_led' },
    { label: 'Mixed — roughly half and half', value: 'mixed' },
    { label: 'Mostly or all traditional bulbs', value: 'mostly_old' },
  ]},
];
