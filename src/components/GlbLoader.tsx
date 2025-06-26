import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Model } from './type';
import { Euler, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';

const GlbLoader = ({
  model,
  isAnimatedTarget,
  setAnimations,
  playAnimation,
}: {
  model: Model;
  isAnimatedTarget: boolean;
  setAnimations?: (names: string[]) => void;
  playAnimation?: string | null;
}) => {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(model.path ?? '');
  const { actions, names } = useAnimations(gltf?.animations, group);

  const { camera } = useThree();

  // 애니메이션 이름 목록 전달
  useEffect(() => {
    if (setAnimations) {
      setAnimations(names);
    }
  }, [names, setAnimations]);

  // 기본 애니메이션 실행 (무조건 실행)
  useEffect(() => {
    if (!model.state || !actions[model.state]) return;
    actions[model.state]?.reset().play();
  }, [actions, model.state]);

  // 특정 애니메이션 실행 (선택 대상일 때만)
  useEffect(() => {
    if (!isAnimatedTarget || !playAnimation) return;

    Object.values(actions).forEach((a) => a?.stop());

    if (actions[playAnimation]) {
      actions[playAnimation]?.reset().play();
    }
  }, [playAnimation, actions, isAnimatedTarget, camera]);

  if (!gltf) return null;

  return (
    <group
      ref={group}
      position={model.position ?? new Vector3(0, 0, 0)}
      rotation={model.rotation ?? new Euler(0, 0, 0)}
    >
      <primitive object={gltf.scene} name={model.name} />
    </group>
  );
};

export default GlbLoader;
