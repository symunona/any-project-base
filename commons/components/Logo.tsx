import { useEffect, useRef } from 'react'

type LogoProps = {
  size?: number
  className?: string
}

export function LogoWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function makeDots(cx: number, cy: number, r: number, count: number, color: string) {
  const dots: { cx: number; cy: number }[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    dots.push({ cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r })
  }
  return dots.map((d, i) => (
    <circle key={i} cx={d.cx} cy={d.cy} r={3} fill={color} opacity={0.7} />
  ))
}

function pt(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
}

export function Logo({ size = 96, className }: LogoProps) {
  const r1 = useRef<SVGGElement>(null)
  const r2 = useRef<SVGGElement>(null)
  const r3 = useRef<SVGGElement>(null)
  const b1 = useRef<SVGCircleElement>(null)
  const b2 = useRef<SVGCircleElement>(null)
  const b3 = useRef<SVGCircleElement>(null)
  const l12 = useRef<SVGLineElement>(null)
  const l23 = useRef<SVGLineElement>(null)
  const l31 = useRef<SVGLineElement>(null)

  useEffect(() => {
    let a1 = -28, a2 = 132, a3 = 82
    let b1a = -28, b2a = 132, b3a = 82
    let raf: number

    function tick() {
      a1 += 0.08; a2 -= 0.05; a3 += 0.035
      b1a += 0.05; b2a -= 0.02; b3a += 0.09

      r1.current?.setAttribute('transform', `rotate(${a1} 256 256)`)
      r2.current?.setAttribute('transform', `rotate(${a2} 210 170)`)
      r3.current?.setAttribute('transform', `rotate(${a3} 320 200)`)

      const p1 = pt(256, 256, 170, b1a)
      const p2 = pt(210, 170, 90, b2a)
      const p3 = pt(320, 200, 120, b3a)

      b1.current?.setAttribute('cx', String(p1.x))
      b1.current?.setAttribute('cy', String(p1.y))
      b2.current?.setAttribute('cx', String(p2.x))
      b2.current?.setAttribute('cy', String(p2.y))
      b3.current?.setAttribute('cx', String(p3.x))
      b3.current?.setAttribute('cy', String(p3.y))

      l12.current?.setAttribute('x1', String(p1.x))
      l12.current?.setAttribute('y1', String(p1.y))
      l12.current?.setAttribute('x2', String(p2.x))
      l12.current?.setAttribute('y2', String(p2.y))

      l23.current?.setAttribute('x1', String(p2.x))
      l23.current?.setAttribute('y1', String(p2.y))
      l23.current?.setAttribute('x2', String(p3.x))
      l23.current?.setAttribute('y2', String(p3.y))

      l31.current?.setAttribute('x1', String(p3.x))
      l31.current?.setAttribute('y1', String(p3.y))
      l31.current?.setAttribute('x2', String(p1.x))
      l31.current?.setAttribute('y2', String(p1.y))

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <g ref={r1}>{makeDots(256, 256, 170, 80, '#7a7a7a')}</g>
      <g ref={r2}>{makeDots(210, 170,  90, 44, '#9a9a9a')}</g>
      <g ref={r3}>{makeDots(320, 200, 120, 56, '#8a8a8a')}</g>
      <g stroke="#bdbdbd" strokeWidth={4} strokeLinecap="round">
        <line ref={l12} x1={256} y1={256} x2={256} y2={256} />
        <line ref={l23} x1={256} y1={256} x2={256} y2={256} />
        <line ref={l31} x1={256} y1={256} x2={256} y2={256} />
      </g>
      <circle ref={b1} r={48} fill="#5a5a5a" />
      <circle ref={b2} r={36} fill="#8a8a8a" />
      <circle ref={b3} r={24} fill="#6f6f6f" />
    </svg>
  )
}
