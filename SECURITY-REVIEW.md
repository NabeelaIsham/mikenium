# Security review — 2026-10-18

The reviewed application has meaningful access controls, but this review is not a guarantee against compromise. Changes below are local and require deployment. Live observations describe the currently deployed site, not the patched code.

## Findings addressed

| Finding | Change | Scope |
| --- | --- | --- |
| Known dependency advisories | Updated Nodemailer to 10.0.9, proxy-addr to 2.0.8, source-map-js to 1.2.2, and the affected concurrently/shell-quote development dependencies; committed manifests/lockfiles must be deployed together. | Registry audit reported high/critical advisories. Exploitability depends on use: the proxy advisory concerns subnet trust, whereas this application uses hop-count trust; build/development dependencies are not equivalent to public server exposure. |
| Malformed percent-encoded cookies caused an exception before authentication handling | Added bounded, fail-closed session-cookie parsing, including duplicate-cookie rejection. | Prevents unauthenticated malformed cookies from reaching the 500 handler and triggering operational alerts. This was not an authentication bypass. |
| Local URL validation accepted browser-normalized backslash/control-character paths | Reject these characters before accepting local URLs; sanitize gallery URLs when returning public blog data. | Prevents disguised external paths from bypassing the local URL rule. Content editing still requires admin authorization. |
| Environment-file exclusions did not cover every local variant | Added `.env.*` exclusions to Git and Docker, preserving tracked Git example files. | Preventive hardening; no credential leak was demonstrated. |

## Verified protections

- Admin routes require server-validated sessions and an active SUPER_ADMIN user. JWT verification pins HS256, issuer and audience, and checks the database session.
- Login requires a password plus TOTP, rejects reused TOTP counters, and has database-backed IP/account throttling.
- Production session cookies use Secure, HttpOnly, SameSite=Strict and the `__Host-` prefix. Logout removes the server session.
- Browser origin checks protect admin mutations; CORS is restricted to configured origins.
- Reviewed database queries bind user values as parameters. Dynamic update fields come from explicit mappings.
- Upload routes require admin access, have byte limits, generate filenames, and check file signatures. Signature checking is not full image decoding or malware scanning.
- Production configuration uses restrictive CSP, security headers, private Docker database networking, a read-only application filesystem, and an unprivileged service process after container initialization.
- Backups created by the service use AES-256-GCM. Restore also accepts legacy plaintext backups; that compatibility is not an authenticated encrypted-file guarantee.

## Validation completed

- Client, server and root dependency audits: zero known vulnerabilities reported after the updates. This is a point-in-time registry result, not proof that dependencies contain no flaws.
- `npm test`: 29 passed, 1 database integration test skipped.
- `npm run build`: passed.
- New local HTTP tests: all 14 admin route groups reject anonymous access; malformed/forged sessions, cross-origin mutation, anonymous uploads and anonymous restore attempts are rejected without database access. These tests use isolated configuration and a database stub.
- Nodemailer 10: composed contact, reply, newsletter and alert messages with an offline transport; checked escaping and TLS configuration. No email was sent and live SMTP delivery was not tested.
- Read-only live check against `https://mikenium.com`: CSP, MIME/frame/HTTPS headers, entrypoint SHA-384 integrity, local fonts, HEAD response, and anonymous rejection on users/blogs/settings/backups endpoints passed.
- No tracked real `.env` files or historical commits for the inspected standard secret-file paths were found. A limited tracked-file pattern scan found no private-key, AWS-access-key or GitHub-token signatures. This is not an exhaustive secret/history audit.

## Outstanding deployment checks

1. **Database least privilege:** `compose.yaml` uses the database initialization account in the application's DATABASE_URL. A separate restricted runtime role is not configured. Verify deployed role privileges and separate migration/bootstrap privileges from the runtime application. This change needs a tested deployment/migration plan; it was not applied to an unknown live database.
2. **Host and network:** verify firewall rules, SSH access, patch levels, container image vulnerabilities, and that database/application ports are not publicly exposed outside the supplied Compose setup. Host access was not available for this review.
3. **Traffic protection:** login/contact/newsletter throttling exists, but general public reads and blog view-counter writes have no application-wide rate limit. Verify edge traffic limits and DDoS protection; those cannot be inferred from passing HTTP header checks.
4. **Database-backed workflows:** TEST_DATABASE_URL was not configured, so real login/MFA/revocation, publication and backup-restore integration tests were not rerun against a disposable database.
5. **Operational security:** verify secret storage/rotation, alert delivery, offsite backup access and restore drills. The current startup flow and credentials were not changed or rotated.
6. **Deployment:** rebuild/redeploy the frontend and backend with the updated lockfiles; rerun `node scripts/security-check.js` afterward. Local repairs do not patch the currently running server.

No brute-force, load, destructive restore, host exploitation, or production data-changing tests were performed.
