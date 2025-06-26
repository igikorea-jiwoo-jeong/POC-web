import { Euler, Vector3 } from 'three';

export interface Model {
  name: string;
  path: string;
  position?: Vector3;
  rotation?: Euler;
  state?: string;
}
