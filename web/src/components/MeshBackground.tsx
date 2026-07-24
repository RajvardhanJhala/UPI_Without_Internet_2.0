import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
}

/**
 * A slow drift of points that link up when they come near each other — an
 * ambient rendering of the same mesh the app is about. Reads the accent color
 * from the live --node-line token so it re-tints with the theme, tracks the
 * cursor (nearby nodes light up and the web parts around it), and honors
 * prefers-reduced-motion by painting a single static frame with no listeners.
 */
export function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let nodes: Node[] = []
    let raf = 0

    // Cursor state, in CSS pixels. active flips off when the pointer leaves.
    const mouse = { x: 0, y: 0, active: false }
    const MOUSE_RADIUS = 200 // px: how far the cursor's influence reaches
    const PART_STRENGTH = 26 // px: how far nearby nodes ease away from the cursor

    const themeInk = () => {
      const s = getComputedStyle(document.documentElement)
      return {
        rgb: s.getPropertyValue('--node-line').trim() || '124, 141, 255',
        intensity: parseFloat(s.getPropertyValue('--node-alpha')) || 0.9,
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Density scales with viewport area, capped so big screens stay calm.
      const count = Math.min(72, Math.floor((width * height) / 26000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
      }))
    }

    const draw = () => {
      const { rgb, intensity } = themeInk()
      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
      }

      // Render positions: nodes near the cursor are pushed radially outward so
      // the web appears to part around it. This is a draw-time offset only —
      // the underlying drift is untouched, so the effect fully resets when the
      // pointer leaves (no runaway velocities).
      const rx = new Array<number>(nodes.length)
      const ry = new Array<number>(nodes.length)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        rx[i] = n.x
        ry[i] = n.y
        if (mouse.active) {
          const dx = n.x - mouse.x
          const dy = n.y - mouse.y
          const d = Math.hypot(dx, dy)
          if (d > 0 && d < MOUSE_RADIUS) {
            const push = (1 - d / MOUSE_RADIUS) * PART_STRENGTH
            rx[i] += (dx / d) * push
            ry[i] += (dy / d) * push
          }
        }
      }

      const linkDist = 150
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = rx[i] - rx[j]
          const dy = ry[i] - ry[j]
          const dist = Math.hypot(dx, dy)
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.5 * intensity
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(rx[i], ry[i])
            ctx.lineTo(rx[j], ry[j])
            ctx.stroke()
          }
        }
      }

      // Brighter web fanning out from the cursor to the nodes it's near.
      if (mouse.active) {
        for (let i = 0; i < nodes.length; i++) {
          const dx = rx[i] - mouse.x
          const dy = ry[i] - mouse.y
          const dist = Math.hypot(dx, dy)
          if (dist < MOUSE_RADIUS) {
            const alpha = (1 - dist / MOUSE_RADIUS) * 0.85 * intensity
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
            ctx.lineWidth = 1.1
            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(rx[i], ry[i])
            ctx.stroke()
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        ctx.fillStyle = `rgba(${rgb}, ${0.85 * intensity})`
        ctx.beginPath()
        ctx.arc(rx[i], ry[i], 1.6, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      window.addEventListener('blur', onLeave)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="mesh-canvas" aria-hidden="true" />
}
