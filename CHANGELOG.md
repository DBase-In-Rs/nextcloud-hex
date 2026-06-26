# Changelog

All notable changes to this project will be documented in this file.

This project follows a practical release log format. Version numbers should match `appinfo/info.xml`.

## 0.1.1 - Unreleased

### Added

- Nextcloud Files action for opening files in the editor.
- Text mode for text-like files.
- Read-only hex preview mode for binary files.
- Text/Hex mode switching.
- Save support for text-like files.
- Back, close, undo, and unsaved-change confirmation controls.
- Full-screen editor overlay.
- App icon and GitHub community documentation.

### Changed

- App name updated to `Nextcloud Text & Hex Editor`.
- `.gpg` and `.pgp` are treated as binary by default.

### Notes

- Hex editing is not implemented; hex mode is read-only.
- Raw Nextcloud encryption payloads are detected and shown as unsupported.

