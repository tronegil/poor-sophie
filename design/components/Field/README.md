# Field

Skjemafelt: mono-etikett i versaler over feltet, valgfri enhet inni feltet og hjelpetekst under.

- Etiketten bruker `label`-stilen i `ink-muted`. Kort, ett eller to ord: «Avgang», «Fart», «Båt».
- Tall (fart, lengde, deplasement, tid) bruker `ps-input--data` (mono, tabulære tall). Enheten (kn, m, kg) står i feltet, ikke i etiketten.
- Kant `line` i hvile, `ink-muted` ved hover, `magenta` ved fokus.
- Bruk norsk desimalkomma i visning: «5,5 kn».

Forbrukeren gir: `<label class="ps-field">`, en `ps-label`, ett `ps-input`, valgfritt `ps-unit` og `ps-hint`.
