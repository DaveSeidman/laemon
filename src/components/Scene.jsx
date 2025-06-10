import React, { useRef, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, MeshBasicMaterial, RepeatWrapping, DoubleSide, Vector3, Group, } from 'three';
import { useGLTF } from '@react-three/drei';
import wedgeModel from '../assets/models/wedge3.glb';
import texture1 from '../assets/images/1.png';
import texture2 from '../assets/images/2.png';
import texture3 from '../assets/images/3.png';
import texture4 from '../assets/images/4.png';
import texture5 from '../assets/images/5.png';
import texture6 from '../assets/images/6.png';
import texture7 from '../assets/images/7.png';
import texture8 from '../assets/images/8.png';
import { shuffle, cubicEase } from '../utils';

export default function Scene() {
  const rotationGroup = useRef();
  const flipGroup = useRef();
  const wedges = useRef();
  const meshRefs = useRef([]);

  const slices = 8;
  const step = (Math.PI * 2) / slices;
  const twistDuration = 1500;
  const basePhiLength = (Math.PI * 2) / slices;
  const gap = 0.01;

  const textures = useLoader(TextureLoader, [texture1, texture2, texture3, texture4, texture5, texture6, texture7, texture8]);
  const order = shuffle(textures.map((_, i) => i));

  const gltf = useGLTF(wedgeModel);
  const wedgeBase = gltf.scene?.children[0];

  const checkIfSolved = () => {
    const angles = meshRefs.current.map((mesh) => {
      const v = new Vector3();
      mesh.getWorldPosition(v);
      return Math.atan2(v.z, v.x);
    });

    const textureIndices = meshRefs.current.map((mesh) => {
      // console.log(mesh.children[0].material.map)
    });

    // Sort angles from smallest to largest to get angular order
    const sortedIndices = angles
      .map((angle, i) => ({ angle, index: i }))
      .sort((a, b) => a.angle - b.angle)
      .map(({ index }) => textureIndices[index]);

    const expected = [...Array(slices).keys()];
    const isSolved = expected.every((val, i) => sortedIndices[i] === val);

    if (isSolved) {
      console.log('🟢 Puzzle is solved!');
    }
  };

  useEffect(() => {
    textures.forEach((tex) => {
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.flipY = false;
    });
  }, [textures]);

  useEffect(() => {
    if (!wedgeBase) return;
    wedges.current.clear();

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
          child.material.roughness = 0.4;
          child.material.metalness = 0.9;
          child.material.side = DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      meshRefs.current[i] = wedgeClone;
      group.add(wedgeClone);
      wedges.current.add(group);
    }
  }, [wedgeBase, textures]);

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

    const rotDir = twistAnimation.current.direction === 'UP' ? -1 : 1;
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
    const redMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const originalMaterials = new Map(); // Store original materials

    // TODO #1: Visualize selected wedges with red temporarily
    for (let i = 0; i < slices; i += 1) {
      const worldPos = new Vector3();
      meshRefs.current[i]?.getWorldPosition(worldPos);
      const isLeft = worldPos.x < 0;
      if ((side === 'LEFT' && isLeft) || (side === 'RIGHT' && !isLeft)) {
        selected.push(i);

        meshRefs.current[i].traverse((child) => {
          if (child.isMesh) {
            originalMaterials.set(child.uuid, child.material);
            child.material = redMaterial;
          }
        });
      }
    }
    selected.forEach((i) => flipGroup.current.attach(meshRefs.current[i]));


    setTimeout(() => {
      selected.forEach((i) => {
        meshRefs.current[i].traverse((child) => {
          if (child.isMesh && originalMaterials.has(child.uuid)) {
            child.material = originalMaterials.get(child.uuid);
          }
        });
      });
    }, twistDuration);

    const distance = side === 'LEFT' ? -0.5 : 0.5;
    twistAnimation.current = {
      start: performance.now(),
      lastOffset: 0,
      distance,
      indices: selected,
      // worldDir,
      lastRot: 0,
      direction,
    };
    cancelAnimationFrame(animFrame.current);
    // setTimeout(() => {
    animateTwist();
    // }, 500);
  };

  const isDragging = useRef(false);
  const prevX = useRef(0);
  const velocity = useRef(0);
  const spinFrame = useRef();
  const dragStart = useRef({ x: 0, y: 0 });
  const directionLogged = useRef(false);


  useEffect(() => {
    const onDown = (e) => {
      if (twistAnimation.current) return;
      isDragging.current = true;
      prevX.current = e.clientX;
      velocity.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY };
      directionLogged.current = false;
      cancelAnimationFrame(spinFrame.current);
    };
    const onMove = (e) => {
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
        console.log('twist', side, dir)
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

    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointerleave', onUp);
    return () => {
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
      <group ref={flipGroup}>
        <mesh>
          <boxGeometry args={[1.5, 2, 1.5]} />
          <meshBasicMaterial wireframe></meshBasicMaterial>
        </mesh>
        <arrowHelper />
      </group>
      <group ref={wedges} />
    </group>
  );
}