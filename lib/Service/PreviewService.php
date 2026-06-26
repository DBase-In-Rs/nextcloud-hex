<?php

declare(strict_types=1);

namespace OCA\Hex\Service;

use OCP\Files\File;
use OCP\Files\IRootFolder;
use OCP\IUserSession;

class PreviewService {
	private const MAX_BYTES = 1048576;

	public function __construct(
		private IRootFolder $rootFolder,
		private IUserSession $userSession,
	) {
	}

	public function buildPreview(int $fileId, string $mode = 'auto'): array {
		if ($fileId <= 0) {
			throw new \InvalidArgumentException('Invalid file id');
		}

		$file = $this->getFileById($fileId);
		$mimeType = $file->getMimeType();
		$fileName = $file->getName();
		$resolvedMode = $this->resolveMode($mode, $fileName, $mimeType);
		[$content, $truncated] = $this->readFileChunk($file, self::MAX_BYTES);
		if ($this->isEncryptedPayload($content)) {
			return [
				"fileId" => $fileId,
				"name" => $fileName,
				"mime" => $mimeType,
				"size" => $file->getSize(),
				"mode" => "encrypted",
				"editable" => false,
				"truncated" => $truncated,
				"message" => "This file still contains a Nextcloud encryption header. Hex cannot decrypt raw encrypted storage data.",
			];
		}

		$result = [
			'fileId' => $fileId,
			'name' => $fileName,
			'mime' => $mimeType,
			'size' => $file->getSize(),
			'mode' => $resolvedMode,
			'truncated' => $truncated,
			'textLike' => $this->isTextLike($fileName, $mimeType),
			'editable' => in_array($resolvedMode, ['text', 'md'], true) && !$truncated,
		];

		if ($resolvedMode === 'md') {
			$text = $this->toUtf8($content);
			$result['markdown'] = $text;
			$result['html'] = $this->renderMarkdown($text);
			return $result;
		}

		if ($resolvedMode === 'text') {
			$result['text'] = $this->toUtf8($content);
			return $result;
		}

		$result['hex'] = $this->formatHex($content);
		return $result;
	}

	public function saveText(int $fileId, string $content): array {
		if ($fileId <= 0) {
			throw new \InvalidArgumentException("Invalid file id");
		}

		$file = $this->getFileById($fileId);
		$fileName = $file->getName();
		$mimeType = $file->getMimeType();
		if (!$this->isTextLike($fileName, $mimeType) && !mb_check_encoding($content, 'UTF-8')) {
			throw new \InvalidArgumentException("Only text-like UTF-8 files can be saved from this editor");
		}

		if ($this->isEncryptedPayload($content)) {
			throw new \InvalidArgumentException("Refusing to save raw Nextcloud encrypted payload");
		}

		$file->putContent($content);
		return [
			"fileId" => $fileId,
			"name" => $fileName,
			"size" => $file->getSize(),
			"saved" => true,
		];
	}

	private function getFileById(int $fileId): File {
		$user = $this->userSession->getUser();
		if ($user === null) {
			throw new \RuntimeException('Not authenticated');
		}

		$nodes = $this->rootFolder->getUserFolder($user->getUID())->getById($fileId);
		foreach ($nodes as $node) {
			if ($node instanceof File) {
				return $node;
			}
		}

		throw new \RuntimeException('File not found');
	}

	private function resolveMode(string $mode, string $fileName, string $mimeType): string {
		if (in_array($mode, ['hex', 'md', 'text'], true)) {
			return $mode;
		}

		$extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
		if ($extension === 'md' || $extension === 'markdown' || str_contains($mimeType, 'markdown')) {
			return 'md';
		}

		if ($this->isTextLike($fileName, $mimeType)) {
			return 'text';
		}

		return 'hex';
	}


	private function isTextLike(string $fileName, string $mimeType): bool {
		$mimeType = strtolower($mimeType);
		if (str_starts_with($mimeType, 'text/')) {
			return true;
		}

		$knownTextMimes = [
			'application/json',
			'application/xml',
			'application/javascript',
			'application/x-javascript',
			'application/x-httpd-php',
			'application/x-sh',
			'application/x-shellscript',
			'application/yaml',
			'application/x-yaml',
			'application/toml',
			'application/x-powershell',
		];

		$knownTextExtensions = [
			'txt', 'log', 'ini', 'cfg', 'conf', 'config', 'env', 'json', 'xml', 'yaml', 'yml',
			'toml', 'csv', 'tsv', 'sql', 'ps1', 'psm1', 'psd1', 'sh', 'bash', 'zsh', 'fish',
			'php', 'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'pl', 'java', 'c', 'cc', 'cpp', 'h',
			'hpp', 'cs', 'go', 'rs', 'swift', 'kt', 'kts', 'scala', 'lua', 'r', 'bat', 'cmd',
			'properties', 'gradle', 'make', 'mk', 'dockerfile', 'gitignore', 'editorconfig',
			'md', 'markdown', 'html', 'css', 'scss', 'less', 'svg', 'tex', 'asc', 'pem', 'pub', 'key', 'priv', 'private', 'crt', 'cer', 'csr',
		];

		$extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
		if ($extension !== '' && in_array($extension, $knownTextExtensions, true)) {
			return true;
		}

		return in_array($mimeType, $knownTextMimes, true);
	}

