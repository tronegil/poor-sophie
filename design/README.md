# Poor Sophie — designsystem

> **Status: forslag.** Ikke tatt i bruk i `frontend/` ennå. Levende versjon med fargeprøver, typografi og komponent-forhåndsvisninger: [Poor Sophie designsystem](https://claude.ai/artifact/GSZFJftFCbBkGjb8DDmdr8).
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

## Tilstander

- Fokus: alltid en solid 2px `magenta`-ring (minst 3:1 mot både `paper`, `surface` og `deep`).
- Hover på sekundære flater: bakgrunn til `shallow`. Hover på kort: kanten mørkner til `ink-muted`.
- Deaktivert: 45 % opasitet og `not-allowed`-peker. Under arbeid: verbet med «…» («Beregner…»).
- Bevegelse: korte overganger (150 ms) på farge og kant. Respekter `prefers-reduced-motion`.

## Ikoner

- Ingen emoji. Bruk en enkel strekikon-familie (Lucide, 1,75px strek) i `ink-muted`, eller i `on-deep` på `deep`.
- Ordmerket er navnet i `display` med en `magenta`-prikk: et fyr på kartet. Ingen tegnet logo finnes ennå.

## Fra dagens kode

Dette er et forslag. I dag bruker appen Inter, Tailwinds `ocean`-blå og `slate`-grå, emoji som ikoner og grønn→rød for båndene. For å ta i bruk systemet: legg fargetokenene inn i `tailwind.config.js` som CSS-variabler, bytt fontlenken i `index.html`, og oppdater `BAND_COLORS` i `components/passage/bands.js`.
