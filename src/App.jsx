import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, DepthOfField, ChromaticAberration, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Environment } from '@react-three/drei';
import Scene from './components/Scene';
import './index.scss';

function App() {
  return (
    <Canvas
      // shadows
      camera={{
        position: [0, 0.5, 3],
        fov: 50,
      }}
    >
      {/* <ambientLight intensity={5} /> */}
      <directionalLight position={[0, 4, 2]} intensity={20} castShadow />
      <Environment preset="sunset" background blur={0.1} intensity={2} />
      <Scene />

      <EffectComposer>
        {/* <DepthOfField
          focusDistance={1.5}
          focalLength={2.5}
          bokehScale={4}
        /> */}
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0015, 0.0015]}
        />
        {/* <Bloom
          intensity={1.75}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.1}
        /> */}
      </EffectComposer>
    </Canvas>
  );
}

export default App;
