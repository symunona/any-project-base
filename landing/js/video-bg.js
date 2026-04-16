// YouTube background embed. Muted autoplay behind header.
// Video ID configured via data-video-id on <div id="video-bg">.
// Fallback: solid var(--color-primary) bg if iframe blocked.

function initVideoBg() {
  const el = document.getElementById('video-bg')
  if (!el) return

  const videoId = el.dataset.videoId
  if (!videoId) return

  const container = document.createElement('div')
  container.className = 'video-bg-container'

  const iframe = document.createElement('iframe')
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`
  iframe.allow = 'autoplay; encrypted-media'
  iframe.setAttribute('allowfullscreen', '')
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute('title', '')
  iframe.setAttribute('aria-hidden', 'true')

  // Fallback if blocked
  iframe.onerror = () => {
    container.style.background = 'var(--color-primary)'
    container.innerHTML = ''
  }

  container.appendChild(iframe)
  document.body.insertBefore(container, document.body.firstChild)

  // Overlay
  const overlay = document.createElement('div')
  overlay.className = 'video-bg-overlay'
  document.body.insertBefore(overlay, document.body.children[1])
}

document.addEventListener('DOMContentLoaded', initVideoBg)
