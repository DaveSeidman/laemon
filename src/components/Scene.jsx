import React, { useRef, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, RepeatWrapping, DoubleSide, Vector3, Group, } from 'three';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../assets/models/wedge2.glb';
import texture1 from '../assets/images/1.png';
import texture2 from '../assets/images/2.png';
import texture3 from '../assets/images/3.png';
import texture4 from '../assets/images/4.png';
import texture5 from '../assets/images/5.png';
import texture6 from '../assets/images/6.png';
import texture7 from '../assets/images/7.png';
import texture8 from '../assets/images/8.png';
import { shuffle } from '../utils';

const cubicBezierEasing = (t) => {
  // t: 0 to 1, output value will be in the range of 0 to 1
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default function OrangePuzzle() {
  const yGroupRef = useRef();
  const flipGroup = useRef();
  const groupRef = useRef();
  const meshRefs = useRef([]);

  const slices = 8;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.05;

  const textures = useLoader(TextureLoader, [texture1, texture2, texture3, texture4, texture5, texture6, texture7, texture8]);
  const order = shuffle(textures.map((_, i) => i));

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
    let t = (now - anim.start) / 500; // 500ms duration
    if (t > 1) t = 1;

    // Apply the cubic bezier easing to t
    const easedT = cubicBezierEasing(t);

    const offset = Math.sin(Math.PI * easedT) * anim.distance; // You can keep the sine or use the easedT directly
    anim.lastOffset = offset;

    const rotationAngle = Math.PI;
    const deltaRot = easedT * rotationAngle - anim.lastRot;

    const rotDir = anim.direction === 'UP' ? -1 : 1;
    flipGroup.current.rotateZ(rotDir * deltaRot);
    anim.lastRot += deltaRot;

    if (easedT < 1) {
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
          {/* <boxGeometry></boxGeometry> */}
          <meshBasicMaterial wireframe></meshBasicMaterial>
        </mesh>
      </group>
      <group ref={groupRef} />
    </group>
  );
}