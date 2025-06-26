import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import './App.css';
import React, { useState } from 'react';
import ChatBot from './components/ChatBot';
import GlbLoader from './components/GlbLoader';

const App = () => {
  const [animations, setAnimations] = useState<string[]>([]);
  const [playAnimation, setPlayAnimation] = useState<string | null>(null);

  return (
    <React.Fragment>
      <div className="chatbot-container">
        <ChatBot animations={animations} setPlayAnimation={setPlayAnimation} />
      </div>
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <GlbLoader
            setAnimations={setAnimations}
            playAnimation={playAnimation}
          />
          <OrbitControls />
        </Canvas>
      </div>
    </React.Fragment>
  );
};

export default App;
