// TODO: decide between slices and wedges

import React, { useRef, useEffect } from 'react';
import { Vector3, Group, DoubleSide, Raycaster, MeshNormalMaterial, Vector2, MeshStandardMaterial, Quaternion } from 'three';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../../assets/models/wedges.glb';
import { cubicEase, shuffle } from '../../utils';
import './index.scss';

export default function Scene({ slices, twistIndex, setTwistIndex, onTwistComplete, reset, setReset }) {
  const rotationGroup = useRef();
  const flipGroup = useRef();
  const wedges = useRef();
  const meshRefs = useRef([]);
  const meshOrder = useRef([0, 1, 2, 3, 4, 5, 6, 7]);

  const { gl, camera } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());

  const step = (Math.PI * 2) / slices;
  const twistDuration = 500;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const gltf = useGLTF(wedgeModel);
  const twistAnimation = useRef(null);
  const animFrame = useRef();

  const checkIfSolved = () => {
    // Build an array with mesh + angle + original index
    const entries = meshRefs.current.map((mesh) => {
      const v = new Vector3();
      mesh.getWorldPosition(v);
      const rawAngle = Math.atan2(v.z, v.x);
      const angle = (rawAngle + (Math.PI / 2) + (2 * Math.PI)) % (2 * Math.PI);
      return { mesh, angle, originalIndex: mesh.userData.originalIndex };
    });

    // Sort by angle – clockwise order around the wheel
    entries.sort((a, b) => b.angle - a.angle);

    // Replace meshRefs.current with the new, ordered list
    meshRefs.current = entries.map((e) => e.mesh);

    // Extract the new wheel-order of original indices
    meshOrder.current = entries.map((e) => e.originalIndex);

    // Check if the puzzle is solved
    const diffs = meshOrder.current.slice(1).map((v, i) => (v - meshOrder.current[i] + slices) % slices);
    const isForward = diffs.every((d) => d === 1);
    const isBackward = diffs.every((d) => d === slices - 1);

    if (isForward || isBackward) {
      console.log('🟢 Puzzle is solved!', meshOrder.current);
    } else {
      // console.log('🔴 Not solved, current order:', meshOrder.current);
    }
  };

  const setWedges = () => {
    const sortedChildren = gltf.scene.children.sort((a, b) => (a.name > b.name ? 1 : -1));

    wedges.current.clear();
    const indices = [0, 1, 2, 3, 4, 5, 6, 7];

    indices.forEach((shuffledIndex, index) => {
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
      meshRefs.current[indices[index]] = wedge;
    });
  };
  // Model finished loading, set things up:
  useEffect(() => {
    if (gltf.scene.children.length < slices) return;

    setWedges();
    // const sortedChildren = gltf.scene.children.sort((a, b) => (a.name > b.name ? 1 : -1));

    // wedges.current.clear();
    // const indices = [0, 1, 2, 3, 4, 5, 6, 7];

    // indices.forEach((shuffledIndex, index) => {
    //   const wedge = sortedChildren[index].clone(true);
    //   wedge.userData.originalIndex = index;

    //   wedge.traverse((child) => {
    //     if (child.isMesh) {
    //       child.castShadow = true;
    //       child.receiveShadow = true;
    //     }
    //   });

    //   const offsetContainer = new Group();
    //   offsetContainer.position.set(0, 0, -gap);
    //   offsetContainer.add(wedge);

    //   const rotationContainer = new Group();
    //   rotationContainer.rotation.y = shuffledIndex * basePhiLength;
    //   rotationContainer.add(offsetContainer);

    //   wedges.current.add(rotationContainer);
    //   meshRefs.current[indices[index]] = wedge;
    // });
  }, [gltf]);

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
      console.log('done twisting');
      twistAnimation.current.indices.forEach((i) => wedges.current.attach(meshRefs.current[i]));
      twistAnimation.current = null;
      onTwistComplete();
      checkIfSolved();
    }
  };

  // setup twist based on the index of the first wedge in the selection of slices / 2
  const startTwist = (index) => {
    console.log('twist on', index);
    const selectedWedge = meshRefs.current[index];
    const worldPos = new Vector3();
    selectedWedge.getWorldPosition(worldPos);
    flipGroup.current.lookAt(worldPos.x, 0, worldPos.z);
    flipGroup.current.rotateY((Math.PI / 2) - (step / 2));
    const secondWedgeIndex = (index + 1) % slices;
    const thirdWedgeIndex = (index + 2) % slices;
    const fourthWedgeIndex = (index + 3) % slices;

    const slicesToFlip = [
      index,
      secondWedgeIndex,
      thirdWedgeIndex,
      fourthWedgeIndex,
    ];

    slicesToFlip.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));

    twistAnimation.current = {
      start: performance.now(),
      lastOffset: 0,
      distance: 0.5,
      indices: slicesToFlip,
      lastRot: 0,
      direction: Math.random() > 0.5 ? 'UP' : 'DOWN',
    };
    animateTwist();
  };

  useEffect(() => {
    const handleClick = (event) => {
      if (twistAnimation.current) return console.log('still twisting please wait');
      const { left, top, width, height } = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((event.clientX - left) / width) * 2 - 1;
      pointer.current.y = -((event.clientY - top) / height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(meshRefs.current);
      if (!hits.length) return;

      const hitObj = hits[0].object;
      const selectedWedge = hitObj.parent;
      const selectedWedgeIndex = meshRefs.current.findIndex((m) => m === selectedWedge);
      startTwist(selectedWedgeIndex);
    };

    gl.domElement.addEventListener('pointerdown', handleClick);
    return () => gl.domElement.removeEventListener('pointerdown', handleClick);
  }, [gl.domElement, camera, meshRefs.current]);

  useEffect(() => {
    if (twistIndex === null || !gltf) return;

    startTwist(twistIndex);
  }, [twistIndex, gltf]);

  useEffect(() => {
    if (reset) {
      setWedges();
      // wedges.current.children.forEach((container, idx) => {
      //   container.rotation.y = idx * basePhiLength;
      // });
      // flipGroup.current.rotation.set(0, 0, 0);
      // setTwistIndex(null);
      setReset(false);
    }
  }, [reset]);

  return (
    <group ref={rotationGroup}>
      <group ref={flipGroup} />
      <group ref={wedges} />
    </group>
  );
}
