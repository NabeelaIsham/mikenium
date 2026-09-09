# Verification — 9 September 2026

## Passed locally

- `npm run check`: 18 server tests passed; frontend production build passed.
  The separate integration test is intentionally skipped by this unit command.
- Disposable PostgreSQL 18 database: migrations, all nine admin CRUD modules,
  draft/public visibility, settings privacy, contact messages and internal
  notes, newsletter confirmation/unsubscribe state changes, MFA login/session/
  logout, image uploads, encrypted backup creation, and sample-data restoration.
- Playwright with headless Edge: eleven public pages, admin login screen and
  thirteen navigation destinations, service creation through the UI, reload
  persistence, publication on the public website, noindex settings, and mobile
  homepage overflow. No JavaScript runtime errors were observed.
- Server and client dependency updates: both npm audits reported zero known
  vulnerabilities after compatible fixes.
- Backup access probe: passed for a writable test directory and failed for a
  missing destination. This was a local storage test, not off-site replication.
- `git diff --check`: passed.

## Changes made

- Integration commands now create and remove their own test database and fail
  when `TEST_DATABASE_URL` is missing; application credentials are not loaded.
- Empty prices no longer become zero, and changing a custom plan to a priced
  plan requires prices for all supported currencies.
- Scheduled blog updates require a publishing date.
- Invalid JSON returns HTTP 400 instead of a server error.
- Initial HTML respects noindex/maintenance settings, maintenance returns 503
  with Retry-After, and React preserves the noindex setting after loading.
- Unknown paths beginning with `admin` no longer resolve to the admin page.
- Deployment refuses to create a missing backup bind directory and checks
  storage access as the application user before running migrations.
- CI now includes the disposable-database browser workflow. Shell scripts use
  LF line endings for Linux deployment.

## Remaining production work

The owner confirmed the VPS, domain, and SMTP mailbox exist, but their existing
configuration and access details were not available for this verification.
Local `.env.production` and `.production-approvals.json` were created from
templates. They contain no production credentials or completed approvals.
`npm run release:check` correctly remains blocked.

- Populate the local deployment configuration with the existing production
  values. Preserve the live database password, JWT, MFA, and backup keys.
- Provision genuine off-site storage and follow [OFFSITE-BACKUP.md](./OFFSITE-BACKUP.md).
- Verify live DNS/HTTPS, real mailbox delivery, monitoring, and an external-copy
  restore drill; complete the required review records truthfully.
- Run the container build and deployment checks on the VPS or CI. Docker was
  not available in this local environment, and no live deployment was made.

The local tests do not certify production security, legal review, live email
delivery, or protection against losing the VPS.
