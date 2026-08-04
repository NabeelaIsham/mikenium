# Database migrations

`schema.sql` is the immutable `0000_baseline` migration. Add subsequent changes here as
`0001_description.sql`, `0002_description.sql`, and so on. Never edit an applied
migration; the startup runner verifies SHA-256 checksums and refuses to start if migration
history has been rewritten.

Each migration runs once, in filename order, inside the same transaction and under a
PostgreSQL advisory lock. Make migrations safe for both a fresh database and the currently
deployed schema.
