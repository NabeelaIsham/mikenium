# Security policy

## Reporting a vulnerability

Do not open a public issue containing customer data or exploit details. Report suspected
vulnerabilities privately to the security contact configured for the production domain.
Include the affected URL, reproduction steps, impact, and any relevant request ID. Do not
access, modify, or retain data belonging to another customer while testing.

## Supported deployment

Only the current `main` release deployed through `compose.yaml` is supported. Development
servers, preview servers, and deployments that bypass HTTPS, the release check, migrations,
or required production environment validation are not supported for customer data.

## Required response process

1. Preserve relevant logs without broadly distributing personal information.
2. Revoke affected sessions and credentials and contain exposed services.
3. Assess affected data, people, jurisdictions, and notification deadlines with counsel.
4. Patch and verify the issue in staging, then deploy through the normal release gate.
5. Notify affected customers and authorities when required, document the timeline, and
   complete a post-incident review.

Secrets must be rotated after suspected exposure. Rotating `BACKUP_ENCRYPTION_KEY` requires
a controlled backup transition because old encrypted backups depend on the previous key.
