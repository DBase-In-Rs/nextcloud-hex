<?php

declare(strict_types=1);

namespace OCA\Hex\Controller;

use OCA\Hex\Service\PreviewService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Http;
use OCP\IRequest;

class ContentController extends Controller {
	public function __construct(
		string $appName,
		IRequest $request,
		private PreviewService $previewService,
	) {
		parent::__construct($appName, $request);
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function get(int $fileId, string $mode = 'auto'): DataResponse {
		try {
			return new DataResponse($this->previewService->buildPreview($fileId, $mode));
		} catch (\InvalidArgumentException $e) {
			return new DataResponse(['message' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
		} catch (\RuntimeException $e) {
			return new DataResponse(['message' => $e->getMessage()], Http::STATUS_NOT_FOUND);
		} catch (\Throwable) {
			return new DataResponse(['message' => 'Unable to load file preview'], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}
	/**
	 * @NoAdminRequired
	 */
	public function save(int $fileId): DataResponse {
		try {
			$content = (string)$this->request->getParam("content", "");
			return new DataResponse($this->previewService->saveText($fileId, $content));
		} catch (\InvalidArgumentException $e) {
			return new DataResponse(["message" => $e->getMessage()], Http::STATUS_BAD_REQUEST);
		} catch (\RuntimeException $e) {
			return new DataResponse(["message" => $e->getMessage()], Http::STATUS_NOT_FOUND);
		} catch (\Throwable) {
			return new DataResponse(["message" => "Unable to save file"], Http::STATUS_INTERNAL_SERVER_ERROR);
		}
	}
}
