<?php

declare(strict_types=1);

namespace OCA\Hex\Listener;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/** @implements IEventListener<LoadAdditionalScriptsEvent> */
class LoadAdditionalScripts implements IEventListener {
	public function handle(Event $event): void {
		if (!($event instanceof LoadAdditionalScriptsEvent)) {
			return;
		}

		Util::addStyle('hex', 'hex-main');
		Util::addInitScript('hex', 'hex-main');
		Util::addScript('hex', 'hex-main');
	}
}
