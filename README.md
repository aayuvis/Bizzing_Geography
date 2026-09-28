# Bizzing Geography

Maps, continents, capitals, weather and the restless Earth for kids 6–14 — then GeoGuesser,
flags, state capitals, landmarks and Earth Through Time in the Library.

**Live:** <https://aayuvis.github.io/Bizzing_Geography/>

```bash
cd app && npm install
npm run dev      # Vite on :8080
npm test         # data, questions, levels, model, library
npm run build && npm run check   # drives the built app in Chromium, desktop + phone
./deploy.sh      # test + build + publish gh-pages
```

Read [CLAUDE.md](CLAUDE.md) before changing anything.

## Credits

- Maps: [Natural Earth](https://www.naturalearthdata.com/) (public domain), India point-of-view
  edition; India's states from [Bizzing India](https://github.com/aayuvis/bizzingindia.com).
- Country data: [mledoze/countries](https://github.com/mledoze/countries) (ODbL).
- Flags: [flag-icons](https://github.com/lipis/flag-icons) (MIT).
- Avatars: [Bizzing Bee](https://github.com/aayuvis/Bizzing-Bee)'s painted set.
- Fonts: Baloo 2, Nunito, Sono (SIL OFL).
- Paintings: made with an AI image model (`tools/art/gen.py`); every one is labelled in the app.
