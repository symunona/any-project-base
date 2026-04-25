// Orbit logo animation — three bodies orbiting at different speeds/centers,
// connected by lines. Ported from orbit-logo-svg-snapshots/logo-interactive.html.

export function startOrbitLogo(container) {
  const NS = 'http://www.w3.org/2000/svg'

  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 512 512')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  container.appendChild(svg)

  function el(name, attrs = {}) {
    const node = document.createElementNS(NS, name)
    for (const key in attrs) node.setAttribute(key, attrs[key])
    return node
  }

  const orbit1 = el('g'); svg.appendChild(orbit1)
  const orbit2 = el('g'); svg.appendChild(orbit2)
  const orbit3 = el('g'); svg.appendChild(orbit3)

  const lines = el('g', { stroke: '#bdbdbd', 'stroke-width': '4', 'stroke-linecap': 'round' })
  svg.appendChild(lines)

  const line12 = el('line', { x1: 256, y1: 256, x2: 256, y2: 256 })
  const line23 = el('line', { x1: 256, y1: 256, x2: 256, y2: 256 })
  const line31 = el('line', { x1: 256, y1: 256, x2: 256, y2: 256 })
  lines.appendChild(line12); lines.appendChild(line23); lines.appendChild(line31)

  const body1 = el('circle', { r: 48, fill: '#5a5a5a' })
  const body2 = el('circle', { r: 36, fill: '#8a8a8a' })
  const body3 = el('circle', { r: 24, fill: '#6f6f6f' })
  svg.appendChild(body1); svg.appendChild(body2); svg.appendChild(body3)

  function addOrbitDots(parent, cx, cy, r, count, color) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      parent.appendChild(el('circle', {
        cx: cx + Math.cos(a) * r,
        cy: cy + Math.sin(a) * r,
        r: 3, fill: color, opacity: 0.7
      }))
    }
  }

  addOrbitDots(orbit1, 256, 256, 170, 80, '#7a7a7a')
  addOrbitDots(orbit2, 210, 170,  90, 44, '#9a9a9a')
  addOrbitDots(orbit3, 320, 200, 120, 56, '#8a8a8a')

  function pt(cx, cy, r, deg) {
    const a = deg * Math.PI / 180
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  }

  let a1 = -28, a2 = 132, a3 = 82
  let b1 = -28, b2 = 132, b3 = 82
  let raf

  function tick() {
    a1 += 0.08; a2 -= 0.05; a3 += 0.035
    b1 += 0.05; b2 -= 0.02; b3 += 0.09

    orbit1.setAttribute('transform', `rotate(${a1} 256 256)`)
    orbit2.setAttribute('transform', `rotate(${a2} 210 170)`)
    orbit3.setAttribute('transform', `rotate(${a3} 320 200)`)

    const p1 = pt(256, 256, 170, b1)
    const p2 = pt(210, 170,  90, b2)
    const p3 = pt(320, 200, 120, b3)

    body1.setAttribute('cx', p1.x); body1.setAttribute('cy', p1.y)
    body2.setAttribute('cx', p2.x); body2.setAttribute('cy', p2.y)
    body3.setAttribute('cx', p3.x); body3.setAttribute('cy', p3.y)

    line12.setAttribute('x1', p1.x); line12.setAttribute('y1', p1.y)
    line12.setAttribute('x2', p2.x); line12.setAttribute('y2', p2.y)
    line23.setAttribute('x1', p2.x); line23.setAttribute('y1', p2.y)
    line23.setAttribute('x2', p3.x); line23.setAttribute('y2', p3.y)
    line31.setAttribute('x1', p3.x); line31.setAttribute('y1', p3.y)
    line31.setAttribute('x2', p1.x); line31.setAttribute('y2', p1.y)

    raf = requestAnimationFrame(tick)
  }

  tick()

  // pause when off-screen (battery/perf)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!raf) tick() }
      else { cancelAnimationFrame(raf); raf = null }
    }).observe(container)
  }
}
