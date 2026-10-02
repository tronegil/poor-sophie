# PassageScore

Resultatpanelet etter «Beregn»: stort tall, båndmerke, båndets setning, måledata og en stripe med score time for time.

- Tallet står i `score`-stilen (`display`, 72px) i `ink`, ikke i båndfargen. Fargen bor i merket og i stripen.
- Øyenbrynet (`label`) sier ruten og varigheten: «Stavanger → Tau · 3 t 10 min».
- Setningen under merket er båndets egen tekst fra `landing.bands` («Kaffen blir i koppen.»).
- Måledata i `data`-stilen: «Hs 1,6 m · Tp 4,1 s · motsjø · 5,5 kn».
- Timestripen: én søyle per tidssteg, høyden er scoren, fargen er båndet. Akse med klokkeslett i mono under.
- Dette er skjermens ene `ps-panel` (`radius-lg`, `shadow-panel`).

Forbrukeren gir: score, bånd, rute-etikett, måleverdier og en liste med timescore.
