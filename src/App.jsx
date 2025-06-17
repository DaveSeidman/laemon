// src/App.jsx
import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import {
  Environment,
  MeshReflectorMaterial,
  PerspectiveCamera,
  Float,
} from '@react-three/drei';
import Scene from './components/Scene';
import Camera from './components/Camera';
import './index.scss';

export default function App() {
  const slices = 8;
  const [twistIndex, setTwistIndex] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const videoElementRef = useRef();
  const finishTwist = useRef(() => { });

  const handlePlay = async () => {
    // perform 5 random 4-slice flips in sequence
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * slices);
      setTwistIndex(idx);
      // wait until Scene signals this twist is finished
      await new Promise((resolve) => {
        finishTwist.current = resolve;
      });
    }
  };

  return (
    <>
      <Camera
        webcamRunning={webcamRunning}
        setWebcamRunning={setWebcamRunning}
        videoElementRef={videoElementRef}
      />
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
          <Scene
            slices={slices}
            twistIndex={twistIndex}
            onTwistComplete={() => finishTwist.current()}
          />
        </Float>

        <directionalLight
          position={[2, 4, -2]}
          intensity={5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-0.75, 1, -1.5]} intensity={6} castShadow />

        <Environment
          preset="city"
          blur={0.05}
          intensity={2}
          environmentRotation={[0, 0, 0]}
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

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={1}
          />
        </EffectComposer>
      </Canvas>

      <div className="ui">
        <button type="button" onClick={handlePlay}>
          Let's Play
        </button>
      </div>
    </>
  );
}
