import React, { useRef, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  DoubleSide,
  ArrowHelper,
  Vector3,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../assets/models/wedge.glb';

export default function OrangePuzzle() {
  const yGroupRef = useRef();
  const flipGroup = useRef();
  const groupRef = useRef();
  const meshRefs = useRef([]);

  const slices = 8;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const textures = useLoader(TextureLoader, ['/textures/1.png', '/textures/2.png', '/textures/3.png', '/textures/4.png', '/textures/5.png', '/textures/6.png', '/textures/7.png', '/textures/8.png']);
  const order = textures.map((_, i) => i);

  const gltf = useGLTF(wedgeModel);
  const wedgeBase = gltf.scene?.children[0];

  useEffect(() => {
    textures.forEach((tex) => {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.flipY = false;
    });
  }, [textures]);

  useEffect(() => {
    if (!wedgeBase) return;
    for (let i = 0; i < slices; i++) {
      const phiStart = i * basePhiLength;
      const group = new Group();
      group.rotation.y = phiStart;

      const wedgeClone = wedgeBase.clone(true);
      wedgeClone.position.set(0, 0, -gap);

      wedgeClone.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.map = textures[order[i]];
          child.material.roughness = 0.6;
          child.material.metalness = 0.9;
          child.material.side = DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      meshRefs.current[i] = wedgeClone;
      group.add(wedgeClone);
      groupRef.current.add(group);
    }
  }, [wedgeBase, textures]);

  const animRef = useRef(null);
  const animFrame = useRef();

  const animateTransform = () => {
    const anim = animRef.current;
    if (!anim) return;
    const now = performance.now();
    let t = (now - anim.start) / 500;
    if (t > 1) t = 1;

    const offset = Math.sin(Math.PI * t) * anim.distance;
    anim.lastOffset = offset;

    const rotationAngle = Math.PI;
    const deltaRot = t * rotationAngle - anim.lastRot;

    const rotDir = anim.direction === 'UP' ? -1 : 1;
    flipGroup.current.rotateZ(rotDir * deltaRot);
    anim.lastRot += deltaRot;

    if (t < 1) {
      animFrame.current = requestAnimationFrame(animateTransform);
    } else {
      anim.indices.forEach((i) => groupRef.current.attach(meshRefs.current[i]));
      flipGroup.current.rotation.set(0, 0, 0);
      animRef.current = null;
    }
  };


  const highlightAndTransform = (side, direction) => {
    const selected = [];
    for (let i = 0; i < slices; i++) {
      const worldPos = new Vector3();
      meshRefs.current[i]?.getWorldPosition(worldPos);
      const isLeft = worldPos.x < 0;
      if ((side === 'LEFT' && isLeft) || (side === 'RIGHT' && !isLeft)) {
        selected.push(i);
      }
    }

    const rotY = yGroupRef.current.rotation.y;
    const step = Math.PI / slices;
    const snappedY = (Math.round(rotY / step) * step);
    const worldDir = new Vector3(Math.cos(snappedY), 0, Math.sin(snappedY)).normalize();

    flipGroup.current.rotation.set(0, 0, 0);
    flipGroup.current.quaternion.setFromUnitVectors(
      new Vector3(0, 0, 1),
      worldDir.clone().normalize()
    );

    selected.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));

    const distance = side === 'LEFT' ? -0.5 : 0.5;
    animRef.current = {
      start: performance.now(),
      lastOffset: 0,
      distance,
      indices: selected,
      worldDir,
      lastRot: 0,
      direction,
    };
    cancelAnimationFrame(animFrame.current);
    animateTransform();
  };

  const isDragging = useRef(false);
  const prevX = useRef(0);
  const velocity = useRef(0);
  const frame = useRef();
  const dragStart = useRef({ x: 0, y: 0 });
  const directionLogged = useRef(false);

  useEffect(() => {
    const onDown = (e) => {
      isDragging.current = true;
      prevX.current = e.clientX;
      velocity.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY };
      directionLogged.current = false;
      cancelAnimationFrame(frame.current);
    };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = (e.clientX - prevX.current) * 0.01;
      yGroupRef.current.rotation.y += dx;
      velocity.current = dx;
      prevX.current = e.clientX;

      const dy = e.clientY - dragStart.current.y;
      if (!directionLogged.current && Math.abs(dy) > 40) {
        const side = dragStart.current.x > window.innerWidth / 2 ? 'RIGHT' : 'LEFT';
        const dir = dy < 0 ? 'UP' : 'DOWN';
        highlightAndTransform(side, dir);
        directionLogged.current = true;
      }
    };
    const onUp = () => {
      isDragging.current = false;
      const decay = () => {
        velocity.current *= 0.95;
        if (Math.abs(velocity.current) > 0.0001) {
          yGroupRef.current.rotation.y += velocity.current;
          frame.current = requestAnimationFrame(decay);
        }
      };
      frame.current = requestAnimationFrame(decay);
    };

    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointerleave', onUp);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointerleave', onUp);
      cancelAnimationFrame(frame.current);
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  useFrame(() => {
    meshRefs.current.forEach((mesh) => {
      const worldPos = new Vector3();
      mesh.getWorldPosition(worldPos);
    });
  });

  return (
    <group ref={yGroupRef}>
      <group ref={flipGroup}>
        <mesh>
          <boxGeometry></boxGeometry>
          <meshBasicMaterial wireframe></meshBasicMaterial>
        </mesh>
      </group>
      <group ref={groupRef} />
    </group>
  );
}