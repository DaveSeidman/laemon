import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Environment, ContactShadows, PerspectiveCamera, Float } from '@react-three/drei';
import Scene from './components/Scene';
import './index.scss';

function App() {
  return (
    <Canvas shadows>
      <PerspectiveCamera
        makeDefault
        position={[0, 1.5, 8]}
        rotation={[-0.2, 0, 0]}
        fov={25}
      />
      {/* <Float
        speed={2}
        rotationIntensity={0.01}
        floatIntensity={1}
        floatingRange={[-0.1, 0.1]}
      > */}
      <Scene />
      {/* </Float> */}
      <directionalLight
        position={[2, 4, -2]}
        intensity={6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight
        position={[-0.75, 1, -1.5]}
        intensity={6}
        castShadow
      />
      <Environment preset="sunset" blur={0.05} intensity={2} />
      <ContactShadows
        opacity={0.2}
        scale={20}
        blur={0.1}
        far={10}
        resolution={256}
        color="#000000"
        position={[0, -1.33, 0]}
      />
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
  );
}

export default App;
