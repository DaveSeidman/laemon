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
  const twistDuration = 500;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const gltf = useGLTF(wedgeModel);
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

    // Sort by angle – clockwise order around the wheel
    entries.sort((a, b) => b.angle - a.angle);

    // Replace meshRefs.current with the new, ordered list
    meshRefs.current = entries.map((e) => e.mesh);

    //      (optional) store a “currentIndex” on each mesh for easy logging/debugging
    // meshRefs.current.forEach((mesh, i) => (mesh.userData.currentIndex = i));

    // Extract the new wheel-order of original indices
    meshOrder.current = entries.map((e) => e.originalIndex);

    // Check if the puzzle is solved
    const diffs = meshOrder.current.slice(1).map((v, i) => (v - meshOrder.current[i] + slices) % slices);
    const isForward = diffs.every((d) => d === 1);
    const isBackward = diffs.every((d) => d === slices - 1);

    // console.log(meshRefs.current.map((m) => m.userData.originalIndex + 1));
    // console.log(meshRefs.current.map((m) => `${m.userData.originalIndex} → ${m.userData.currentIndex}`));
    // setTwistIndex(null);
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

  useEffect(() => {
    const handleClick = (event) => {
      if (twistAnimation.current) return console.log('still twisting please wait');
      // normalize pointer coords into NDC space
      const { left, top, width, height } = gl.domElement.getBoundingClientRect();
      pointer.current.x = ((event.clientX - left) / width) * 2 - 1;
      pointer.current.y = -((event.clientY - top) / height) * 2 + 1;

      raycaster.current.setFromCamera(pointer.current, camera);

      const hits = raycaster.current.intersectObjects(meshRefs.current);
      if (!hits.length) return;

      const hitObj = hits[0].object;
      const selectedWedge = hitObj.parent;

      const selectedWedgeIndex = meshRefs.current.findIndex((m) => m === selectedWedge);

      const worldPos = new Vector3();
      selectedWedge.getWorldPosition(worldPos);
      flipGroup.current.lookAt(worldPos.x, 0, worldPos.z);
      flipGroup.current.rotateY((Math.PI / 2) - (step / 2));

      const secondWedgeIndex = (selectedWedgeIndex + 1) % slices;
      const thirdWedgeIndex = (selectedWedgeIndex + 2) % slices;
      const fourthWedgeIndex = (selectedWedgeIndex + 3) % slices;

      const slicesToFlip = [
        selectedWedgeIndex,
        secondWedgeIndex,
        thirdWedgeIndex,
        fourthWedgeIndex,
      ];
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

      slicesToFlip.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));

      twistAnimation.current = {
        start: performance.now(),
        lastOffset: 0,
        distance: 0.5,
        indices: slicesToFlip,
        lastRot: 0,
        direction: 'UP',
      };
      animateTwist();
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
      // flipGroup.current.rotation.set(0, 0, 0);
      // const snappedY = Math.round((rotationGroup.current.rotation.y - (step / 2)) / step) * step + (step / 2) + (Math.PI / 2);
      // flipGroup.current.rotation.y = -snappedY;
      twistAnimation.current = null;
      checkIfSolved();
    }
  };

  useEffect(() => {
    if (highlight !== null) {
      const mesh = meshRefs.current[highlight].children[0];
      mesh.material = highlightMaterial.current;
      prevHighlight.current = mesh;
    } else if (prevHighlight.current) {
      prevHighlight.current.material = originalMaterial.current;
    }
  }, [highlight]);

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
