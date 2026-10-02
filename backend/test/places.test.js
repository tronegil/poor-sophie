// Place search: parsing Geonorge responses and the cache, offline.
const test = require('node:test');
const assert = require('node:assert/strict');

const SAMPLE = {
  metadata: { totaltAntallTreff: 3 },
  navn: [
    { stedsnavn: [{ skrivemåte: 'Tau', navnestatus: 'hovednavn' }], navneobjekttype: 'Tettsted', kommuner: [{ kommunenavn: 'Strand' }], representasjonspunkt: { 'øst': 5.9167, nord: 59.0646, koordsys: 4258 } },
    { stedsnavn: [{ skrivemåte: 'Tauholmen', navnestatus: 'sidenavn' }, { skrivemåte: 'Tauholmen', navnestatus: 'hovednavn' }], navneobjekttype: 'Holme', kommuner: [{ kommunenavn: 'Stavanger' }], representasjonspunkt: { 'øst': 5.70, nord: 59.0 } },
    { stedsnavn: [{ skrivemåte: 'Tau', navnestatus: 'hovednavn' }], navneobjekttype: 'Tettsted', kommuner: [{ kommunenavn: 'Strand' }], representasjonspunkt: { 'øst': 5.9167, nord: 59.0646 } }, // duplicate
    { skrivemåte: 'Flat shape', navneobjekttype: 'Nes', kommunenavn: 'Karmøy', representasjonspunkt: { 'øst': 5.25, nord: 59.14 } },
    { stedsnavn: [{ skrivemåte: 'No position' }], representasjonspunkt: {} },
  ],
};

let calls = 0;
global.fetch = async url => { calls++; assert.match(String(url), /sok=Tau&/); return { ok: true, json: async () => SAMPLE }; };

const { parsePlaces, searchPlaces } = require('../src/routes/places');

test('parsePlaces normalises, dedupes and drops hits without a position', () => {
  const places = parsePlaces(SAMPLE);
  assert.deepEqual(places.map(p => p.name), ['Tau', 'Tauholmen', 'Flat shape']);
  assert.deepEqual(places[0], { name: 'Tau', type: 'Tettsted', municipality: 'Strand', lat: 59.0646, lon: 5.9167 });
  assert.equal(places[2].municipality, 'Karmøy');
  assert.deepEqual(parsePlaces(null), []);
});

test('searchPlaces caches by query', async () => {
  const a = await searchPlaces('Tau');
  const b = await searchPlaces('tau');
  assert.equal(a.length, 3);
  assert.equal(b, a);
  assert.equal(calls, 1);
});
