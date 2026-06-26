# Publishing

This document is a release checklist for publishing Nextcloud Text & Hex Editor.

## Pre-Release Checklist

From the app directory:

```bash
cd /var/www/nextcloud/apps/hex
git status
php -l lib/Service/PreviewService.php
php -l lib/Controller/ContentController.php
php -l lib/Controller/ViewController.php
php -l templates/view.php
node --check js/hex-main.js
node --check js/editor.js
```

From the Nextcloud root:

```bash
cd /var/www/nextcloud
sudo -u www-data php occ status
sudo -u www-data php occ app:list | grep hex
```

Confirm:

- `maintenance: false`
- `needsDbUpgrade: false`
- The app version in `appinfo/info.xml` is the intended release version.
- The README and changelog mention the same version.
- No unrelated files outside `apps/hex` are included.

## GitHub Release

```bash
cd /var/www/nextcloud/apps/hex
git add .
git commit -m "Prepare first release"
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

Adjust the branch name if the repository uses another default branch.

## App Archive

Create a source archive with the correct app directory name:

```bash
git archive --format=tar.gz --prefix=hex/ -o nextcloud-text-hex-editor-v0.1.1.tar.gz v0.1.1
```

For Nextcloud App Store submission, follow the signing and upload flow in the App Store dashboard. Keep the signed archive and the GitHub tag aligned.

## Store Metadata Draft

Short description:

> Edit text files and inspect binary files as hex inside Nextcloud.

Long description:

> Nextcloud Text & Hex Editor adds file actions for opening files as editable text or read-only hexadecimal previews. It supports text-like configuration, script, key, certificate, and log files, provides Text/Hex switching, save, undo, close/back controls, and warns before discarding unsaved changes.

Categories:

- files
- office
- tools

