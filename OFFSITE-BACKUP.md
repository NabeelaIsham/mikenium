# Off-site backup setup

The application encrypts backups before copying them to `BACKUP_OFFSITE_PATH`.
That path must be mounted or replicated to storage outside the VPS and its
hosting account. Creating a second folder on the VPS is not an off-site backup.

1. Provision the external storage destination and configure its mount or
   replication using that storage service's instructions. Keep storage
   credentials outside the repository. Keep a recovery copy of the existing
   `BACKUP_ENCRYPTION_KEY` in the company's password manager.
2. Set `BACKUP_OFFSITE_PATH` in `.env.production` to the existing absolute Linux
   directory. Make it writable by the application's UID/GID `1000:1000` using
   the storage provider's supported ownership or mount settings. Arrange for
   the mount to be available before Docker starts the application.
3. Run `docker compose --env-file .env.production config --quiet`. The bind
   mount uses `create_host_path: false` so a missing path fails instead of
   silently creating a local directory. This does not detect a disconnected
   remote mount that leaves its local mount point behind.
4. Application startup checks that it can write, read back, and remove a
   random probe as the unprivileged application user. For an already running
   deployment, repeat this with:

   ```sh
   docker compose --env-file .env.production exec app npm run backup:check
   ```

5. Create an encrypted database-and-files backup in the admin dashboard.
   Confirm that the matching `.backup` file exists on the external destination
   using its independent console or another machine. For asynchronous
   replication, wait for completion and verify its status.
6. Restore a downloaded copy into an isolated staging deployment using sample
   data. Verify database records and uploaded images. Record the destination,
   filename, date, operator, and restore result with the release evidence.
7. Only after these checks pass, mark `offsiteBackupTargetVerified` and
   `restoreDrillCompleted` true in `.production-approvals.json`. Verify the
   alert channel and record `monitoringAlertsTested` separately.

The access probe proves only read/write access. It cannot prove external
replication, retention, provider availability, or recovery after losing the
VPS. Monitor those through the storage service and test recovery regularly.

Application backup deletion also removes its off-site copy. Configure
independent retention or versioning at the external destination if recovery
from accidental deletion is required. Do not rotate the encryption key while
backups encrypted with it are still needed.
