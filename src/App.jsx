import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, DepthOfField, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import Scene from './components/Scene';
import { Environment } from '@react-three/drei';
import './index.scss';

function App() {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 1, 2],
        fov: 50,
      }}
    >
      <ambientLight intensity={5} />
      <directionalLight position={[0, 4, 2]} intensity={4} castShadow />
      <Environment preset="sunset" background blur={.1} />
      <Scene />

      <EffectComposer>
        <DepthOfField
          focusDistance={.1}
          focalLength={0.03}
          bokehScale={2}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0025, 0.0015]}
        />
        <Bloom
          intensity={4.75}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.1}
        />
      </EffectComposer>
    </Canvas>
  );
}

export default App;
