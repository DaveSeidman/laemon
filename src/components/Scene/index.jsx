// TODO: decide between slices and wedges

import React, { useRef, useEffect } from 'react';
import { Vector3, Group, DoubleSide, Raycaster, MeshNormalMaterial, Vector2, MeshStandardMaterial, Quaternion } from 'three';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../../assets/models/wedges.glb';
import { cubicEase, shuffle } from '../../utils';
import './index.scss';

export default function Scene({ slices, twistIndex, setTwistIndex, highlight }) {
  const rotationGroup = useRef();
  const flipGroup = useRef();
  const wedges = useRef();
  const meshRefs = useRef([]);
  const meshOrder = useRef([0, 1, 2, 3, 4, 5, 6, 7]);

  const step = (Math.PI * 2) / slices;
  const twistDuration = 2000;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const gltf = useGLTF(wedgeModel);
  const isDragging = useRef(false);
  const dragged = useRef(false);
  const prevX = useRef(0);
  const velocity = useRef(0);
  const spinFrame = useRef();
  const dragStart = useRef({ x: 0, y: 0 });
  const directionLogged = useRef(false);
  const twistAnimation = useRef(null);
  const animFrame = useRef();
  const originalMaterial = useRef();
  const prevHighlight = useRef();
  const highlightMaterial = useRef(new MeshNormalMaterial());
  const primaryMaterial = useRef(new MeshStandardMaterial({ color: '#ffa500' }));
  const secondaryMaterial = useRef(new MeshStandardMaterial({ color: '#4d3303' }));

  const checkIfSolved = () => {
    // 1️⃣  Build an array with mesh + angle + original index
    const entries = meshRefs.current.map((mesh) => {
      const v = new Vector3();
      mesh.getWorldPosition(v);

      const rawAngle = Math.atan2(v.z, v.x);

      const angle = (rawAngle + (Math.PI / 2) + (2 * Math.PI)) % (2 * Math.PI);

      return {
        mesh, // reference to the wedge mesh
        angle, // its current polar angle
        originalIndex: mesh.userData.originalIndex,
      };
    });

    // 2️⃣  Sort by angle – clockwise order around the wheel
    entries.sort((a, b) => a.angle - b.angle);

    // 3️⃣  Replace meshRefs.current with the new, ordered list
    meshRefs.current = entries.map((e) => e.mesh);

    //      (optional) store a “currentIndex” on each mesh for easy logging/debugging
    // meshRefs.current.forEach((mesh, i) => (mesh.userData.currentIndex = i));

    // 4️⃣  Extract the new wheel-order of original indices
    meshOrder.current = entries.map((e) => e.originalIndex);

    // 5️⃣  Check if the puzzle is solved
    const diffs = meshOrder.current
      .slice(1)
      .map((v, i) => (v - meshOrder.current[i] + slices) % slices);

    const isForward = diffs.every((d) => d === 1);
    const isBackward = diffs.every((d) => d === slices - 1);

    console.log(meshRefs.current.map((m) => m.userData.originalIndex + 1));
    // console.log(meshRefs.current.map((m) => `${m.userData.originalIndex} → ${m.userData.currentIndex}`));
    setTwistIndex(null);
    if (isForward || isBackward) {
      console.log('🟢 Puzzle is solved!', meshOrder.current);
    } else {
      // console.log('🔴 Not solved, current order:', meshOrder.current);
    }
  };

  // Model finished loading, set things up:
  useEffect(() => {
    if (gltf.scene.children.length < slices) return;
    const sortedChildren = gltf.scene.children.sort((a, b) => (a.name > b.name ? 1 : -1));

    wedges.current.clear();
    const indices = [0, 1, 2, 3, 4, 5, 6, 7];

    indices.forEach((shuffledIndex, index) => {
      const wedge = sortedChildren[index].clone(true);
      wedge.userData.originalIndex = index;
      // wedge.userData.currentIndex = index;
      if (index === 0) {
        originalMaterial.current = wedge.children[0].material.clone();
      }
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
      meshRefs.current[indices[index]] = wedge;
    });
  }, [gltf]);

  const { gl, camera } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());

  // … your other useEffects …

  // ★ CLICK → find which wedge was hit ★
  useEffect(() => {
    const handleClick = (event) => {
      console.log('clicked');
      // normalize pointer coords into NDC space
      const { left, top, width, height } = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((event.clientX - left) / width) * 2 - 1;
      pointer.current.y = -((event.clientY - top) / height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      const hits = raycaster.current.intersectObjects(meshRefs.current);
      if (!hits.length) return;

      const hitObj = hits[0].object;
      const selectedWedge = hitObj.parent;

      const direction = new Vector3();
      // const quat = new Quaternion();
      selectedWedge.getWorldDirection(direction);
      const angle = -Math.atan2(direction.z, direction.x) - step / 2;
      // angle = (angle + (Math.PI / 2) + (0 * Math.PI)) % (2 * Math.PI);
      flipGroup.current.rotation.y = angle;

      // selectedWedge.getWorldQuaternion(quat);
      console.log(angle * (180 / Math.PI));

      const selectedWedgeIndex = meshRefs.current.findIndex((m) => m === selectedWedge);
      const secondWedgeIndex = (selectedWedgeIndex + 1) % slices;
      const thirdWedgeIndex = (selectedWedgeIndex + 2) % slices;
      const fourthWedgeIndex = (selectedWedgeIndex + 3) % slices;

      meshRefs.current[selectedWedgeIndex].children[0].material = primaryMaterial.current;
      meshRefs.current[secondWedgeIndex].children[0].material = secondaryMaterial.current;
      meshRefs.current[thirdWedgeIndex].children[0].material = secondaryMaterial.current;
      meshRefs.current[fourthWedgeIndex].children[0].material = secondaryMaterial.current;

      setTimeout(() => {
        meshRefs.current[selectedWedgeIndex].children[0].material = originalMaterial.current;
        meshRefs.current[secondWedgeIndex].children[0].material = originalMaterial.current;
        meshRefs.current[thirdWedgeIndex].children[0].material = originalMaterial.current;
        meshRefs.current[fourthWedgeIndex].children[0].material = originalMaterial.current;
      }, 500);
    };

    gl.domElement.addEventListener('pointerdown', handleClick);
    return () => gl.domElement.removeEventListener('pointerdown', handleClick);
  }, [gl.domElement, camera, meshRefs.current, setTwistIndex]);

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
      const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2);
      flipGroup.current.rotation.y = -snappedY;
      twistAnimation.current = null;
      checkIfSolved();
    }
  };

  const twist = (side, direction, indices) => {
    const slicesToFlip = indices || (() => {
      const picked = [];
      for (let i = 0; i < slices; i += 1) {
        const worldPos = new Vector3();
        meshRefs.current[i].getWorldPosition(worldPos);

        // bring that point into the wheel’s own rotated coords:
        rotationGroup.current.parent.worldToLocal(worldPos);
        const isLeft = worldPos.x < 0;
        if ((side === 'LEFT' && isLeft) || (side === 'RIGHT' && !isLeft)) {
          picked.push(i);
        }
      }
      return picked;
    })();

    slicesToFlip.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));
    // console.log(slicesToFlip, indices);
    const distance = side === 'LEFT' ? -0.5 : 0.5;
    twistAnimation.current = {
      start: performance.now(),
      lastOffset: 0,
      distance,
      indices: slicesToFlip,
      lastRot: 0,
      direction,
    };
    cancelAnimationFrame(animFrame.current);
    animateTwist();
  };

  useEffect(() => {
    if (twistIndex === null) return;

    // const adjustedIndex = twistIndex; // meshRefs.current[twistIndex].userData.originalIndex;
    // flipGroup.current.rotation.y = twistIndex * step - (step / 2) + (Math.PI / 2);
    // const selected = Array.from({ length: 4 }, (_, i) => (twistIndex + i + 0) % slices);
    // console.log(selected);
    // // const leftRight = Math.random() > 0.5 ? 'RIGHT' : 'LEFT';
    // const upDown = Math.random() > 0.5 ? 'UP' : 'DOWN';
    // const tempMaterial = new MeshNormalMaterial();
    // meshRefs.current.forEach((mesh, index) => {
    //   if (selected.indexOf(index) >= 0) {
    //     // console.log(mesh);
    //     mesh.children[0].material = tempMaterial;
    //   }
    // });
    // setTimeout(() => {
    //   twist('LEFT', upDown, selected);
    // }, 2000);

    // setTimeout(() => {
    //   meshRefs.current.forEach((mesh, index) => {
    //     if (selected.indexOf(index) >= 0) {
    //       mesh.children[0].material = originalMaterial.current;
    //     }
    //   });
    // }, 4000);
  }, [twistIndex]);

  useEffect(() => {
    if (highlight !== null) {
      const mesh = meshRefs.current[highlight].children[0];
      mesh.material = highlightMaterial.current;
      prevHighlight.current = mesh;
    } else if (prevHighlight.current) {
      prevHighlight.current.material = originalMaterial.current;
    }
  }, [highlight]);

  useEffect(() => {
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

      const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2);
      flipGroup.current.rotation.y = -snappedY;
      // console.log(flipGroup.current.rotation.y);
      velocity.current = dx;
      prevX.current = e.clientX;

      const dy = e.clientY - dragStart.current.y;

      // pointer moved enough up or down, start a twist
      if (!directionLogged.current && Math.abs(dy) > 50) {
        const side = dragStart.current.x > window.innerWidth / 2 ? 'RIGHT' : 'LEFT';
        const dir = dy < 0 ? 'UP' : 'DOWN';
        twist(side, dir);
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
          const snappedY = (Math.round(rotationGroup.current.rotation.y / step - 0.5) + 0.5) * step + Math.PI / 2;
          flipGroup.current.rotation.y = -snappedY;
        }
      };
      spinFrame.current = requestAnimationFrame(decay);
    };

    // addEventListener('pointerdown', onDown);
    // addEventListener('pointermove', onMove);
    // addEventListener('pointerup', onUp);
    // addEventListener('pointerleave', onUp);
    // TODO: we need to give
    // onMove();
    // const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2);
    // flipGroup.current.rotation.y = -snappedY;

    return () => {
      // removeEventListener('pointerdown', onDown);
      // removeEventListener('pointermove', onMove);
      // removeEventListener('pointerup', onUp);
      // removeEventListener('pointerleave', onUp);
      cancelAnimationFrame(spinFrame.current);
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <group ref={rotationGroup}>
      <group ref={flipGroup}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial wireframe />
        </mesh>
        <arrowHelper />
      </group>
      <group ref={wedges} />
    </group>
  );
}
