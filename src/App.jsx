// src/App.jsx
import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment, MeshReflectorMaterial, PerspectiveCamera, Float, OrbitControls } from '@react-three/drei';
import Scene from './components/Scene';
import AlphaGlow from './components/AlphaGlow';
import Camera from './components/Camera';
import UI from './components/UI';
import './index.scss';

export default function App() {
  const slices = 8;
  const [shuffling, setShuffling] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [twistIndex, setTwistIndex] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [reset, setReset] = useState(false);
  const [completed, setCompleted] = useState(false);
  const videoElementRef = useRef();
  const finishTwist = useRef(() => { });
  const [startFlare, setStartFlare] = useState(false);

  const startTwists = 3;

  const startGame = async () => {
    setShuffling(true);
    const twist = (index) => new Promise((resolve) => {
      finishTwist.current = resolve;
      setTwistIndex(index);
    });

    let last = twistIndex;
    for (let i = 0; i < startTwists; i += 1) {
      let next = Math.floor(Math.random() * slices);
      while (next === last) {
        next = Math.floor(Math.random() * slices);
      }
      console.log('twisting to', next);
      await twist(next);
      last = next;
    }

    setShuffled(true);
    setShuffling(false);
    setPlaying(true);
  };

  const startGame2 = () => {
    setStartFlare(true);
  };

  const restartGame = () => {
    console.log('restart');
    setReset(true);
    setShuffled(false);
    setCompleted(false);
  };

  return (
    <div className="app">
      <div className="app-background" />
      {/* <Camera
        webcamRunning={webcamRunning}
        setWebcamRunning={setWebcamRunning}
        videoElementRef={videoElementRef}
      /> */}
      <Canvas
        shadows
      >
        <OrbitControls
          enableZoom={false}
          enablePan={false}
        />
        <PerspectiveCamera
          makeDefault
          position={[0, 2.5, 10]}
          fov={25}
        />
        {/* <Float
          speed={3}
          rotationIntensity={1}
          floatIntensity={1}
          floatingRange={[-0.1, 0.1]}
        > */}
        <Scene
          slices={slices}
          twistIndex={twistIndex}
          onTwistComplete={() => finishTwist.current()}
          reset={reset}
          setReset={setReset}
          setCompleted={setCompleted}
          shuffling={shuffling}
          startFlare={startFlare}
          setStartFlare={setStartFlare}
        />
        {/* </Float> */}

        <directionalLight
          position={[4, 4, 3]}
          intensity={5}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={0.01}
          shadow-normalBias={0.02}
        />

        <Environment
          preset="sunset"
          blur={0.05}
          intensity={2}
          environmentRotation={[0, 0, 0]}
        />

        <EffectComposer>
          <AlphaGlow />
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={1}
          />
        </EffectComposer>
      </Canvas>

      <UI
        completed={completed}
        shuffling={shuffling}
        shuffled={shuffled}
        startGame={startGame}
        restartGame={restartGame}
        playing={playing}
      />

      <button style={{ position: 'absolute', bottom: 0, left: 0, padding: '.5rem' }} type="button" onClick={() => setStartFlare(true)}>Flare Animation</button>
    </div>
  );
}
