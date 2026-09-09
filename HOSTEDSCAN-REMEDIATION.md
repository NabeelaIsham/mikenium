# HostedScan report remediation — 9 September 2026

Target: `mikenium.com`. Source: the supplied 21-page HostedScan PDF, with
4 medium and 4 low findings (no high or critical findings).

| Finding | Change | Deployment status |
| --- | --- | --- |
| Missing font stylesheet integrity | Replaced Google Fonts stylesheet with locally bundled, version-locked fonts. Production HTML also receives SHA-384 integrity for its entry scripts, stylesheet, and module preloads. | Implemented locally; rebuild and deploy required. |
| CSP wildcard directives | Explicit `style-src 'self'`, `font-src 'self'`, and `img-src 'self' data:`. Optional external image hosts require exact HTTPS origins. | Implemented locally; deploy required. |
| CSP `style-src unsafe-inline` | Removed `unsafe-inline`; inline style attributes are explicitly blocked. Trusted React code can still set individual style properties. | Implemented locally; browser verification covers public pages and admin navigation. |
| Weak SSH MAC algorithms | Prepared an SSH drop-in allowing SHA-2 and 128-bit encrypt-then-MAC algorithms, excluding both reported 64-bit UMAC algorithms. | VPS access required. |
| TCP timestamps | Prepared a host sysctl drop-in setting `net.ipv4.tcp_timestamps=0`. | VPS access required. |
| Open port 22 | Restrict SSH to a trusted administrator IP/CIDR or VPN through the VPS firewall. | Requires the owner's trusted network details; no firewall changes made. |
| Open port 80 | Keep for HTTP-to-HTTPS redirects and certificate validation. Live HTTP returned a 308 redirect to HTTPS. | Expected public website service. |
| Open port 443 | Keep for HTTPS. | Expected public website service. |

The live HTTPS header still contained the old permissive CSP when checked.
The connection to `deploy@162.0.233.164` failed with
`Permission denied (publickey,password)`. No server changes were made by that
attempt. These findings must not be marked resolved on the live deployment
until the updated application and host configuration have been verified there.

## Local verification results

- 20 unit tests passed; production frontend build passed.
- Disposable PostgreSQL integration and headless Edge browser checks passed.
- No CSP violations were observed during the public-page and admin workflow checks.
- `security:check` passed against the local built application, including actual
  asset hash verification and the corrected HEAD response.
- The host installer passed shell syntax validation. It has not run on the VPS.
- Font package installation reported zero known dependency vulnerabilities;
  the fonts' OFL licenses are included in `client/public/licenses`.

## Deploy the application changes

These edits are local and uncommitted. Review and publish the intended changes
to the deployment branch first; `git pull` cannot retrieve unpublished edits.
Once the intended revision is available on that branch, use the existing VPS
process:

```sh
ssh deploy@162.0.233.164
cd /opt/mikenium
git status --short
git pull --ff-only
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
curl --fail https://mikenium.com/api/health
curl --fail https://mikenium.com/api/ready
```

The earlier project changes require a working off-site backup mount at startup.
Check [OFFSITE-BACKUP.md](./OFFSITE-BACKUP.md) before deploying this working tree.
Preserve existing production secrets and do not mark pending reviews approved.

Images uploaded through the dashboard work with the default policy. If current
CMS content intentionally uses an external image server, add only its exact
origin to `.env.production`, for example:

```dotenv
CSP_IMAGE_ORIGINS=https://media.your-company-domain.com
```

Use actual trusted origins; paths, wildcards, HTTP origins, credentials, and
scheme-only sources are rejected. Normal outbound links to projects, products,
and partners are unaffected.

After deployment, run from a checkout with Node installed:

```sh
npm run security:check -- https://mikenium.com
```

This checks the homepage, services page, and admin HTML; the effective CSP;
entrypoint integrity hashes against downloaded assets; external font links;
and the homepage HEAD response. It does not replace the HostedScan network scan.

## Apply the prepared host changes

Keep the current SSH connection open and have the VPS recovery console
available. Run on the Ubuntu VPS, not inside an application container:

```sh
cd /opt/mikenium
sudo sh deploy/host-security/apply.sh --apply
sudo sshd -T | grep '^macs '
sysctl net.ipv4.tcp_timestamps
```

The script validates SSH configuration, saves the two previous drop-in files
and timestamp value under `/var/backups/mikenium-hostedscan.*`, verifies that
the new MAC list takes effect, applies the sysctl, and reloads SSH. Failure
triggers rollback. It leaves SSH authentication, SSH ports, and firewall rules
unchanged. Open a second SSH session successfully before closing the first.
Linux execution is still required; local shell syntax validation alone cannot
verify the VPS configuration.

Linux normally randomizes timestamp offsets per connection. Thus the scanner's
timestamp observation alone does not prove that system uptime is exposed.
Disabling timestamps resolves the reported feature detection but removes TCP
timestamp functionality; assess performance after applying it.

For port 22, add a provider-firewall allow rule for the owner's trusted IP/CIDR
or VPN first, verify a new SSH connection from that network, then remove public
SSH access. Do not use an assumed IP or the automation runner's temporary IP.
Keep TCP 80/443 available for this public web service. Scan from an untrusted
network to verify the SSH restriction.

## Authoritative references

- [MDN: CSP style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src) — stylesheet restrictions and direct JavaScript style-property updates.
- [Fontsource installation](https://fontsource.org/docs/getting-started/install) — locally served, package-managed fonts.
- [OpenSSH MAC configuration](https://man.openbsd.org/sshd_config#MACs) — supported MACs and encrypt-then-MAC behavior.
- [Linux TCP sysctl documentation](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html#tcp-timestamps-integer) — timestamp values and randomized offsets.
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https) — HTTP redirects and certificate validation.
