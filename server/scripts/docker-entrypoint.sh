#!/bin/sh
set -eu

# Restored or recreated Docker volumes may be root-owned. Repair only the
# application-owned writable mounts, then run the service unprivileged.
mkdir -p /opt/mikenium/server/uploads /opt/mikenium/server/backups
chown -R node:node /opt/mikenium/server/uploads /opt/mikenium/server/backups

exec su-exec node sh -c 'node scripts/init-db.js && exec node src.js'
