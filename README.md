# Trip Flow

> A mobile travel planner built with Expo and React Native: plan trips, add stages on a map, keep a checklist and write a journal, all stored on the device.

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-expo--sqlite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

**Résumé (FR)** : application mobile de préparation de voyages (Expo / React Native). On crée des voyages avec une image de couverture, on ajoute des étapes géolocalisées sur une carte, on tient une checklist et un journal de bord. Comptes et données sont stockés localement dans SQLite, sans serveur.

## Features

- Local sign up / log in with a persistent session (`expo-secure-store`).
- Trips: create, edit, delete, with dates (date picker) and a cover image.
- Stages: add and edit stages with a location picker; trips are shown on a map (`react-native-maps`) with markers and a route line.
- Checklist per trip.
- Journal entries per trip, with photos (`expo-image-picker`, `expo-image`).
- User profile with first and last name.
- Demo data seeded on first launch (demo account `demo@tripflow.app`).

## Architecture

```
app/                 # Expo Router file-based routes
├── (tabs)/          # Home, Explore, Profile tabs
├── auth/            # login, signup, SessionProvider, local repository
├── trips/           # trips list/new, [id]/stages, checklist/, journal/
└── lib/db/          # SQLite connection, migrations, utils (hashing, uuid)
components/          # shared UI (date input, location picker, trip map...)
types/               # local type declarations
```

All data lives in an on-device SQLite database (tables: users, trips, steps, journals, checklists, checklist_items). There is no backend.

## Getting started

Requirements: Node.js 20+, npm, Android Studio / Xcode or Expo Go.

```sh
npm install
npx expo start          # then press a / i, or scan the QR code with Expo Go
npm run android         # development build
npm run ios
```

Maps need a development build or platform keys for production use; check the `react-native-maps` documentation.

## Tests

No automated tests yet (see the open issues).

## What it demonstrates

- Cross-platform mobile development with Expo Router and strict TypeScript.
- Local-first persistence: SQLite schema, versioned migrations and repository modules.
- Maps, image picking, date and location inputs.
- A session provider and a simple auth flow.

## License

MIT, see [LICENSE](LICENSE).
