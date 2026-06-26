# Contributing

Thank you for considering a contribution to Nextcloud Text & Hex Editor.

## Development Setup

Install the app in a local Nextcloud 34 development instance:

```bash
cd /var/www/nextcloud/apps
git clone https://github.com/DBase-In-Rs/nextcloud-hex.git hex
cd /var/www/nextcloud
sudo -u www-data php occ app:enable hex
```

## Before Opening A Pull Request

Run the basic syntax checks:

```bash
cd /var/www/nextcloud/apps/hex
php -l lib/Service/PreviewService.php
php -l lib/Controller/ContentController.php
php -l lib/Controller/ViewController.php
php -l templates/view.php
node --check js/hex-main.js
node --check js/editor.js
```

Also verify:

- The Files app action appears for regular files.
- Text mode opens editable files.
- Hex mode opens binary files read-only.
- Unsaved-change confirmation appears before leaving or switching modes.
- Save works for text-like files.
- Nextcloud is not left in maintenance mode and does not require an upgrade.

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Do not change Nextcloud core files.
- Do not bump `appinfo/info.xml` version unless preparing a release.
- Include screenshots for user-interface changes.
- Describe any manual test steps you performed.

## Code Style

- PHP code uses strict types and Nextcloud public APIs.
- JavaScript is plain browser JavaScript with no build step.
- CSS should stay scoped to the Hex app selectors.

