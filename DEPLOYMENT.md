# Namecheap VPS production deployment

This deployment runs the React site and API in one application container, PostgreSQL on a private Docker network, and Caddy as the public HTTPS reverse proxy. Caddy obtains and renews Let's Encrypt certificates automatically.

## 1. Prepare DNS and the VPS

Use an Ubuntu 24.04 LTS VPS with at least 2 GB RAM. In Namecheap Advanced DNS, create an `A` record for the chosen domain pointing to the VPS public IPv4 address. DNS must resolve before Caddy can issue a certificate.

Install current Docker Engine and the Docker Compose plugin using Docker's official Ubuntu instructions. Allow inbound TCP ports 22, 80, and 443 and UDP port 443 in both the VPS firewall and any provider firewall. Restrict SSH to key authentication and disable password-based root login.

## 2. Configure secrets

Copy the repository to the VPS, enter its directory, and create the production environment:

```sh
cp .env.production.example .env.production
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
chmod 600 .env.production
```

Put the first generated value in `POSTGRES_PASSWORD`, the second in `JWT_SECRET`, and the third in `BACKUP_ENCRYPTION_KEY`. Hex values avoid URL-escaping problems in the PostgreSQL connection string. Set `DOMAIN` to the hostname whose DNS record points to the VPS, without `https://`. Configure the SMTP values with an app-specific mailbox password.

Never rotate `BACKUP_ENCRYPTION_KEY` until all backups encrypted with the old key have expired or been safely re-encrypted. Losing this key makes those backups unrecoverable.

## 3. Build and start

```sh
docker compose --env-file .env.production config
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 app caddy
```

The application container applies the idempotent database schema before starting. PostgreSQL is not published to the internet.

Create the initial super-admin without putting the password in the shell history:

```sh
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
docker compose --env-file .env.production exec -e ADMIN_PASSWORD app npm run admin:create
unset ADMIN_PASSWORD
```

The password must contain at least 12 characters. Sign in at `https://YOUR_DOMAIN/admin`.

## 4. Verify the release

```sh
curl --fail https://YOUR_DOMAIN/api/health
curl --fail https://YOUR_DOMAIN/api/ready
curl --head https://YOUR_DOMAIN/
docker compose --env-file .env.production exec db pg_isready -U mikenium -d mikenium
```

Verify the contact form, SMTP delivery, admin login/logout, an image upload, an encrypted backup download, and a restore drill using non-production sample data before accepting real customer information.

## 5. Backups and operations

Application backups in the `backups_data` volume are AES-256-GCM encrypted, but a local VPS volume is not an off-site backup. Copy encrypted backups to a second provider or object-storage account on a schedule. Also take periodic `pg_dump` exports and test restoration. Keep at least one copy outside the Namecheap account.

Useful operational commands:

```sh
docker compose --env-file .env.production logs -f --tail=200 app
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production exec db pg_dump -U mikenium -d mikenium -Fc -f /tmp/mikenium.dump
```

Before updates, create and export a backup. Retain the previous Git revision so the application image can be rebuilt from it. Database changes must remain backward compatible when an application rollback is required.

## Launch checklist

- Replace all example domains, mailbox values, and secrets.
- Confirm DNS and automatic HTTPS renewal.
- Configure VPS security updates, SSH hardening, firewalling, disk monitoring, and external uptime/error alerts.
- Configure off-site encrypted backups and complete a restore drill.
- Publish reviewed Privacy Policy, Terms of Service, and Cookie Policy pages.
- Verify every public statistic, availability statement, price, address, and social link.
- Run `npm run check` before each deployment.
