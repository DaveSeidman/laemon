import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Group, Raycaster, Vector2, Vector3 } from 'three';
import AlphaGlow from './AlphaGlow';
import wedgeModel from '../../assets/models/wedges.glb';
import { cubicEase } from '../../utils';
import './index.scss';

function PuzzleScene({
  slices,
  twistIndex,
  onTwistComplete,
  reset,
  setReset,
  setCompleted,
  shuffling,
  startFlare,
  setStartFlare,
}) {
  const rotationGroup = useRef();
  const flipGroup = useRef();
  const wedges = useRef();
  const meshRefs = useRef([]);
  const meshOrder = useRef([0, 1, 2, 3, 4, 5, 6, 7]);

  const { gl, camera } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());

  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const step = (Math.PI * 2) / slices;
  const twistDuration = 900;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const gltf = useGLTF(wedgeModel);
  const twistAnimation = useRef(null);
  const animFrame = useRef();

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

  const checkIfSolved = () => {
    const entries = meshRefs.current.map((mesh) => {
      const v = new Vector3();
      mesh.getWorldPosition(v);
      const rawAngle = Math.atan2(v.z, v.x);
      const angle = (rawAngle + (Math.PI / 2) + (2 * Math.PI)) % (2 * Math.PI);
      return { mesh, angle, originalIndex: mesh.userData.originalIndex };
    });

    entries.sort((a, b) => b.angle - a.angle);
    meshRefs.current = entries.map((e) => e.mesh);
    meshOrder.current = entries.map((e) => e.originalIndex);

    const diffs = meshOrder.current.slice(1).map((v, i) => (v - meshOrder.current[i] + slices) % slices);
    const isForward = diffs.every((d) => d === 1);
    const isBackward = diffs.every((d) => d === slices - 1);

    if (isForward || isBackward) {
      console.log('🟢 Puzzle is solved!', meshOrder.current);
      if (!shuffling) setCompleted(true);
    }
  };

  const animateTwist = () => {
    if (!twistAnimation.current) return;
    let t = (performance.now() - twistAnimation.current.start) / twistDuration;
    if (t > 1) t = 1;

    const easedT = cubicEase(t);
    const rotationAngle = Math.PI;
    const deltaRot = easedT * rotationAngle - twistAnimation.current.lastRot;
    const rotDir = twistAnimation.current.direction === 'UP' ? 1 : -1;

    flipGroup.current.rotateZ(rotDir * deltaRot);
    twistAnimation.current.lastRot += deltaRot;

    if (easedT < 1) {
      animFrame.current = requestAnimationFrame(animateTwist);
    } else {
      twistAnimation.current.indices.forEach((i) => wedges.current.attach(meshRefs.current[i]));
      twistAnimation.current = null;
      onTwistComplete();
      checkIfSolved();
    }
  };

  const startTwist = (index) => {
    if (twistAnimation.current) return;
    const selectedWedge = meshRefs.current[index];
    const worldPos = new Vector3();
    selectedWedge.getWorldPosition(worldPos);
    flipGroup.current.lookAt(worldPos.x, 0, worldPos.z);
    flipGroup.current.rotateY((Math.PI / 2) - (step / 2));

    const slicesToFlip = [
      index,
      (index + 1) % slices,
      (index + 2) % slices,
      (index + 3) % slices,
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

  const handlePointerClick = (event) => {
    const { left, top, width, height } = gl.domElement.getBoundingClientRect();
    pointer.current.x = ((event.clientX - left) / width) * 2 - 1;
    pointer.current.y = -((event.clientY - top) / height) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera);
    const hits = raycaster.current.intersectObjects(meshRefs.current);
    if (!hits.length) return;

    const hitObj = hits[0].object;
    const selectedWedge = hitObj.parent;
    const selectedIndex = meshRefs.current.findIndex((m) => m === selectedWedge);
    startTwist(selectedIndex);
  };

  useEffect(() => {
    const dom = gl.domElement;
    const onPointerDown = (event) => {
      if (twistAnimation.current) return;
      startPos.current = { x: event.clientX, y: event.clientY };
      isDragging.current = false;
      dom.addEventListener('pointermove', onPointerMove);
      dom.addEventListener('pointerup', onPointerUp);
    };
    const onPointerMove = (event) => {
      const dx = event.clientX - startPos.current.x;
      const dy = event.clientY - startPos.current.y;
      if (Math.hypot(dx, dy) > 5) {
        isDragging.current = true;
      }
    };
    const onPointerUp = (event) => {
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      if (!isDragging.current) {
        handlePointerClick(event);
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl.domElement, camera, meshRefs.current]);

  useEffect(() => {
    if (gltf.scene.children.length < slices) return;
    setWedges();
  }, [gltf]);

  useEffect(() => {
    if (twistIndex === null || !gltf) return;
    startTwist(twistIndex);
  }, [twistIndex, gltf]);

  useEffect(() => {
    if (reset) {
      setWedges();
      setReset(false);
    }
  }, [reset]);

  const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

  const flare = () => {
    const duration = 4000;
    const maxGap = 3;
    const minGap = 0.01;
    const startTime = performance.now();

    const animateRotationGroup = () => {
      const now = performance.now();
      const t = Math.min((now - startTime) / duration, 1);
      const eased = easeInOutQuad(t);
      if (rotationGroup.current) {
        rotationGroup.current.rotation.y = eased * Math.PI;
      }
      if (t < 1) {
        requestAnimationFrame(animateRotationGroup);
      }
    };
    requestAnimationFrame(animateRotationGroup);

    wedges.current.children.forEach((rotationContainer, index) => {
      const offsetContainer = rotationContainer.children[0];
      const start = performance.now() + index * 100;

      const animate = () => {
        const now = performance.now();
        const t = (now - start) / duration;

        if (t < 0) {
          requestAnimationFrame(animate);
          return;
        }

        const easedT = Math.min(t, 1);
        let gap;
        let rotation;

        if (easedT < 0.5) {
          const p = cubicEase(easedT * 2);
          gap = minGap + (maxGap - minGap) * p;
          rotation = Math.PI * p;
        } else {
          const p = cubicEase((1 - easedT) * 2);
          gap = minGap + (maxGap - minGap) * p;
          rotation = Math.PI * p;
        }

        offsetContainer.position.setZ(-gap);
        offsetContainer.rotation.x = rotation;

        if (easedT < 1) {
          requestAnimationFrame(animate);
        } else {
          offsetContainer.rotation.x = 0;
        }
      };

      requestAnimationFrame(animate);
    });
  };

  useEffect(() => {
    if (startFlare) {
      flare();
      setTimeout(() => setStartFlare(false), 500 + wedges.current.children.length * 100);
    }
  }, [startFlare]);

  return (
    <>
      <OrbitControls enableZoom={false} enablePan={false} />
      <PerspectiveCamera makeDefault position={[0, 2.5, 10]} fov={25} />

      <group ref={rotationGroup}>
        <mesh>
          <sphereGeometry args={[0.33]} />
          <meshStandardMaterial metalness={0.95} roughness={0.1} />
        </mesh>
        <group ref={flipGroup} />
        <group ref={wedges} />
      </group>

      <directionalLight
        position={[4, 4, 3]}
        intensity={5}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={0.01}
        shadow-normalBias={0.02}
      />

      <Environment preset="sunset" blur={0.05} intensity={2} environmentRotation={[0, 0, 0]} />

      <EffectComposer>
        <AlphaGlow />
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={1} />
      </EffectComposer>
    </>
  );
}

export default function Scene(props) {
  return (
    <div className="scene">
      <Canvas shadows>
        <PuzzleScene {...props} />
      </Canvas>
    </div>
  );
}
