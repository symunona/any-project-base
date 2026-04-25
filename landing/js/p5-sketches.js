// p5-sketches.js — instance-mode p5.js visualizations
// p5.js loaded globally via defer CDN script in index.html

window.addEventListener('load', () => {
  initNodesSketch()
  initSecuritySketch()
})

function getPrimaryRGB() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary').trim()
  if (raw.startsWith('#') && raw.length === 7) {
    return [parseInt(raw.slice(1,3),16), parseInt(raw.slice(3,5),16), parseInt(raw.slice(5,7),16)]
  }
  return [99, 102, 241]
}

// ── #p5-nodes — d3-style force graph, icons on nodes, no labels ───────────────
function initNodesSketch() {
  const container = document.getElementById('p5-nodes')
  if (!container || typeof p5 === 'undefined') return

  const [R, G, B] = getPrimaryRGB()

  new p5((s) => {
    let W, H, nodes = [], cx, cy

    // Icon draw functions — all accept (s, x, y, sz)
    const icons = [
      // Lock — Auth
      (s,x,y,sz) => {
        s.rectMode(s.CENTER)
        s.rect(x, y+sz*.18, sz*1.1, sz*.85, sz*.15)
        s.noFill(); s.strokeWeight(sz*.16); s.strokeCap(s.ROUND)
        s.arc(x, y-sz*.1, sz*.7, sz*.75, s.PI, 0)
        s.noStroke(); s.fill(R,G,B,160)
        s.ellipse(x, y+sz*.12, sz*.2)
        s.rect(x, y+sz*.3, sz*.12, sz*.28, sz*.05)
        s.rectMode(s.CORNER)
      },
      // Credit card — Payments
      (s,x,y,sz) => {
        s.rectMode(s.CENTER)
        s.rect(x, y, sz*1.4, sz*.9, sz*.1)
        s.noStroke(); s.fill(R,G,B,130)
        s.rect(x, y-sz*.2, sz*1.4, sz*.22)
        s.rect(x-sz*.35, y+sz*.18, sz*.45, sz*.14, sz*.06)
        s.rectMode(s.CORNER)
      },
      // Grid 2×2 — Admin
      (s,x,y,sz) => {
        const c = sz*.4, g = sz*.1
        s.rectMode(s.CENTER)
        s.rect(x-c/2-g/2, y-c/2-g/2, c, c, sz*.08)
        s.rect(x+c/2+g/2, y-c/2-g/2, c, c, sz*.08)
        s.rect(x-c/2-g/2, y+c/2+g/2, c, c, sz*.08)
        s.rect(x+c/2+g/2, y+c/2+g/2, c, c, sz*.08)
        s.rectMode(s.CORNER)
      },
      // Phone — Mobile
      (s,x,y,sz) => {
        s.rectMode(s.CENTER)
        s.rect(x, y, sz*.55, sz*1.1, sz*.12)
        s.noStroke(); s.fill(R,G,B,150)
        s.ellipse(x, y+sz*.38, sz*.16)
        s.rectMode(s.CORNER)
      },
      // Globe — i18n
      (s,x,y,sz) => {
        s.ellipse(x, y, sz, sz)
        s.line(x-sz/2, y, x+sz/2, y)
        s.line(x, y-sz/2, x, y+sz/2)
        s.noFill()
        s.ellipse(x, y, sz*.5, sz)
      },
      // Shield — Security
      (s,x,y,sz) => {
        s.beginShape()
        s.vertex(x, y-sz*.5)
        s.vertex(x+sz*.5, y-sz*.2)
        s.vertex(x+sz*.5, y+sz*.1)
        s.bezierVertex(x+sz*.5,y+sz*.45, x,y+sz*.6, x,y+sz*.6)
        s.bezierVertex(x,y+sz*.6, x-sz*.5,y+sz*.45, x-sz*.5,y+sz*.1)
        s.vertex(x-sz*.5, y-sz*.2)
        s.endShape(s.CLOSE)
      },
      // Upload arrow — Deploy
      (s,x,y,sz) => {
        s.line(x, y+sz*.4, x, y-sz*.2)
        s.line(x-sz*.3, y+sz*.05, x, y-sz*.3)
        s.line(x+sz*.3, y+sz*.05, x, y-sz*.3)
        s.noFill()
        s.arc(x-sz*.4, y+sz*.3, sz*.4, sz*.4, s.HALF_PI, s.PI)
        s.arc(x+sz*.4, y+sz*.3, sz*.4, sz*.4, 0, s.HALF_PI)
        s.line(x-sz*.6, y+sz*.3, x+sz*.6, y+sz*.3)
      },
      // Code brackets — TypeScript
      (s,x,y,sz) => {
        s.line(x-sz*.12, y-sz*.38, x-sz*.38, y-sz*.18)
        s.line(x-sz*.38, y-sz*.18, x-sz*.38, y+sz*.18)
        s.line(x-sz*.38, y+sz*.18, x-sz*.12, y+sz*.38)
        s.line(x+sz*.12, y-sz*.38, x+sz*.38, y-sz*.18)
        s.line(x+sz*.38, y-sz*.18, x+sz*.38, y+sz*.18)
        s.line(x+sz*.38, y+sz*.18, x+sz*.12, y+sz*.38)
      },
      // Bar chart — Analytics
      (s,x,y,sz) => {
        s.rectMode(s.CORNER)
        const bw = sz*.22, base = y+sz*.4
        s.rect(x-sz*.38, base-sz*.3, bw, sz*.3, sz*.04)
        s.rect(x-sz*.38+sz*.28, base-sz*.58, bw, sz*.58, sz*.04)
        s.rect(x-sz*.38+sz*.56, base-sz*.8, bw, sz*.8, sz*.04)
        s.line(x-sz*.5, base, x+sz*.5, base)
      },
    ]

    class Node {
      constructor(iconFn, x, y) {
        this.iconFn = iconFn
        this.x = x; this.y = y
        this.vx = 0; this.vy = 0
        this.r = 28
      }

      applyForces() {
        for (const o of nodes) {
          if (o === this) continue
          const dx = this.x - o.x, dy = this.y - o.y
          const d = Math.sqrt(dx*dx + dy*dy) || 1
          const rep = 2200 / (d * d)
          this.vx += (dx/d) * rep
          this.vy += (dy/d) * rep
        }
        // Center gravity
        this.vx += (cx - this.x) * 0.006
        this.vy += (cy - this.y) * 0.006
      }

      update() {
        this.applyForces()
        this.vx *= 0.82
        this.vy *= 0.82
        this.x += this.vx
        this.y += this.vy
        this.x = s.constrain(this.x, this.r+8, W-this.r-8)
        this.y = s.constrain(this.y, this.r+8, H-this.r-8)
      }

      draw() {
        // Node circle
        s.noStroke()
        s.fill(R, G, B, 22)
        s.ellipse(this.x, this.y, this.r*2+12)

        s.fill(R, G, B, 36)
        s.ellipse(this.x, this.y, this.r*2)

        // Icon
        s.noFill()
        s.stroke(R, G, B, 195)
        s.strokeWeight(1.5)
        s.strokeCap(s.ROUND)
        s.strokeJoin(s.ROUND)
        this.iconFn(s, this.x, this.y, 11)

        // Reset stroke
        s.strokeCap(s.SQUARE)
      }
    }

    s.setup = () => {
      W = container.clientWidth || 400
      H = container.clientHeight || W
      cx = W/2; cy = H/2
      s.createCanvas(W, H).parent(container)

      // Place nodes in ring
      const ring = Math.min(W, H) * 0.31
      icons.forEach((fn, i) => {
        const a = (i/icons.length)*s.TWO_PI - s.HALF_PI
        nodes.push(new Node(fn,
          cx + ring*Math.cos(a) + s.random(-10,10),
          cy + ring*Math.sin(a) + s.random(-10,10)
        ))
      })
    }

    s.draw = () => {
      s.clear()

      // Edges — connect all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx*dx+dy*dy)
          const alpha = s.map(d, 0, 220, 45, 0, true)
          if (alpha < 1) continue
          s.stroke(R, G, B, alpha)
          s.strokeWeight(0.8)
          s.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
        }
      }

      nodes.forEach(n => { n.update(); n.draw() })
    }
  })
}

