# Contributing to Warrant

Thank you for your interest in contributing to Warrant. This document outlines our development workflow and standards.

## Development Setup

1. **Fork & clone** the repository
2. **Install dependencies**: `npm install`
3. **Start local services**: `docker compose up -d` (PostgreSQL, Redis, Meilisearch, Mailpit)
4. **Set up environment**: `cp .env.example .env` and fill in values
5. **Push database schema**: `npm run db:push`
6. **Seed data**: `npm run db:seed`
7. **Start dev server**: `npm run dev`

## Code Standards

See [docs/architecture.md](docs/architecture.md), [docs/testing.md](docs/testing.md),
and [docs/api-patterns.md](docs/api-patterns.md) for detailed conventions.

## Making Changes

1. **Create a branch** from `main` with a descriptive name (e.g., `fix/reputation-overflow`, `feature/comment-system`)
2. **Make your changes** following the standards above
3. **Write/update tests** for any changed behavior
4. **Run the test suite**: `npm test`
5. **Ensure the build passes**: `npm run build`
6. **Submit a pull request** with a clear description of what changed and why

## Commit Messages

Use clear, imperative-mood commit messages:

- `Add rate limiting to correction API`
- `Fix reputation score overflow when penalty exceeds 100`
- `Update distribution scoring weights`

## Integrity Model

If your contribution touches the integrity system (reputation, labels, distribution, corrections, flags), please be especially careful:

- The integrity model is the core of the platform. Changes affect journalist livelihoods.
- Review [docs/integrity-model.md](docs/integrity-model.md) before making changes.
- Add tests that cover edge cases (zero scores, maximum penalties, boundary conditions).
- Document your reasoning in the PR description.

## Questions?

Open an issue or reach out to the maintainers. We value thoughtful contributions over fast ones.
