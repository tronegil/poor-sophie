# PassageScore

Resultatet etter «Beregn» (`frontend/src/components/passage/PassageResults.jsx`), likt på forsiden og båtsiden.

- Svaret først, som én linje fra forsidens skala: scoren og båndnavnet i `display`, i `ink`, på en 6px vannlinje i båndfargen. Linja krenger like mye som båndet (0° Blikkstille til 8° Bli på land, `BAND_HEEL` i `bands.js`). Fargen bor i linja, ikke i tallet.
- Over: tid og distanse som en setning («man. 00:00 til 03:00. 16,6 nm på 3,0 timer.»).
- Under: båndets egen tekst fra `landing.bands` («Noen blir stille. Spis før, ikke underveis.»), så verste time og tidevann som setninger.
- Resten er seksjoner skilt med `line`-hårlinjer, ikke kort (`ResultSection`): overskrift til venstre på brede skjermer, over innholdet på smale. Rekkefølge: Mannskapet, Beste avgang de neste 48 timene, Hva som drar opp, Langs ruten.
- Langs ruten: én søyle per tidssteg, høyden er scoren, fargen er båndet. Full tabell time for time bak «Vis time for time».

Forbrukeren gir: resultatet fra `/passage/score`, valgt mannskap, og avgangsstripa som `departures`.