// ── #p5-security — polygon physics, mouse repulsion ──────────────────────────
function initSecuritySketch() {
  const container = document.getElementById('p5-security')
  if (!container || typeof p5 === 'undefined') return

  const [R, G, B] = getPrimaryRGB()

  new p5((s) => {
    let W, H
    const polys = []
    const COUNT = 18
    const SHAPES = [3, 4, 5, 6, 6, 4] // sides, weighted toward hexagons/quads

    class Poly {
      constructor() {
        this.sides = SHAPES[Math.floor(Math.random()*SHAPES.length)]
        this.r = 12 + Math.random()*28
        this.x = this.r + Math.random()*(W - this.r*2)
        this.y = this.r + Math.random()*(H - this.r*2)
        this.vx = (Math.random()-0.5)*1.2
        this.vy = (Math.random()-0.5)*1.2
        this.angle = Math.random()*Math.PI*2
        this.spin = (Math.random()-0.5)*0.012
        this.alpha = 55 + Math.random()*80
      }

      update() {
        // Mouse repulsion
        const mx = s.mouseX, my = s.mouseY
        const dx = this.x - mx, dy = this.y - my
        const d = Math.sqrt(dx*dx + dy*dy) || 1
        if (d < 120) {
          const force = (120-d) / 120 * 0.9
          this.vx += (dx/d) * force
          this.vy += (dy/d) * force
        }

        // Speed cap + damping
        const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy)
        const max = 3.2
        if (spd > max) { this.vx = this.vx/spd*max; this.vy = this.vy/spd*max }
        this.vx *= 0.985; this.vy *= 0.985

        this.x += this.vx; this.y += this.vy
        this.angle += this.spin

        // Bounce
        if (this.x < this.r)    { this.x = this.r;    this.vx =  Math.abs(this.vx) }
        if (this.x > W-this.r)  { this.x = W-this.r;  this.vx = -Math.abs(this.vx) }
        if (this.y < this.r)    { this.y = this.r;    this.vy =  Math.abs(this.vy) }
        if (this.y > H-this.r)  { this.y = H-this.r;  this.vy = -Math.abs(this.vy) }
      }

      draw() {
        s.fill(R, G, B, this.alpha * 0.28)
        s.stroke(R, G, B, this.alpha)
        s.strokeWeight(1.2)
        s.beginShape()
        for (let i = 0; i < this.sides; i++) {
          const a = this.angle + (i/this.sides)*s.TWO_PI
          s.vertex(this.x + this.r*Math.cos(a), this.y + this.r*Math.sin(a))
        }
        s.endShape(s.CLOSE)
      }
    }

    s.setup = () => {
      W = container.clientWidth || 400
      H = container.clientHeight || W
      s.createCanvas(W, H).parent(container)
      for (let i = 0; i < COUNT; i++) polys.push(new Poly())
    }

    s.draw = () => {
      s.clear()

      // Connection lines between nearby polygons
      for (let i = 0; i < polys.length; i++) {
        for (let j = i+1; j < polys.length; j++) {
          const dx = polys[i].x - polys[j].x
          const dy = polys[i].y - polys[j].y
          const d = Math.sqrt(dx*dx+dy*dy)
          const thresh = 110
          if (d < thresh) {
            s.stroke(R, G, B, s.map(d, 0, thresh, 35, 0))
            s.strokeWeight(0.7)
            s.line(polys[i].x, polys[i].y, polys[j].x, polys[j].y)
          }
        }
      }

      polys.forEach(p => { p.update(); p.draw() })
    }
  })
}
