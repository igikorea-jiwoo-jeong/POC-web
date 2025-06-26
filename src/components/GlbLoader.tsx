import { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

const GlbLoader = ({
  setAnimations,
  playAnimation,
}: {
  setAnimations: (names: string[]) => void;
  playAnimation: string | null;
}) => {
  const gltf = useGLTF('/barista.glb');
  const { actions, names } = useAnimations(gltf.animations, gltf.scene);

  // 애니메이션 이름 목록 상위로 전달
  useEffect(() => {
    setAnimations(names);
  }, [names, setAnimations]);

  // 애니메이션 실행
  useEffect(() => {
    Object.values(actions).forEach((a) => a?.stop());

    if (playAnimation && actions[playAnimation]) {
      actions[playAnimation]?.reset().play();
    } else if (actions['idle']) {
      actions['idle']?.reset().play();
    }
  }, [playAnimation, actions]);

  return <primitive object={gltf.scene} />;
};

export default GlbLoader;
