# Button

Knapp i fire varianter: `primary` for skjermens ene hovedhandling, `secondary` for alt annet, `accent` sjelden, `quiet` som lenkeknapp.

- **Primary** (`deep` / `on-deep`): én per skjerm. «Beregn», «Lagre», «Legg til båt».
- **Secondary** (`surface`, `line`-kant): «Nullstill rute», «Avbryt», «Rediger».
- **Accent** (`magenta` / `on-magenta`): bare for deling og andre handlinger som peker ut av appen.
- **Quiet** (magenta tekst): tekstlenker som er knapper, f.eks. «Hele regnestykket, kilder og referanser».
- Fokus: 2px `magenta`-ring med 2px avstand.
- Teksten er et verb som sier hva som skjer. Under arbeid: samme verb med «…» og `disabled`.

Klasser: `ps-btn` + `ps-btn--primary|secondary|accent|quiet`.
