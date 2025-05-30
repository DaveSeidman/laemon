import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import './index.scss';

function App() {
  return (
    <Canvas shadows dpr={1} camera={{ position: [0, 0.5, 2], fov: 50 }}>
      <ambientLight intensity={3} />
      <directionalLight position={[0, 4, 2]} intensity={4} castShadow />
      <Scene />
    </Canvas>
  );
}

export default App;
