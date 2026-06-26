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
				displayName: 'Open with Text & Hex Editor',
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

		const selectedNodes = (payload) => {
			if (Array.isArray(payload)) return payload
			if (Array.isArray(payload?.nodes)) return payload.nodes
			return []
		}

		const selectedNode = (payload) => selectedNodes(payload)[0] || null

		const makeAction = (id, label, mode, matcher, isDefault) => ({
			id,
			displayName: () => label,
			title: () => label,
			iconSvgInline: () => SVG,
			order: -100,
			default: isDefault ? "default" : undefined,
			enabled: (payload) => {
				const nodes = selectedNodes(payload)
				return nodes.length === 1 && matcher(nodes[0])
			},
			exec: async (payload) => {
				const node = selectedNode(payload)
				const fileId = getNodeFileId(node, null)
				if (!fileId) return false
				openPreview(fileId, mode)
				return true
			},
		})

		const actions = [
			makeAction("hex-open-auto", "Open with Text & Hex Editor", "auto", (node) => !isFolder(node), true),
			makeAction("hex-edit-text", "Edit as text", "text", (node) => !isFolder(node), false),
			makeAction("hex-open-markdown", "Open as Markdown in Text & Hex Editor", "md", (node) => isMarkdown(node), false),
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

	let currentDocument = null
	let dirty = false
	let originalText = ''

	const setStatus = (message) => {
		const status = document.getElementById("hex-status")
		if (status) status.textContent = message || ""
	}

	const setDirty = (value) => {
		dirty = value
		const save = document.getElementById("hex-save")
		const undo = document.getElementById("hex-undo")
		if (save) save.disabled = !currentDocument?.editable || !dirty
		if (undo) undo.disabled = !currentDocument?.editable || !dirty
	}

	const confirmDiscard = () => {
		if (!dirty) return true
		return window.confirm('Menjali ste fajl, a niste snimili. Da li zelite da odbacite promene?')
	}

	const goBack = () => {
		if (!confirmDiscard()) return
		window.history.back()
	}

	const closeEditor = () => {
		if (!confirmDiscard()) return
		if (window.history.length > 1) {
			window.history.back()
			return
		}
		window.location.assign(window.OC?.generateUrl ? window.OC.generateUrl('/apps/files') : '/index.php/apps/files')
	}

	const switchMode = (mode) => {
		if (!confirmDiscard()) return
		const url = new URL(window.location.href)
		url.searchParams.set('mode', mode)
		window.location.assign(url.toString())
	}

	const undoChanges = () => {
		const editor = document.getElementById('hex-editor')
		if (!editor || !currentDocument?.editable) return
		editor.value = originalText
		setDirty(false)
		setStatus('Changes reverted')
	}

	const readJsonResponse = async (response) => {
		const text = await response.text()
		try {
			return text ? JSON.parse(text) : {}
		} catch (error) {
			const message = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
				? 'Server returned an HTML error page instead of JSON'
				: 'Server returned invalid JSON'
			return { message }
		}
	}

	const editAsText = () => {
		const root = document.getElementById("hex-viewer")
		if (!root) return
		switchMode("text")
	}

	const saveCurrentDocument = async () => {
		if (!currentDocument?.editable || !dirty) return
		const editor = document.getElementById("hex-editor")
		if (!editor) return

		const save = document.getElementById("hex-save")
		if (save) save.disabled = true
		setStatus("Saving...")

		try {
			const headers = {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
			}
			if (window.OC?.requestToken) {
				headers.requesttoken = window.OC.requestToken
			}
			const response = await fetch(currentDocument.apiUrl, {
				method: "PUT",
				headers,
				credentials: "same-origin",
				body: new URLSearchParams({ content: editor.value }),
			})
			const data = await readJsonResponse(response)
			if (!response.ok) {
				throw new Error(data.message || "Unable to save file")
			}
			originalText = editor.value
			setDirty(false)
			setStatus("Saved")
		} catch (error) {
			setStatus(error.message || "Unable to save file")
			setDirty(true)
		}
	}

	const renderView = async () => {
		const root = document.getElementById('hex-viewer')
		if (!root) return
		if (root.parentElement !== document.body) {
			document.body.appendChild(root)
		}

		const fileId = root.dataset.fileId
		const mode = root.dataset.mode || 'auto'
		const apiUrl = `${root.dataset.apiUrl}?mode=${encodeURIComponent(mode)}`
		const meta = document.getElementById('hex-meta')
		const content = document.getElementById('hex-content')
		const save = document.getElementById('hex-save')
		const editText = document.getElementById('hex-edit-text')
		const back = document.getElementById('hex-back')
		const close = document.getElementById('hex-close')
		const undo = document.getElementById('hex-undo')
		const modeText = document.getElementById('hex-mode-text')
		const modeHex = document.getElementById('hex-mode-hex')
		if (save) save.addEventListener('click', saveCurrentDocument)
		if (editText) editText.addEventListener('click', editAsText)
		if (back) back.addEventListener('click', goBack)
		if (close) close.addEventListener('click', closeEditor)
		if (undo) undo.addEventListener('click', undoChanges)
		if (modeText) modeText.addEventListener('click', () => switchMode('text'))
		if (modeHex) modeHex.addEventListener('click', () => switchMode('hex'))

		try {
			const response = await fetch(apiUrl, {
				headers: { Accept: 'application/json' },
				credentials: 'same-origin',
			})
			const data = await readJsonResponse(response)
			if (!response.ok) {
				throw new Error(data.message || 'Unable to load preview')
			}

			const details = [data.name, data.mime, `${data.size} bytes`]
			if (data.truncated) details.push('truncated preview')
			meta.textContent = details.join(' • ')

			currentDocument = {
				apiUrl: root.dataset.apiUrl,
				editable: Boolean(data.editable),
			}

			const editText = document.getElementById("hex-edit-text")
			if (editText) {
				editText.hidden = !data.textLike || data.mode === "text" || data.mode === "md" || data.mode === "encrypted"
			}
			const modeText = document.getElementById('hex-mode-text')
			const modeHex = document.getElementById('hex-mode-hex')
			if (modeText) modeText.classList.toggle('hex-button--active', data.mode === 'text' || data.mode === 'md')
			if (modeHex) modeHex.classList.toggle('hex-button--active', data.mode === 'hex')

			if (data.mode === "encrypted") {
				content.className = "hex-content hex-content--error"
				content.innerHTML = "<p>" + escapeHtml(data.message || "This file is still encrypted in storage.") + "</p>"
				setStatus("Read-only")
			} else if (data.mode === "md" || data.mode === "text") {
				const text = data.mode === "md" ? (data.markdown || "") : (data.text || "")
				originalText = text
				content.className = "hex-content hex-content--editor hex-content--" + data.mode
				content.innerHTML = "<textarea id=\"hex-editor\" class=\"hex-editor\" spellcheck=\"false\" wrap=\"off\">" + escapeHtml(text) + "</textarea>"
				const editor = document.getElementById("hex-editor")
				if (editor) {
					editor.readOnly = !data.editable
					editor.addEventListener("input", () => setDirty(true))
				}
				setStatus(data.editable ? "Editable - change text to enable Save" : "Read-only preview")
			} else {
				content.className = "hex-content hex-content--hex"
				content.innerHTML = "<pre>" + escapeHtml(data.hex || "") + "</pre>"
				setStatus("Read-only hex preview")
			}
			setDirty(false)
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
