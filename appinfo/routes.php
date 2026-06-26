<?php

declare(strict_types=1);

return [
	'routes' => [
		['name' => 'view#page', 'url' => '/open/{fileId}', 'verb' => 'GET'],
		['name' => 'content#get', 'url' => '/api/content/{fileId}', 'verb' => 'GET'],
		['name' => 'content#save', 'url' => '/api/content/{fileId}', 'verb' => 'PUT'],
	],
];
