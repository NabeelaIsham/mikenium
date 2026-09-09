#!/bin/sh
set -eu

# Run only on the Ubuntu VPS, from a session with a working recovery console.
# Changes only the two named drop-in files; never changes SSH authentication,
# listening ports, firewall rules, or unrelated SSH configuration.
if [ "${1:-}" != "--apply" ]; then
  echo "Usage: sudo sh deploy/host-security/apply.sh --apply"
  echo "Keep this SSH session open and verify a second login after applying."
  exit 2
fi
[ "$(id -u)" = 0 ] || { echo "Run as root using sudo." >&2; exit 1; }
command -v sshd >/dev/null
command -v sysctl >/dev/null
command -v systemctl >/dev/null
sshd -t
systemctl is-active --quiet ssh

source_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ssh_target=/etc/ssh/sshd_config.d/00-mikenium-hostedscan.conf
tcp_target=/etc/sysctl.d/60-mikenium-tcp.conf
backup_dir=$(mktemp -d /var/backups/mikenium-hostedscan.XXXXXX)
old_timestamps=$(sysctl -n net.ipv4.tcp_timestamps)
ssh_existed=false
tcp_existed=false
if [ -e "$ssh_target" ]; then cp -p "$ssh_target" "$backup_dir/ssh.conf"; ssh_existed=true; fi
if [ -e "$tcp_target" ]; then cp -p "$tcp_target" "$backup_dir/tcp.conf"; tcp_existed=true; fi
printf '%s\n' "$old_timestamps" > "$backup_dir/tcp-timestamps-before"

rollback() {
  trap - EXIT HUP INT TERM
  if [ "$ssh_existed" = true ]; then cp -p "$backup_dir/ssh.conf" "$ssh_target"; else rm -f "$ssh_target"; fi
  if [ "$tcp_existed" = true ]; then cp -p "$backup_dir/tcp.conf" "$tcp_target"; else rm -f "$tcp_target"; fi
  sysctl -w "net.ipv4.tcp_timestamps=$old_timestamps" || true
  if sshd -t; then systemctl reload ssh || true; fi
  echo "Host security update failed; previous settings restored. Backup: $backup_dir" >&2
  exit 1
}
trap rollback EXIT HUP INT TERM
install -d -m 0755 /etc/ssh/sshd_config.d /etc/sysctl.d
install -m 0644 "$source_dir/00-mikenium-hostedscan.conf" "$ssh_target"
sshd -t
expected=$(awk '/^MACs / { print $2 }' "$source_dir/00-mikenium-hostedscan.conf")
actual=$(sshd -T | awk '/^macs / { print $2 }')
if [ "$actual" != "$expected" ]; then
  echo "The SSH drop-in is not taking effect. Check Include ordering in sshd_config." >&2
  exit 1
fi
install -m 0644 "$source_dir/60-mikenium-tcp.conf" "$tcp_target"
sysctl -p "$tcp_target"
[ "$(sysctl -n net.ipv4.tcp_timestamps)" = 0 ]
systemctl reload ssh
trap - EXIT HUP INT TERM
echo "SSH MAC and TCP settings applied. Previous settings: $backup_dir"
echo "Verify a new SSH connection before closing the current session. Firewall rules were not changed."
