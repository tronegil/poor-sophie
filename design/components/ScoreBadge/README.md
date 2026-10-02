# ScoreBadge

Pillen som viser en kvalmescore og båndet den havner i, alltid med både tall og ord.

- Bånd: under 2 `band-flat`, under 4 `band-comfortable`, under 6 `band-uncomfortable`, under 8 `band-bucket`, ellers `band-ashore` (samme grenser som `bandFor()` i koden).
- Tekst: `ink-on-band-light` på de tre lyse, `ink-on-band-dark` på de to mørke. Båndene blir mørkere jo verre det er, så de skilles også uten fargesyn.
- Vis alltid båndnavnet. Fargen alene er aldri nok.
- Tall med én desimal og komma på norsk: «6,4».

Klasser: `ps-badge ps-band-<band>`, tallet i `<b>`.
