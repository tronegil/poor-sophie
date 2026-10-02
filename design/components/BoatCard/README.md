# BoatCard

Kort for én båt i «Mine båter»: bilde øverst, navn, type og år, og om båten er offentlig.

- Uten bilde: et lite kartutsnitt i `shallow` og `land`, ikke en ⛵-emoji.
- Navn i `h3`, type og år i `data`-stilen i `ink-muted`.
- «Offentlig» får `magenta`-kant og -tekst, «Privat» er nøytral (`line` / `ink-muted`).
- Kortet har `line`-kant og ingen skygge; hover mørkner kanten.

Forbrukeren gir: navn, type, år, `photo_url` (valgfri), `is_public`, lenke.
