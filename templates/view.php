<?php
script('hex', 'hex-main');
style('hex', 'hex-main');
?>
<div id="hex-viewer"
	data-file-id="<?php p($_['fileId']); ?>"
	data-mode="<?php p($_['mode']); ?>"
	data-api-url="<?php p(\OC::$server->getURLGenerator()->linkToRoute('hex.content.get', ['fileId' => (int) $_['fileId']])); ?>">
	<div class="hex-shell">
		<header class="hex-header">
			<h1>Hex &amp; Markdown Viewer</h1>
			<p id="hex-meta">Loading…</p>
		</header>
		<main id="hex-content" class="hex-content"></main>
	</div>
</div>
