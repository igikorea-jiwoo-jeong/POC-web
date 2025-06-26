import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import './App.css';
import React, { useState } from 'react';
import ChatBot from './components/ChatBot';
import GlbLoader from './components/GlbLoader';
import type { Model } from './components/type';
import { Euler, Vector3 } from 'three';

const modelList: Model[] = [
  {
    name: 'barista',
    path: '/glbs/barista.glb',
    position: new Vector3(2.2, 0, 4),
    rotation: new Euler(0, 0.5, 0),
    state: 'idle',
  },
  {
    name: 'player',
    path: '/glbs/player.glb',
    position: new Vector3(3, 0, 5.5),
    rotation: new Euler(0, 3.6, 0),
    state: 'idle',
  },
  {
    name: 'landscape',
    path: '/glbs/odu_cafe.glb',
    position: new Vector3(-1.5, 0, 4),
    rotation: new Euler(0, Math.PI / 3, 0),
  },
];

const App = () => {
  const [animations, setAnimations] = useState<string[]>([]);
  const [playAnimation, setPlayAnimation] = useState<string | null>(null);

  return (
    <React.Fragment>
      <div className="chatbot-container">
        <ChatBot animations={animations} setPlayAnimation={setPlayAnimation} />
      </div>
      <div className="canvas-container">
        <Canvas
          camera={{
            position: new Vector3(3, 1.8, 5.5),
            fov: 75,
            near: 0.1,
            far: 100,
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          {modelList.map((model) => (
            <GlbLoader
              key={model.name}
              model={model}
              isAnimatedTarget={model.name === 'barista'}
              setAnimations={
                model.name === 'barista' ? setAnimations : undefined
              }
              playAnimation={
                model.name === 'barista' ? playAnimation : undefined
              }
            />
          ))}
          <OrbitControls />
        </Canvas>
      </div>
    </React.Fragment>
  );
};

export default App;
