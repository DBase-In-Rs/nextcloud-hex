(function() {
	const APP_ID = 'hex'
	const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M2 2h12v12H2zm2 2v2h2V4zm0 3v2h2V7zm0 3v2h2v-2zm3-6v2h2V4zm0 3v2h2V7zm0 3v2h2v-2zm3-6v8h2V4z"/></svg>'

	const escapeHtml = (value) => String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;')

	const fileNameOf = (node) => {
		if (!node) return ''
		if (node.basename) return node.basename
		if (node.name) return node.name
		if (node.path) {
			const parts = String(node.path).split('/')
			return parts[parts.length - 1] || ''
		}
		return ''
	}

	const isMarkdown = (node) => {
		const name = fileNameOf(node).toLowerCase()
		const mime = String(node?.mime || '').toLowerCase()
		return name.endsWith('.md') || name.endsWith('.markdown') || mime.includes('markdown')
	}

	const isFolder = (node) => String(node?.mime || '').startsWith('httpd/unix-directory')

	const buildUrl = (fileId, mode) => {
		if (window.OC?.generateUrl) {
			return window.OC.generateUrl(`/apps/${APP_ID}/open/${fileId}`) + `?mode=${encodeURIComponent(mode)}`
		}
		return `/index.php/apps/${APP_ID}/open/${fileId}?mode=${encodeURIComponent(mode)}`
	}

	const openPreview = (fileId, mode) => {
		window.location.assign(buildUrl(fileId, mode))
	}

	const getNodeFileId = (node, context) => {
		if (node?.fileid) return node.fileid
		if (node?.id) return node.id
		if (context?.fileInfoModel) {
			if (typeof context.fileInfoModel.get === 'function') {
				return context.fileInfoModel.get('id') || context.fileInfoModel.get('fileid')
			}
			return context.fileInfoModel.id || context.fileInfoModel.fileid
		}
		return null
	}

	const registerLegacyAction = () => {
		const legacy = window.OCA?.Files?.fileActions
		if (!legacy || typeof legacy.registerAction !== 'function') return false

		try {
			legacy.registerAction({
				name: 'hex_open_text_editor',
				displayName: 'Open in text editor',
				mime: 'all',
				permissions: window.OC?.PERMISSION_READ || 1,
				iconClass: 'icon-category-office',
				actionHandler: function(fileName, context) {
					const fileId = getNodeFileId(null, context)
					if (fileId) {
						openPreview(fileId, 'auto')
					}
				},
			})
			return true
		} catch (error) {
			console.error('[hex] legacy action registration failed', error)
			return false
		}
	}

	const ensureFilesRegistry = () => {
		window._nc_files_scope = window._nc_files_scope || {}
		window._nc_files_scope.v4_0 = window._nc_files_scope.v4_0 || {}
		const scope = window._nc_files_scope.v4_0
		scope.fileActions = scope.fileActions || new Map()
		if (!scope.registry) {
			scope.registry = new EventTarget()
			scope.registry.dispatchTypedEvent = function(name, event) {
				return this.dispatchEvent(event)
			}
		}
		return scope
	}

	const registerModernActions = () => {
		const scope = ensureFilesRegistry()

		const makeAction = (id, label, mode, matcher, isDefault) => ({
			id,
			displayName: () => label,
			title: () => label,
			iconSvgInline: () => SVG,
			order: -100,
			default: isDefault ? "default" : undefined,
			enabled: (nodes) => Array.isArray(nodes) && nodes.length === 1 && matcher(nodes[0]),
			exec: async (node) => {
				const fileId = getNodeFileId(node, null)
				if (!fileId) return false
				openPreview(fileId, mode)
				return true
			},
		})

		const actions = [
			makeAction("hex-open-auto", "Open with Hex editor", "auto", (node) => !isFolder(node), true),
			makeAction("hex-open-markdown", "Open as Markdown", "md", (node) => isMarkdown(node), false),
		]

		actions.forEach((action) => {
			if (!scope.fileActions.has(action.id)) {
				scope.fileActions.set(action.id, action)
				scope.registry.dispatchTypedEvent("register:action", new CustomEvent("register:action", { detail: action }))
			}
		})
	}

	const registerActions = () => {
		if (typeof window === 'undefined') return
		registerModernActions()
		registerLegacyAction()
	}

	const renderView = async () => {
		const root = document.getElementById('hex-viewer')
		if (!root) return

		const fileId = root.dataset.fileId
		const mode = root.dataset.mode || 'auto'
		const apiUrl = `${root.dataset.apiUrl}?mode=${encodeURIComponent(mode)}`
		const meta = document.getElementById('hex-meta')
		const content = document.getElementById('hex-content')

		try {
			const response = await fetch(apiUrl, {
				headers: { Accept: 'application/json' },
				credentials: 'same-origin',
			})
			const data = await response.json()
			if (!response.ok) {
				throw new Error(data.message || 'Unable to load preview')
			}

			const details = [data.name, data.mime, `${data.size} bytes`]
			if (data.truncated) details.push('truncated preview')
			meta.textContent = details.join(' • ')

			if (data.mode === 'md') {
				content.className = 'hex-content hex-content--markdown'
				content.innerHTML = data.html || `<pre>${escapeHtml(data.markdown || '')}</pre>`
			} else if (data.mode === 'text') {
				content.className = 'hex-content hex-content--text'
				content.innerHTML = `<pre>${escapeHtml(data.text || '')}</pre>`
			} else {
				content.className = 'hex-content hex-content--hex'
				content.innerHTML = `<pre>${escapeHtml(data.hex || '')}</pre>`
			}
		} catch (error) {
			meta.textContent = `File ID ${fileId}`
			content.className = 'hex-content hex-content--error'
			content.innerHTML = `<p>${escapeHtml(error.message || 'Unable to load preview')}</p>`
		}
	}

	const boot = () => {
		registerActions()
		let attempts = 0
		const timer = window.setInterval(() => {
			attempts += 1
			registerActions()
			if (attempts >= 20) {
				window.clearInterval(timer)
			}
		}, 1000)
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			boot()
			void renderView()
		}, { once: true })
	} else {
		boot()
		void renderView()
	}
})()
