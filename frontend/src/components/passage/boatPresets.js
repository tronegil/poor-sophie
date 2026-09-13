// Common boats on the Norwegian coast with the hull data the model needs.
// Displacement is light-ship-ish in kg; keel per the most common version.
// Sorted by length so the picker reads naturally.
export const BOAT_PRESETS = [
  { id: 'folkebat',        name: 'Nordisk Folkebåt',            loa_m: 7.68,  displacement_kg: 1930,  hull_type: 'monohull',  keel_type: 'long' },
  { id: 'maxi77',          name: 'Maxi 77',                     loa_m: 7.7,   displacement_kg: 2000,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'albin_vega',      name: 'Albin Vega',                  loa_m: 8.25,  displacement_kg: 2300,  hull_type: 'monohull',  keel_type: 'long' },
  { id: 'maxi84',          name: 'Maxi 84',                     loa_m: 8.4,   displacement_kg: 2900,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'compromis888',    name: 'Compromis 888',               loa_m: 8.9,   displacement_kg: 3300,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'hr31',            name: 'Hallberg-Rassy 31',           loa_m: 9.4,   displacement_kg: 4500,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'oceanis31',       name: 'Bénéteau Oceanis 31',         loa_m: 9.66,  displacement_kg: 4300,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'bavaria32',       name: 'Bavaria 32',                  loa_m: 9.99,  displacement_kg: 4600,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'maxi1000',        name: 'Maxi 1000',                   loa_m: 9.99,  displacement_kg: 4500,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'x99',             name: 'X-99',                        loa_m: 9.99,  displacement_kg: 3700,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'elan333',         name: 'Elan 333',                    loa_m: 10.0,  displacement_kg: 4300,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'so349',           name: 'Jeanneau Sun Odyssey 349',    loa_m: 10.34, displacement_kg: 5300,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'hanse341',        name: 'Hanse 341',                   loa_m: 10.4,  displacement_kg: 5400,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'dehler34',        name: 'Dehler 34',                   loa_m: 10.5,  displacement_kg: 5100,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'najad343',        name: 'Najad 343',                   loa_m: 10.5,  displacement_kg: 6300,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'hr352',           name: 'Hallberg-Rassy 352',          loa_m: 10.54, displacement_kg: 6200,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'dufour36',        name: 'Dufour 36',                   loa_m: 10.9,  displacement_kg: 6000,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'bavaria37',       name: 'Bavaria 37 Cruiser',          loa_m: 11.3,  displacement_kg: 6900,  hull_type: 'monohull',  keel_type: 'fin' },
  { id: 'lagoon380',       name: 'Lagoon 380 (katamaran)',      loa_m: 11.55, displacement_kg: 7200,  hull_type: 'catamaran', keel_type: 'fin' },
  { id: 'colin_archer',    name: 'Colin Archer-type 40 fot',    loa_m: 12.2,  displacement_kg: 14000, hull_type: 'monohull',  keel_type: 'long' },
];

export const CUSTOM_ID = 'custom';
export const DEFAULT_PRESET_ID = 'bavaria32';
