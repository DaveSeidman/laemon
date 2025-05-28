// src/components/OrangePuzzle.jsx
import React, { useRef, useEffect } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import {
  TextureLoader,
  RepeatWrapping,
  DoubleSide,
  ArrowHelper,
  Vector3
} from 'three'

export default function OrangePuzzle() {
  const yGroupRef = useRef()   // container for sphere + arrow + tempGroup
  const tempGroupRef = useRef()   // temporary group for translate + twist
  const groupRef = useRef()   // main slices group
  const meshRefs = useRef([]) // slice meshes
  const arrowRef = useRef()   // ArrowHelper
  const { gl } = useThree()

  const slices = 8
  const basePhiLength = (Math.PI * 2) / slices

  // load textures in fixed order
  const textures = useLoader(TextureLoader, [
    '/textures/1.png', '/textures/2.png', '/textures/3.png', '/textures/4.png',
    '/textures/5.png', '/textures/6.png', '/textures/7.png', '/textures/8.png'
  ])
  const order = textures.map((_, i) => i)

  // keep UVs square
  useEffect(() => {
    textures.forEach(tex => {
      tex.wrapS = RepeatWrapping
      tex.wrapT = RepeatWrapping
      tex.repeat.set(1, 4)
      tex.offset.set(0, 0.5)
    })
  }, [textures])

  // add ArrowHelper once
  useEffect(() => {
    if (!yGroupRef.current) return
    const arrow = new ArrowHelper(
      new Vector3(0, 0, 1),  // initial direction
      new Vector3(0, 0, 0),  // origin
      1.5,                   // length
      0xffff00               // color
    )
    yGroupRef.current.add(arrow)
    arrowRef.current = arrow
  }, [])

  // animation state
  const animRef = useRef(null)
  const animFrame = useRef()

  const animateTransform = () => {
    const anim = animRef.current
    if (!anim) return
    const now = performance.now()
    let t = (now - anim.start) / 500
    if (t > 1) t = 1

    // translate
    const offset = Math.sin(Math.PI * t) * anim.distance
    const delta = offset - anim.lastOffset
    tempGroupRef.current.position.add(anim.worldDir.clone().multiplyScalar(delta))
    anim.lastOffset = offset

    // twist
    const rotationAngle = Math.PI // 180 degrees
    const twistT = Math.sin(Math.PI * t) // ease in and out
    const deltaRot = twistT * rotationAngle - anim.lastRot
    tempGroupRef.current.rotateOnAxis(new Vector3(0, 1, 0), deltaRot)
    anim.lastRot += deltaRot

    if (t < 1) {
      animFrame.current = requestAnimationFrame(animateTransform)
    } else {
      anim.indices.forEach(i => groupRef.current.attach(meshRefs.current[i]))
      tempGroupRef.current.position.set(0, 0, 0)
      tempGroupRef.current.rotation.set(0, 0, 0)
      animRef.current = null
    }
  }

  // on swipe: highlight + transform
  const highlightAndTransform = (side, direction) => {
    const rotY = yGroupRef.current.rotation.y
    const selected = []
    for (let i = 0; i < slices; i++) {
      const midLocal = i * basePhiLength + basePhiLength / 2
      const midWorld = midLocal + rotY
      const onRight = Math.cos(midWorld) < 0
      if ((side === 'RIGHT' && onRight) || (side === 'LEFT' && !onRight)) {
        selected.push(i)
      }
    }
    console.log('Transforming segments:', selected)

    meshRefs.current.forEach((m, idx) => {
      if (!m) return
      m.material.color.set(
        selected.includes(idx)
          ? (direction === 'UP' ? 'green' : 'red')
          : 'white'
      )
    })

    const step = Math.PI / 4
    const nearest = Math.round(rotY / step) * step
    const worldDir = new Vector3(
      Math.cos(nearest), 0, Math.sin(nearest)
    ).normalize()
    arrowRef.current.setDirection(worldDir)

    tempGroupRef.current.position.set(0, 0, 0)
    tempGroupRef.current.rotation.set(0, 0, 0)
    tempGroupRef.current.quaternion.copy(arrowRef.current.quaternion)

    selected.forEach(i => tempGroupRef.current.attach(meshRefs.current[i]))

    const distance = side === 'LEFT' ? -0.5 : 0.5
    animRef.current = {
      start: performance.now(),
      lastOffset: 0,
      distance,
      indices: selected,
      worldDir,
      lastRot: 0
    }
    cancelAnimationFrame(animFrame.current)
    animateTransform()
  }

  // drag/swipe/inertia
  const isDragging = useRef(false)
  const prevX = useRef(0)
  const velocity = useRef(0)
  const frame = useRef()
  const dragStart = useRef({ x: 0, y: 0 })
  const directionLogged = useRef(false)

  useEffect(() => {
    const dom = gl.domElement
    const onDown = e => {
      isDragging.current = true
      prevX.current = e.clientX
      velocity.current = 0
      dragStart.current = { x: e.clientX, y: e.clientY }
      directionLogged.current = false
      cancelAnimationFrame(frame.current)
    }
    const onMove = e => {
      if (!isDragging.current) return
      const dx = (e.clientX - prevX.current) * 0.01
      yGroupRef.current.rotation.y += dx
      velocity.current = dx
      prevX.current = e.clientX

      const dy = e.clientY - dragStart.current.y
      if (!directionLogged.current && Math.abs(dy) > 40) {
        const side = dragStart.current.x > window.innerWidth / 2 ? 'RIGHT' : 'LEFT'
        const dir = dy < 0 ? 'UP' : 'DOWN'
        highlightAndTransform(side, dir)
        directionLogged.current = true
      }
    }
    const onUp = () => {
      isDragging.current = false
      const decay = () => {
        velocity.current *= 0.95
        if (Math.abs(velocity.current) > 0.0001) {
          yGroupRef.current.rotation.y += velocity.current
          frame.current = requestAnimationFrame(decay)
        }
      }
      frame.current = requestAnimationFrame(decay)
    }

    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointermove', onMove)
    dom.addEventListener('pointerup', onUp)
    dom.addEventListener('pointerleave', onUp)
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointermove', onMove)
      dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointerleave', onUp)
      cancelAnimationFrame(frame.current)
      cancelAnimationFrame(animFrame.current)
    }
  }, [gl, basePhiLength])

  return (
    <group ref={yGroupRef}>
      <group ref={tempGroupRef} />
      <group ref={groupRef}>
        {order.map((texIdx, i) => {
          const phiStart = i * basePhiLength + 0.005
          const phiLength = basePhiLength - 0.01
          return (
            <mesh key={i} ref={el => meshRefs.current[i] = el}>
              <sphereGeometry
                args={[1, 32, 32, phiStart, phiLength, 0, Math.PI]}
              />
              <meshStandardMaterial
                map={textures[texIdx]}
                roughness={0.6}
                metalness={0.9}
                side={DoubleSide}
                color="white"
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
