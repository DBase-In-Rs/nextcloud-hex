(function() {
	const filesUrl = () => window.OC?.generateUrl ? window.OC.generateUrl('/apps/files') : '/index.php/apps/files'

	let originalText = null
	let dirty = false

	const byId = (id) => document.getElementById(id)

	const setStatus = (message) => {
		const status = byId('hex-status')
		if (status) status.textContent = message || ''
	}

	const setDirty = (value) => {
		dirty = value
		const save = byId('hex-save')
		const undo = byId('hex-undo')
		if (save) save.disabled = !dirty || !byId('hex-editor')
		if (undo) undo.disabled = !dirty || !byId('hex-editor')
	}

	const confirmDiscard = () => {
		if (!dirty) return true
		return window.confirm('Menjali ste fajl, a niste snimili. Da li zelite da odbacite promene?')
	}

	const switchMode = (mode) => {
		if (!confirmDiscard()) return
		const url = new URL(window.location.href)
		url.searchParams.set('mode', mode)
		window.location.assign(url.toString())
	}

	const closeEditor = () => {
		if (!confirmDiscard()) return
		if (window.history.length > 1) {
			window.history.back()
			return
		}
		window.location.assign(filesUrl())
	}

	const readJsonResponse = async (response) => {
		const text = await response.text()
		try {
			return text ? JSON.parse(text) : {}
		} catch (error) {
			return { message: 'Server returned invalid response instead of JSON' }
		}
	}

	const saveText = async () => {
		const root = byId('hex-viewer')
		const editor = byId('hex-editor')
		if (!root || !editor || !dirty) return

		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
		}
		if (window.OC?.requestToken) {
			headers.requesttoken = window.OC.requestToken
		}

		const save = byId('hex-save')
		if (save) save.disabled = true
		setStatus('Saving...')

		try {
			const response = await fetch(root.dataset.apiUrl, {
				method: 'PUT',
				headers,
				credentials: 'same-origin',
				body: new URLSearchParams({ content: editor.value }),
			})
			const data = await readJsonResponse(response)
			if (!response.ok) {
				throw new Error(data.message || 'Unable to save file')
			}
			originalText = editor.value
			setDirty(false)
			setStatus('Saved')
		} catch (error) {
			setStatus(error.message || 'Unable to save file')
			setDirty(true)
		}
	}

	const applyViewport = () => {
		const root = byId('hex-viewer')
		if (!root) return
		if (root.parentElement !== document.body) {
			document.body.appendChild(root)
		}
		Object.assign(root.style, {
			position: 'fixed',
			top: 'var(--header-height, 50px)',
			right: '0',
			bottom: '0',
			left: '0',
			width: '100vw',
			maxWidth: 'none',
			zIndex: '10000',
			overflow: 'hidden',
		})
		const shell = root.querySelector('.hex-shell')
		if (shell) {
			Object.assign(shell.style, {
				width: '100vw',
				maxWidth: 'none',
				height: '100%',
				overflow: 'hidden',
			})
		}
		const content = byId('hex-content')
		if (content) {
			Object.assign(content.style, {
				width: 'calc(100vw - 20px)',
				maxWidth: 'none',
				overflow: content.classList.contains('hex-content--editor') ? 'hidden' : 'scroll',
			})
		}
	}

	const wireEditor = () => {
		const editor = byId('hex-editor')
		if (!editor || editor.dataset.hexWired === 'true') return
		editor.dataset.hexWired = 'true'
		editor.setAttribute('wrap', 'off')
		originalText = editor.value
		editor.addEventListener('input', () => setDirty(editor.value !== originalText))
		setDirty(false)
	}

	const wireButtons = () => {
		const bindings = [
			['hex-back', () => { if (confirmDiscard()) window.history.back() }],
			['hex-close', closeEditor],
			['hex-mode-text', () => switchMode('text')],
			['hex-mode-hex', () => switchMode('hex')],
			['hex-edit-text', () => switchMode('text')],
			['hex-undo', () => {
				const editor = byId('hex-editor')
				if (!editor || originalText === null) return
				editor.value = originalText
				setDirty(false)
				setStatus('Changes reverted')
			}],
			['hex-save', saveText],
		]

		bindings.forEach(([id, handler]) => {
			const button = byId(id)
			if (!button || button.dataset.hexWired === 'true') return
			button.dataset.hexWired = 'true'
			button.addEventListener('click', handler)
		})
	}

	const boot = () => {
		applyViewport()
		wireButtons()
		wireEditor()
		const observer = new MutationObserver(() => {
			applyViewport()
			wireButtons()
			wireEditor()
		})
		observer.observe(document.body, { childList: true, subtree: true, attributes: true })
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot, { once: true })
	} else {
		boot()
	}
})()
