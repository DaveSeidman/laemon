// src/App.jsx
import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment, MeshReflectorMaterial, PerspectiveCamera, Float, OrbitControls } from '@react-three/drei';
import { Color } from 'three';
import Scene from './components/Scene';
import Camera from './components/Camera';
import './index.scss';

export default function App() {
  const slices = 8;
  const [twistIndex, setTwistIndex] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const videoElementRef = useRef();
  const finishTwist = useRef(() => { });

  const handlePlay = async (i) => {
    // perform 5 random 4-slice flips in sequence
    // for (let i = 0; i < 5; i++) {
    //   const idx = Math.floor(Math.random() * slices);
    //   setTwistIndex(idx);
    //   // wait until Scene signals this twist is finished
    //   await new Promise((resolve) => {
    //     finishTwist.current = resolve;
    //   });
    // }
    setTwistIndex(i);
    // setTwistIndex(Math.floor(Math.random() * slices));
  };

  return (
    <div className="app">
      <Camera
        webcamRunning={webcamRunning}
        setWebcamRunning={setWebcamRunning}
        videoElementRef={videoElementRef}
      />
      <Canvas
        shadows
      >
        <OrbitControls
          enableZoom={false}
        // minZoom={0.1}
        // maxZoom={2}
        />
        <PerspectiveCamera
          makeDefault
          position={[0, 1.5, 12]}
          rotation={[-0.1, 0, 0]}
          fov={25}
        // near={3}
        // far={10}
        />
        {/* <Float
          speed={2}
          rotationIntensity={1}
          floatIntensity={1}
          floatingRange={[-0.1, 0.1]}
        > */}
        <Scene
          slices={slices}
          twistIndex={twistIndex}
          setTwistIndex={setTwistIndex}
          onTwistComplete={() => finishTwist.current()}
          highlight={highlight}
        />
        {/* </Float> */}

        <directionalLight
          position={[2, 4, -2]}
          intensity={5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        // shadow-bias={0.000001}

        />
        <pointLight position={[-0.75, 1, -1.5]} intensity={6} castShadow />

        <Environment
          preset="sunset"
          blur={0.05}
          intensity={2}
          environmentRotation={[0, 0, 0]}
        />

        <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 3]} />
          <MeshReflectorMaterial
            blur={[1000, 1000]}
            resolution={1024}
            mixBlur={1}
            mixStrength={100}
            depthScale={0.5}
            minDepthThreshold={0.5}
            color={new Color('rgb(27,40,20)')}
            metalness={0.99}
            roughness={0.99}
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
        <button
          type="button"
          onClick={() => handlePlay(i)}
        >
          Let's Go!
        </button>

      </div>
    </div>
  );
}
