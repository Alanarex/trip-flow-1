# CLAUDE.md

## Stack
- Expo SDK 54, Expo Router 6 (file-based routes), React 19, React Native 0.81, TypeScript ~5.9 (new architecture enabled).
- `expo-sqlite` (local DB), `expo-secure-store` (session), `react-native-maps`, `expo-location`, `expo-image-picker`, `expo-image`, `js-sha256`.
- No backend, no CI, no automated tests, no Docker.

## Structure
- `app/`: routes. `(tabs)/`, `auth/` (login, signup, SessionProvider, `repo/local.ts`), `trips/` (list, new, `[id]/stages`, `checklist/`, `journal/`), `lib/db/` (connection, migrations, utils).
- `components/`, `hooks/`, `constants/`, `types/`, `scripts/reset-project.js` (Expo template script, do not run: it deletes starter code).

## Commands
- Install: `npm install`
- Dev: `npx expo start`; native builds: `npm run android` / `npm run ios`
- Lint: `npm run lint` (`expo lint`)
- Type-check: `npx tsc --noEmit`
- Dependency alignment: `npx expo install --check`, `npx expo-doctor`
- Tests: none

## Conventions
- Default branch is `master`. Work on `refresh/<topic>` branches and open a PR; never commit directly to `master`.
- Data access goes through repository modules (`app/**/repo.ts`) with parameterised SQL; schema changes go in `app/lib/db/migrations.ts`.
- Use `npx expo install` for Expo-managed packages.
- No secrets in the repo (`.env` is git-ignored). No history rewrite or force push without explicit approval. Do not alter commit dates or authors.

## Known issues
- Duplicate/leftover template screens: `app/(tabs)/index_new.tsx`, `explore_new.tsx`.
- Passwords use salted, iterated SHA-256 (not a memory-hard KDF); the seeded demo user has a known password.
- `@types/react-native` is installed directly and `@react-native-community/geolocation` is unmaintained (expo-doctor).
- Remaining npm audit findings are in Expo/Metro tooling and need an SDK upgrade.
