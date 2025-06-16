import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Leva, useControls } from 'leva';
import { Environment, ContactShadows, MeshReflectorMaterial, PerspectiveCamera, Float } from '@react-three/drei';
import Scene from './components/Scene';
import './index.scss';

function App() {
  const { envPreset, envIntensity, envRotation } = useControls({
    envPreset: {
      options: [
        'apartment',
        'city',
        'dawn',
        'forest',
        'lobby',
        'night',
        'park',
        'studio',
        'sunset',
        'warehouse',
      ],
      value: 'city',
    },
    envIntensity: {
      min: 0,
      max: 100,
      value: 2,
    },
    envRotation: {
      min: 0,
      max: Math.PI * 2,
      value: Math.PI,
    },
  });

  return (
    <>
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[0, 1.5, 8]}
          rotation={[-0.2, 0, 0]}
          fov={25}
        />
        <Float
          speed={2}
          rotationIntensity={1}
          floatIntensity={1}
          floatingRange={[-0.1, 0.1]}
        >
          <Scene />
        </Float>
        <directionalLight
          position={[2, 4, -2]}
          intensity={5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight
          position={[-0.75, 1, -1.5]}
          intensity={6}
          castShadow
        />
        <Environment
          preset={envPreset}
          blur={0.05}
          intensity={envIntensity}
          environmentRotation={[0, envRotation, 0]}
        />
        <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <MeshReflectorMaterial
            blur={[400, 400]}
            resolution={512}
            mixBlur={1}
            mixStrength={20}
            depthScale={0.5}
            minDepthThreshold={0.1}
            color="#555555"
            metalness={0.5}
            roughness={0.9}
          />
        </mesh>
        {/* <ContactShadows
          opacity={0.2}
          scale={20}
          blur={0.1}
          far={10}
          resolution={256}
          color="#000000"
          position={[0, -1.33, 0]}
        /> */}
        <EffectComposer>
          {/* <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0015, 0.0015]}
          /> */}
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={1}
          />
        </EffectComposer>
      </Canvas>
      <Leva />
    </>
  );
}

export default App;
