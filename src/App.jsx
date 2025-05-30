import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import Scene from './components/Scene';
import './index.scss';

function App() {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 0.5, 2],
        fov: 50,
      }}
    >
      <ambientLight intensity={3} />
      <directionalLight position={[0, 4, 2]} intensity={3} castShadow />

      <Scene />

      <EffectComposer>
        <DepthOfField
          focusDistance={1.5} // smaller = closer focus
          focalLength={0.001} // smaller = shallower depth
          bokehScale={4} // larger = stronger blur
        />
      </EffectComposer>
    </Canvas>
  );
}

export default App;
