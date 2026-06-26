<?php

declare(strict_types=1);

namespace OCA\Hex\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

class ViewController extends Controller {
	public function __construct(
		string $appName,
		IRequest $request,
		private IURLGenerator $urlGenerator,
	) {
		parent::__construct($appName, $request);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function page(int $fileId, string $mode = 'auto'): TemplateResponse {
		return new TemplateResponse($this->appName, 'view', [
			'fileId' => $fileId,
			'mode' => $mode,
			'urlGenerator' => $this->urlGenerator,
		], TemplateResponse::RENDER_AS_BASE);
	}
}
