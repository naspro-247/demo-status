# HMO Claims Tracker

A cross-platform (Expo + React Native + TypeScript) app for a Health
Maintenance Organization (HMO) to track claims submitted by healthcare
facilities and the amounts actually paid against them.

## Features

- **Dashboard** — headline totals (claimed, approved, paid, outstanding),
  the share of approved value paid, and a per-facility outstanding-balance
  breakdown.
- **Claims list** — every claim with its status and outstanding balance.
- **Claim detail** — walk a claim through its lifecycle
  (`submitted → under_review → approved → partially_paid → paid`, or
  `rejected`) and record payments against approved claims.
- **New claim** — submit a claim for a facility with a reference and amount.

Monetary amounts are stored as integer minor units (kobo) to avoid
floating-point rounding errors.

## Project layout

```
App.tsx                     App shell + simple tab navigation
src/domain/                 Pure business logic (claims, payments, analytics, money)
src/state/                  Reducer + React context store
src/screens/                Dashboard, Claims, ClaimDetail, NewClaim screens
src/ui/                     Presentational components + theme
src/data/seed.ts            Demo data
```

## Getting started

```bash
npm install
npm start          # then press "a" for Android, "w" for web, etc.
```

## Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm test`              | Run the Jest unit/component tests    |
| `npm run test:coverage` | Run tests with a coverage report     |
| `npm run typecheck`     | Type-check with `tsc --noEmit`       |
| `npm run lint`          | Lint with `eslint-config-expo`       |

## Testing

Unit tests cover the domain logic and state reducer; component tests
(via `@testing-library/react-native`) cover the screens. The domain and
reducer modules are covered at ~90–100%.
