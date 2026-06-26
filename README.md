# Nextcloud Text & Hex Editor

[![License: AGPL-3.0-or-later](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Nextcloud 34](https://img.shields.io/badge/Nextcloud-34-0082c9.svg)](https://nextcloud.com/)
[![PHP 8.2+](https://img.shields.io/badge/PHP-8.2%2B-777bb4.svg)](composer.json)
[![Repository](https://img.shields.io/badge/GitHub-DBase--In--Rs%2Fnextcloud--hex-181717.svg)](https://github.com/DBase-In-Rs/nextcloud-hex)

Nextcloud Text & Hex Editor adds a file action for opening files directly inside Nextcloud as either editable text or a read-only hexadecimal preview.

It is designed for administrators and power users who need to inspect unknown files, shell scripts, keys, certificates, logs, configuration files, and binary payloads without downloading them first.

## Features

- Open unknown files from the Files app.
- Edit text-like files in a full-screen editor.
- Save text changes through the Nextcloud file API.
- Switch between Text and Hex modes from the editor toolbar.
- Preview binary files as hexadecimal rows with ASCII output.
- Use Back, Close, Undo, Save, Text, and Hex controls.
- Warn before discarding unsaved changes.
- Detect raw Nextcloud encryption payload headers and avoid showing them as normal text.
- Support common text/key file extensions such as `.txt`, `.log`, `.json`, `.xml`, `.yaml`, `.ps1`, `.sh`, `.asc`, `.pem`, `.key`, `.priv`, `.crt`, `.csr`, and source files.

## Current Scope

Text mode is intended for UTF-8 compatible text files. Hex mode is read-only. Binary editing is intentionally not implemented yet.

Files that still contain a raw Nextcloud server-side encryption header, such as `HBEGIN:oc_encryption_module`, must be repaired or migrated in Nextcloud storage. This app reads through the Nextcloud file API and does not bypass the platform encryption layer.

## Requirements

- Nextcloud 34
- PHP 8.2 or newer
- Access to install a local/custom Nextcloud app

## Installation

Clone or copy the app into your Nextcloud apps directory:

```bash
cd /var/www/nextcloud/apps
git clone https://github.com/DBase-In-Rs/nextcloud-hex.git hex
chown -R www-data:www-data hex
```

Enable the app:

```bash
cd /var/www/nextcloud
sudo -u www-data php occ app:enable hex
```

Reload PHP-FPM if your deployment uses OPcache:

```bash
systemctl reload php8.3-fpm.service
```

## Development Install

For local development, keep the repository in `apps/hex`:

```bash
cd /var/www/nextcloud/apps/hex
git status
```

Useful checks:

```bash
php -l lib/Service/PreviewService.php
php -l lib/Controller/ContentController.php
node --check js/hex-main.js
node --check js/editor.js
```

Nextcloud status check:

```bash
cd /var/www/nextcloud
sudo -u www-data php occ status
```

## Usage

1. Open the Nextcloud Files app.
2. Select a file or open the file action menu.
3. Choose `Open with Text & Hex Editor` or `Edit as text`.
4. Use the toolbar:
   - `Back`: return to the previous page.
   - `X`: close the editor.
   - `Text`: reload the file in text mode.
   - `Hex`: reload the file in hex mode.
   - `Edit as text`: force text mode for supported files.
   - `Undo`: revert unsaved text changes.
   - `Save`: save edited text.

If you changed a file and try to leave or switch modes, the app asks for confirmation before discarding unsaved changes.

## Packaging For Release

From inside the app directory:

```bash
cd /var/www/nextcloud/apps/hex
git status
git tag v0.1.1
git archive --format=tar.gz --prefix=hex/ -o nextcloud-text-hex-editor-v0.1.1.tar.gz v0.1.1
```

For Nextcloud App Store publishing, use the signed app package flow required by the App Store dashboard. See [docs/PUBLISHING.md](docs/PUBLISHING.md).

## Security

Please do not report security issues in public GitHub issues. See [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).
