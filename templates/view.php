<?php
script('hex', 'hex-main');
script('hex', 'editor');
style('hex', 'hex-main');
style('hex', 'editor');
?>
<div id="hex-viewer"
	data-file-id="<?php p($_['fileId']); ?>"
	data-mode="<?php p($_['mode']); ?>"
	data-api-url="<?php p($_['urlGenerator']->linkToRoute('hex.content.get', ['fileId' => (int) $_['fileId']])); ?>">
	<div class="hex-shell">
		<header class="hex-header">
			<h1>Nextcloud Text &amp; Hex Editor</h1>
			<p id="hex-meta">Loading…</p>
		</header>
		<div class="hex-toolbar">
			<button id="hex-back" class="hex-button hex-button--secondary" type="button">Back</button>
			<button id="hex-close" class="hex-button hex-button--secondary" type="button">X</button>
			<button id="hex-mode-text" class="hex-button hex-button--secondary" type="button">Text</button>
			<button id="hex-mode-hex" class="hex-button hex-button--secondary" type="button">Hex</button>
			<button id="hex-edit-text" class="hex-button hex-button--secondary" type="button">Edit as text</button>
			<button id="hex-undo" class="hex-button hex-button--secondary" type="button" disabled>Undo</button>
			<button id="hex-save" class="hex-button" type="button" disabled>Save</button>
			<span id="hex-status" class="hex-status"></span>
		</div>
		<main id="hex-content" class="hex-content"></main>
	</div>
</div>