	private function isEncryptedPayload(string $content): bool {
		return str_starts_with($content, "HBEGIN:oc_encryption_module:");
	}

	private function readFileChunk(File $file, int $maxBytes): array {
		$handle = $file->fopen('rb');
		if (!is_resource($handle)) {
			throw new \RuntimeException('Unable to open file');
		}

		try {
			$content = (string) fread($handle, $maxBytes + 1);
		} finally {
			fclose($handle);
		}

		$truncated = strlen($content) > $maxBytes;
		if ($truncated) {
			$content = substr($content, 0, $maxBytes);
		}

		return [$content, $truncated];
	}

	private function toUtf8(string $content): string {
		if (mb_check_encoding($content, 'UTF-8')) {
			return $content;
		}

		return mb_convert_encoding($content, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
	}

	private function renderMarkdown(string $markdown): string {
		$lines = preg_split('/\r\n|\r|\n/', $markdown) ?: [];
		$html = [];
		$inCode = false;
		$inList = false;
		$paragraph = [];

		$flushParagraph = static function () use (&$paragraph, &$html): void {
			if ($paragraph === []) {
				return;
			}
			$text = implode(' ', $paragraph);
			$html[] = '<p>' . self::inlineMarkdown($text) . '</p>';
			$paragraph = [];
		};

		foreach ($lines as $line) {
			if (preg_match('/^```/', $line) === 1) {
				$flushParagraph();
				if ($inList) {
					$html[] = '</ul>';
					$inList = false;
				}
				$html[] = $inCode ? '</code></pre>' : '<pre><code>';
				$inCode = !$inCode;
				continue;
			}

			if ($inCode) {
				$html[] = htmlspecialchars($line, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
				continue;
			}

			if (trim($line) === '') {
				$flushParagraph();
				if ($inList) {
					$html[] = '</ul>';
					$inList = false;
				}
				continue;
			}

			if (preg_match('/^(#{1,6})\s+(.*)$/', $line, $matches) === 1) {
				$flushParagraph();
				if ($inList) {
					$html[] = '</ul>';
					$inList = false;
				}
				$level = strlen($matches[1]);
				$html[] = sprintf('<h%d>%s</h%d>', $level, self::inlineMarkdown($matches[2]), $level);
				continue;
			}

			if (preg_match('/^[-*]\s+(.*)$/', $line, $matches) === 1) {
				$flushParagraph();
				if (!$inList) {
					$html[] = '<ul>';
					$inList = true;
				}
				$html[] = '<li>' . self::inlineMarkdown($matches[1]) . '</li>';
				continue;
			}

			if ($inList) {
				$html[] = '</ul>';
				$inList = false;
			}

			$paragraph[] = trim($line);
		}

		$flushParagraph();
		if ($inList) {
			$html[] = '</ul>';
		}
		if ($inCode) {
			$html[] = '</code></pre>';
		}

		return implode("\n", $html);
	}

	private static function inlineMarkdown(string $text): string {
		$escaped = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
		$escaped = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $escaped) ?? $escaped;
		$escaped = preg_replace('/\*(.+?)\*/', '<em>$1</em>', $escaped) ?? $escaped;
		$escaped = preg_replace('/`(.+?)`/', '<code>$1</code>', $escaped) ?? $escaped;
		$escaped = preg_replace('/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $escaped) ?? $escaped;
		return $escaped;
	}

	private function formatHex(string $content): string {
		$lines = [];
		$offset = 0;
		foreach (str_split($content, 16) as $chunk) {
			$bytes = unpack('C*', $chunk);
			$hex = [];
			$ascii = '';
			foreach ($bytes as $byte) {
				$hex[] = strtoupper(str_pad(dechex($byte), 2, '0', STR_PAD_LEFT));
				$ascii .= ($byte >= 32 && $byte <= 126) ? chr($byte) : '.';
			}
			$hexText = implode(' ', $hex);
			$hexText = str_pad($hexText, 16 * 3 - 1, ' ');
			$lines[] = sprintf('%08X  %s  |%s|', $offset, $hexText, $ascii);
			$offset += 16;
		}

		return implode("\n", $lines);
	}
}
