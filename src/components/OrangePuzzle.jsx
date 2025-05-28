// src/components/OrangePuzzle.jsx
import React, { useRef, useState, useEffect } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import {
  TextureLoader,
  RepeatWrapping,
  DoubleSide,
  Vector3,
  Quaternion
} from 'three'

export default function OrangePuzzle() {
  const groupRef = useRef()
  const flipGroupRef = useRef()
  const meshRefs = useRef([])
  const { gl } = useThree()

  const slices = 8
  const basePhiLength = (Math.PI * 2) / slices

  const textures = useLoader(TextureLoader, [
    '/textures/1.png', '/textures/2.png', '/textures/3.png', '/textures/4.png',
    '/textures/5.png', '/textures/6.png', '/textures/7.png', '/textures/8.png',
  ])

  const [order] = useState(() =>
    textures.map((_, i) => i).sort(() => Math.random() - 0.5)
  )

  useEffect(() => {
    textures.forEach((tex) => {
      tex.wrapS = RepeatWrapping
      tex.wrapT = RepeatWrapping
      tex.repeat.set(1, 4)
      tex.offset.set(0, 0.5)
    })
  }, [textures])

  const getSideIndices = (side) => {
    const rotY = groupRef.current.rotation.y
    return Array.from({ length: slices }, (_, i) => {
      const midLocal = i * basePhiLength + basePhiLength / 2
      const midWorld = midLocal + rotY
      const onRight = Math.cos(midWorld) < 0
      return (side === 'RIGHT' ? onRight : !onRight) ? i : null
    }).filter((v) => v !== null)
  }

  const flipAnimRef = useRef(null)
  const flipFrame = useRef()

  const animateFlip = () => {
    const { startTime, axisVec, totalAngle } = flipAnimRef.current
    const now = performance.now()
    let t = (now - startTime) / 500
    if (t > 1) t = 1
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const q = new Quaternion().setFromAxisAngle(axisVec, totalAngle * ease)
    flipGroupRef.current.setRotationFromQuaternion(q)

    if (t < 1) {
      flipFrame.current = requestAnimationFrame(animateFlip)
    } else {
      // detach children back
      const fg = flipGroupRef.current
      const mg = groupRef.current
      Array.from(fg.children).forEach((m) => mg.attach(m))
      fg.rotation.set(0, 0, 0)
      flipAnimRef.current = null
    }
  }

  const triggerFlip = (side, direction) => {
    const indices = getSideIndices(side)
    const sign = direction === 'UP' ? 1 : -1

    // attach to flipGroup
    const fg = flipGroupRef.current
    const mg = groupRef.current
    indices.forEach((i) => fg.attach(meshRefs.current[i]))

    // axis: vector between two middle slices
    const sorted = indices.slice().sort((a, b) => a - b)
    const [i1, i2] = [sorted[1], sorted[2]]
    const rotY = mg.rotation.y
    const mid1 = i1 * basePhiLength + basePhiLength / 2 + rotY
    const mid2 = i2 * basePhiLength + basePhiLength / 2 + rotY
    const gapMid = (mid1 + mid2) / 2
    const gapVec = new Vector3(Math.cos(gapMid), 0, Math.sin(gapMid)).normalize()
    const axisVec = new Vector3().crossVectors(new Vector3(0, 1, 0), gapVec).normalize()

    flipAnimRef.current = {
      startTime: performance.now(),
      axisVec,
      totalAngle: Math.PI * sign
    }
    cancelAnimationFrame(flipFrame.current)
    animateFlip()
  }

  // drag + inertia + gesture
  const isDragging = useRef(false)
  const prevX = useRef(0)
  const velocity = useRef(0)
  const frame = useRef()
  const dragStart = useRef({ x: 0, y: 0 })
  const directionLogged = useRef(false)

  useEffect(() => {
    const dom = gl.domElement

    const onDown = (e) => {
      isDragging.current = true
      prevX.current = e.clientX
      velocity.current = 0
      dragStart.current = { x: e.clientX, y: e.clientY }
      directionLogged.current = false
      cancelAnimationFrame(frame.current)
    }
    const onMove = (e) => {
      if (!isDragging.current) return
      const deltaRot = (e.clientX - prevX.current) * 0.01
      groupRef.current.rotation.y += deltaRot
      velocity.current = deltaRot
      prevX.current = e.clientX

      if (!directionLogged.current && Math.abs(e.clientY - dragStart.current.y) > 40) {
        const side = dragStart.current.x > window.innerWidth / 2 ? 'RIGHT' : 'LEFT'
        const dir = e.clientY < dragStart.current.y ? 'UP' : 'DOWN'
        triggerFlip(side, dir)
        directionLogged.current = true
      }
    }
    const onUp = () => {
      isDragging.current = false
      const decay = () => {
        velocity.current *= 0.95
        if (Math.abs(velocity.current) > 0.0001) {
          groupRef.current.rotation.y += velocity.current
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
      cancelAnimationFrame(flipFrame.current)
    }
  }, [gl, basePhiLength])

  return (
    <group ref={groupRef}>
      <group ref={flipGroupRef} />
      {order.map((texIdx, i) => {
        const basePhiStart = i * basePhiLength
        const phiStart = basePhiStart + 0.005
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
  )
}
