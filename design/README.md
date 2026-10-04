# Poor Sophie — designsystem

> **Status: i bruk.** Tatt i bruk i `frontend/`, med både Dag og Natt. Levende versjon med fargeprøver, typografi og komponent-forhåndsvisninger: [Poor Sophie designsystem](https://claude.ai/artifact/GSZFJftFCbBkGjb8DDmdr8).
>
> Filer her: `tokens.json` (farger for Dag/Natt, typografi, avstand, radius, skygge), `components/bundle.css` (komponentklasser `ps-*`), og én mappe per komponent med `README.md` og `preview.html`. Forhåndsvisningene forventer CSS-variablene fra `tokens.json` (`--paper`, `--ink`, `--magenta`, `--font-display` …).

Poor Sophie ser ut som et sjøkart: kjølig kartpapir, dypt navy vann, sandgult land og én kartmagenta aksent, slik sjøkartet bruker magenta for fyr og merker. Kvalmeindeksen er det eneste stedet appen får sterke farger, og der betyr fargene noe.

## Innhold og tone

- Skriv som en erfaren skipper som snakker til mannskapet: direkte, litt tørr humor, aldri dramatisk. Båndtekstene er tonen: «Kaffen blir i koppen.» «Det finnes alltid en i morgen.»
- Du-form. Norsk først, engelsk som oversettelse; samme poeng på begge språk, ikke ordrett.
- Setningsstor bokstav i titler og knapper: «Mine båter», «Legg til båt», ikke «Legg Til Båt».
- Knapper er verb som sier hva som skjer: «Beregn», «Lagre», «Kopier offentlig lenke». Bekreftelsen gjentar verbet: «Lenke kopiert!».
- Tall med norsk desimalkomma og enheter sjøfolk bruker: «5,5 kn», «Hs 1,4 m», «Tp 6,2 s», «LOA 10,5 m».
- Vær ærlig om usikkerhet: indeksen er «et anslag, ikke et løfte».
- Ingen emoji i grensesnittet. ⛵ og 🤢 erstattes av ordmerket og kartflater.

## Farger

- Sidebakgrunn `paper`, kort og paneler `surface`, tekst `ink`, sekundærtekst `ink-muted`.
- `deep` er dypt vann: navigasjonslinja, forsidens hero og primærknappen. Tekst på den er `on-deep`.
- `shallow` og `land` er kartflater. Bruk `shallow` til rolige markeringer (valgt rad, info-boks) og `land` bare i illustrasjoner, coveret og tomme bildefelt. Aldri `land` som sidebakgrunn.
- `magenta` er systemets eneste aksent: ruten i kartet, lenker, fokusring, aktiv fane og «Offentlig». Maks én magenta flate per skjerm; resten er strek og tekst.
- De fem båndfargene (`band-flat` … `band-ashore`) brukes bare om kvalmescoren. De blir mørkere jo verre det er, så de leses også i gråtoner. Tekst på dem: `ink-on-band-light` på de tre lyse, `ink-on-band-dark` på de to mørke. Vis alltid båndnavnet ved siden av fargen.
- Semantisk farge og aksent blandes ikke: en feilmelding bruker `band-ashore`, aldri `magenta`.
- To temaer, Dag og Natt. Natt er for nattseiling og kveldsplanlegging; magenta lysner til `#f06bb5` der og får mørk tekst (`on-magenta`).

## Typografi

- Tre familier: `display` (Bricolage Grotesque) for titler og scoren, `body` (Hanken Grotesk) for tekst, `mono` (IBM Plex Mono) for etiketter og måledata.
- `score` (72px) brukes til ett tall per skjerm: kvalmescoren. `hero` bare på forsiden, 36px på mobil.
- Sidetitler `h1`, seksjoner `h2`, korttitler og båtnavn `h3`, brødtekst `body`, hjelpetekst `small`.
- Etiketter over felt og øyenbryn bruker `label`: mono, versaler, 0,08em sperring, `ink-muted`.
- Alle måleverdier (bølgehøyde, periode, fart, tider, koordinater) står i `data` med tabulære tall.
- Overskrifter får `text-wrap: balance`; brødtekst holdes rundt 65 tegn bred.

## Avstand, form og flater

- Avstandsskala `space-1` (4px) til `space-16` (64px). Minst `space-4` sidemarg på mobil. `space-12` mellom seksjoner i appen, `space-16` på forsiden.
- Radius: `radius-sm` for felt og chips, `radius-md` for knapper og kort, `radius-lg` for det ene store panelet (passasjeplanleggeren / resultatet), `radius-pill` for scoremerket og språkvelgeren.
- Skiller lages med `line`-hårlinjer, ikke skygger. `shadow-panel` brukes bare på panelet som ligger over forsidens hero.
- Kortene i en rad har samme høyde og samme indre polstring (`space-4`).

## Kartet

- Ruten tegnes i `magenta`, 3px, med veipunkter som hvite sirkler med `magenta`-kant og mono-tall.
- Kartrammen er `surface` med `line`-kant og `radius-md`.
- Fargelegging av ruten etter score bruker båndfargene, aldri magenta.
- I Natt blir kartflisene invertert til et nattkart (`--map-tiles-filter` i `theme.css`), og zoomknapper og kildehenvisning følger temaet. Ruten og markørene beholder fargene sine.

## Tilstander

- Fokus: alltid en solid 2px `magenta`-ring (minst 3:1 mot både `paper`, `surface` og `deep`).
- Hover på sekundære flater: bakgrunn til `shallow`. Hover på kort: kanten mørkner til `ink-muted`.
- Deaktivert: 45 % opasitet og `not-allowed`-peker. Under arbeid: verbet med «…» («Beregner…»).
- Bevegelse: korte overganger (150 ms) på farge og kant. Respekter `prefers-reduced-motion`.

## Ikoner

- Ingen emoji. Bruk en enkel strekikon-familie (Lucide, 1,75px strek) i `ink-muted`, eller i `on-deep` på `deep`.
- Ordmerket er navnet i `display` med en `magenta`-prikk: et fyr på kartet. Ingen tegnet logo finnes ennå.

## Forsiden

Forsiden (Kvalmeindeks) bruker fargene her, men har egen typografi og layout, scopet under `.kv` i `frontend/src/pages/landing.css`:

- Én familie: Schibsted Grotesk, fra titler til tall. Etiketter i vanlig setningsstor skrift, ikke mono-versaler. Tall med proporsjonale sifre (de tabulære gir kommaet et helt siffers bredde).
- Heroen er skalaen (`components/landing/HeelScale.jsx`): båndnavnene stort, hvert på en vannlinje i båndfargen, som krenger mer jo verre båndet er (0° til 8°, alle samme vei så linjene ikke krysser). På smale skjermer krenger navn, linje og beskrivelse sammen; på brede står beskrivelsen i vater i egen kolonne.
- Hover ruller en linje rundt krengningen, med større utslag og kortere periode jo verre båndet er. Ellers står alt stille. `prefers-reduced-motion` slår av begge deler.
- Beregnet tur vises som en magenta bøye på linja til båndet sitt. Magenta fordi det er rutens farge i kartet.
- Ingen navy hero-flate, ingen skygge på planleggeren, ingen ikonkort. Tekstseksjonene er avsnitt i to kolonner.

## I koden

- Fargene ligger som CSS-variabler per tema i `frontend/src/theme.css` (Dag på `:root`, Natt via `prefers-color-scheme: dark` eller `data-theme="dark"`). Temavalget (Som enheten / Dag / Natt) lagres i `localStorage` (`theme`) via `src/theme.js`, settes før første tegning i `index.html`, og velges i Innstillinger og på forsiden (`components/brand/ThemePicker`).
- Tokenene speiles i `frontend/tailwind.config.js`, som leser variablene: `paper`, `surface`, `shallow`, `land`, `line`, `ink`/`ink-muted`, `deep`/`deep-on`, `magenta`, `band-*`, og fontene `font-display`, `font-sans`, `font-mono`. `ocean` og `slate` er lagt om til samme palett, så eldre klasser følger med.
- `frontend/src/index.css` har `.label-mono` (etiketter) og `.data` (måleverdier), og setter `h1`/`h2` i display-fonten og magenta fokusring.
- Båndfargene og tekstfarge på bånd ligger i `components/passage/bands.js` (`bandColor`, `bandInk`).
- Fontfamiliene er variabler (`--font-sans`, `--font-display`, `--font-mono` i `theme.css`), som `tailwind.config.js` leser. Forsiden bytter dem i `.kv`.
- Merkevarebiter i `components/brand/`: `Wordmark` (navn + magenta prikk), `ChartTile` (kartutsnitt for båter uten bilde), `Isobaths` (dybdekurver på navy flater).
- Ikoner: `lucide-react`, 1,75 strek.
- Endrer du en farge i `tokens.json`, oppdater `theme.css` (og `bands.js` for båndene).
