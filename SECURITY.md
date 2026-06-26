# Security Policy

## Supported Versions

This app currently targets Nextcloud 34.

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting A Vulnerability

Please do not report security issues in public GitHub issues.

Report security concerns by email:

`admin@dbase.in.rs`

Please include:

- A clear description of the issue.
- Steps to reproduce.
- Impact and affected file types, if known.
- Nextcloud and PHP versions.

## Security Notes

The app reads and writes through the Nextcloud file API. It must not bypass Nextcloud storage, sharing, permission, or encryption layers.

Hex mode is read-only. Text mode should only save text-like file content.

