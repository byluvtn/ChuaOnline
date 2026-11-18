import * as THREE from 'three';
import { fitModel, loadModel } from './models';

export const CORRIDOR_STATUE_NAMES = ['chibi-quan-am', 'chibi-van-thu', 'chibi-pho-hien', 'chibi-dia-tang'] as const;

export const TARGET_HEIGHT = 1.6;

const FACE_OFFSET: Record<(typeof CORRIDOR_STATUE_NAMES)[number], number> = {
  'chibi-quan-am': 0,
  'chibi-van-thu': 0,
  'chibi-pho-hien': 0,
  'chibi-dia-tang': 0,
};

function prepare(model: THREE.Group, offset: number): THREE.Group {
  const turn = fitModel(model.clone(true), TARGET_HEIGHT, 'base');
  turn.rotation.y = offset;
  const wrap = new THREE.Group();
  wrap.add(turn);
  return wrap;
}

/**
 * Tải 4 tượng chibi đứng với màu gốc. Trả về 4 mẫu (null nếu thiếu) để temple.ts clone;
 * mẫu null → temple.ts dùng tượng chibi buildArhat làm fallback.
 */
export function buildCorridorStatues(
  onLate?: (models: (THREE.Group | null)[]) => void,
): Promise<(THREE.Group | null)[]> {
  return Promise.all(CORRIDOR_STATUE_NAMES.map(buildOne)).then((models) => {
    // Mạng yếu: tượng nào còn null thì thử tải lại đúng 1 lần sau 20 s rồi báo qua onLate.
    if (onLate && models.some((m) => !m)) {
      setTimeout(() => {
        Promise.all(CORRIDOR_STATUE_NAMES.map((name, i) => models[i] ?? buildOne(name))).then(onLate);
      }, RETRY_AFTER_MS);
    }
    return models;
  });
}

const RETRY_AFTER_MS = 20000;

async function buildOne(name: (typeof CORRIDOR_STATUE_NAMES)[number]): Promise<THREE.Group | null> {
  try {
    const model = await loadModel(name);
    return model ? prepare(model, FACE_OFFSET[name]) : null;
  } catch (e) {
    console.warn(`${name}: lỗi dựng tượng`, e);
    return null;
  }
}
