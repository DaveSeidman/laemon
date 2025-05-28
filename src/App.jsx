import React from 'react';
import { Canvas } from '@react-three/fiber';
import OrangePuzzle from './components/OrangePuzzle';
import './index.scss';

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 2] }}>
      <ambientLight intensity={6} />
      <directionalLight position={[5, 5, 5]} intensity={6} />
      <OrangePuzzle />
    </Canvas>
  );
}

export default App;
