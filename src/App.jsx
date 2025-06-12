import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
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
      <Scene />
      <directionalLight
        position={[2, 4, -2]}
        intensity={6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset="sunset" background blur={0.05} intensity={2} />
      <ContactShadows
        opacity={1}
        scale={10}
        blur={1}
        far={3}
        resolution={256}
        color="#000000"
        position={[0, -1.33, 0]}
      />
      <EffectComposer>
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0015, 0.0015]}
        />
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
