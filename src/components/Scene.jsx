import React, { useRef, useEffect } from 'react';
import { Vector3, Group, DoubleSide, } from 'three';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../assets/models/wedges.glb';
import { cubicEase, shuffle } from '../utils';

export default function Scene() {
  const rotationGroup = useRef();
  const flipGroup = useRef();
  const wedges = useRef();
  const meshRefs = useRef([]);

  const slices = 8;
  const step = (Math.PI * 2) / slices;
  const twistDuration = 900;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const gltf = useGLTF(wedgeModel);
  const wedgeBase = gltf.scene?.children[0];

  const checkIfSolved = () => {
    // 1) Get the puzzle’s current yaw
    const yaw = rotationGroup.current.rotation.y % (2 * Math.PI);

    // 2) Build an array of { originalIndex, relAngle }
    const entries = meshRefs.current.map(mesh => {
      const v = new Vector3();
      mesh.getWorldPosition(v);

      // raw angle around Y, rebased so –Z → 0, in [0,2π)
      let raw = Math.atan2(v.z, v.x);
      raw = (raw + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);

      // subtract the ring’s yaw and normalize back into [0,2π)
      const rel = (raw - yaw + 2 * Math.PI) % (2 * Math.PI);

      return {
        originalIndex: mesh.userData.originalIndex,
        relAngle: rel
      };
    });

    // 3) Sort by that relAngle and pull out the original indices
    const ordered = entries
      .slice()
      .sort((a, b) => a.relAngle - b.relAngle)
      .map(e => e.originalIndex);

    // 4) Compute “circular diffs” between consecutive entries, mod slices
    const diffs = ordered
      .slice(1)
      .map((v, i) => (v - ordered[i] + slices) % slices);

    // 5) Check for a constant +1 (forward) or (slices-1) (backward) step
    const isForward = diffs.every(d => d === 1);
    const isBackward = diffs.every(d => d === slices - 1);

    if (isForward || isBackward) {
      console.log('🟢 Puzzle is solved!');
    } else {
      console.log('🔴 Not solved, current order:', ordered);
    }
  };


  useEffect(() => {

    if (gltf.scene.children.length < slices) return;
    const sortedChildren = gltf.scene.children.sort((a, b) => a.name > b.name ? 1 : -1)

    wedges.current.clear();
    const orderedIndices = [0, 1, 2, 3, 4, 5, 6, 7];
    // const shuffledIndices = shuffle(orderedIndices)

    // shuffledIndices.forEach((shuffledIndex, index) => {
    orderedIndices.forEach((shuffledIndex, index) => {
      const wedge = sortedChildren[index].clone(true);
      wedge.userData.originalIndex = index;

      wedge.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const offsetContainer = new Group();
      offsetContainer.position.set(0, 0, -gap);
      offsetContainer.add(wedge);

      const rotationContainer = new Group();
      rotationContainer.rotation.y = shuffledIndex * basePhiLength;
      rotationContainer.add(offsetContainer);

      wedges.current.add(rotationContainer);
      meshRefs.current[orderedIndices[index]] = wedge;
    });
  }, [gltf]);


  const twistAnimation = useRef(null);
  const animFrame = useRef();

  const animateTwist = () => {
    if (!twistAnimation.current) return;
    let t = (performance.now() - twistAnimation.current.start) / twistDuration;
    if (t > 1) t = 1;

    const easedT = cubicEase(t);

    const offset = Math.sin(Math.PI * easedT) * twistAnimation.current.distance; // You can keep the sine or use the easedT directly
    twistAnimation.current.lastOffset = offset;

    const rotationAngle = Math.PI;
    const deltaRot = easedT * rotationAngle - twistAnimation.current.lastRot;

    const rotDir = twistAnimation.current.direction === 'UP' ? 1 : -1;
    flipGroup.current.rotateZ(rotDir * deltaRot);
    twistAnimation.current.lastRot += deltaRot;

    if (easedT < 1) {
      animFrame.current = requestAnimationFrame(animateTwist);
    } else {
      twistAnimation.current.indices.forEach((i) => wedges.current.attach(meshRefs.current[i]));
      flipGroup.current.rotation.set(0, 0, 0);
      const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2)
      flipGroup.current.rotation.y = -snappedY;
      twistAnimation.current = null;
      checkIfSolved();
    }
  };

  const setupTwist = (side, direction) => {

    const selected = [];
    for (let i = 0; i < slices; i += 1) {
      const worldPos = new Vector3();
      meshRefs.current[i]?.getWorldPosition(worldPos);
      const isLeft = worldPos.x < 0;
      if ((side === 'LEFT' && isLeft) || (side === 'RIGHT' && !isLeft)) {
        selected.push(i);
      }
    }
    selected.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));


    const distance = side === 'LEFT' ? -0.5 : 0.5;
    twistAnimation.current = {
      start: performance.now(),
      lastOffset: 0,
      distance,
      indices: selected,
      lastRot: 0,
      direction,
    };
    cancelAnimationFrame(animFrame.current);
    animateTwist();
  };

  const isDragging = useRef(false);
  const dragged = useRef(false);
  const prevX = useRef(0);
  const velocity = useRef(0);
  const spinFrame = useRef();
  const dragStart = useRef({ x: 0, y: 0 });
  const directionLogged = useRef(false);


  useEffect(() => {
    const onClick = (e) => {
      if (!dragged.current) velocity.current = e.clientX / innerWidth < .5 ? .05 : -.05;
    }

    const onDown = (e) => {
      dragged.current = false;
      if (twistAnimation.current) return;
      isDragging.current = true;
      prevX.current = e.clientX;
      velocity.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY };
      directionLogged.current = false;
      cancelAnimationFrame(spinFrame.current);
    };
    const onMove = (e) => {
      dragged.current = true;
      if (twistAnimation.current) return;
      if (!isDragging.current) return;
      const dx = (e.clientX - prevX.current) * 0.01;
      rotationGroup.current.rotation.y += dx;

      const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2)
      flipGroup.current.rotation.y = -snappedY;
      velocity.current = dx;
      prevX.current = e.clientX;

      const dy = e.clientY - dragStart.current.y;

      // pointer moved enough up or down, start a twist
      if (!directionLogged.current && Math.abs(dy) > 50) {
        const side = dragStart.current.x > window.innerWidth / 2 ? 'RIGHT' : 'LEFT';
        const dir = dy < 0 ? 'UP' : 'DOWN';
        setupTwist(side, dir);
        directionLogged.current = true;
      }
    };
    const onUp = () => {
      isDragging.current = false;
      if (twistAnimation.current) return;
      const decay = () => {
        velocity.current *= 0.95;
        if (Math.abs(velocity.current) > 0.0001) {
          rotationGroup.current.rotation.y += velocity.current;
          spinFrame.current = requestAnimationFrame(decay);
          const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2)
          flipGroup.current.rotation.y = -snappedY;
        }
      };
      spinFrame.current = requestAnimationFrame(decay);
    };
    addEventListener('click', onClick);
    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointerleave', onUp);
    return () => {
      removeEventListener('click', onClick);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointerleave', onUp);
      cancelAnimationFrame(spinFrame.current);
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <group ref={rotationGroup}>
      <group ref={flipGroup} />
      <group ref={wedges} />
    </group>
  );
}