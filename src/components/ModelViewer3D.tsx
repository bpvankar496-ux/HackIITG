import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RotateCw, Pause, Play, Move3d } from 'lucide-react';

interface ModelViewer3DProps {
  category: string;
  name: string;
  /** Optional real glTF/GLB model. When absent, a generated massing model is shown. */
  modelUrl?: string;
}

const STONE = 0xd9b98a;
const STONE_DARK = 0xb8956a;
const STONE_LIGHT = 0xe9d3ae;
const SHADOW = 0x3a2c20;

const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02, flatShading: true });

function box(w: number, h: number, d: number, x: number, y: number, z: number, color = STONE) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, color = STONE, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function dome(r: number, x: number, y: number, z: number, color = STONE_LIGHT) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function buildStepwell(): THREE.Group {
  const g = new THREE.Group();
  // Stepped terraces descending into the ground, shown as a cutaway of inverted tiers
  for (let i = 0; i < 7; i++) {
    const w = 4.2 - i * 0.5;
    g.add(box(w, 0.28, 2.6 - i * 0.18, 0, -i * 0.3 + 1.9, 0, i % 2 ? STONE_DARK : STONE));
  }
  // Retaining side walls
  g.add(box(0.3, 2.2, 2.8, -2.3, -0.3, 0, STONE_DARK));
  g.add(box(0.3, 2.2, 2.8, 2.3, -0.3, 0, STONE_DARK));
  // Pillared pavilion at the entrance
  for (const x of [-1.6, -0.55, 0.55, 1.6]) g.add(cyl(0.12, 0.14, 1.2, x, 1.9, -1.0));
  g.add(box(4.0, 0.2, 1.0, 0, 3.1, -1.0, STONE_LIGHT));
  // Well shaft
  g.add(cyl(0.55, 0.55, 0.5, 0, -0.35, 0, SHADOW, 20));
  g.position.y = -0.4;
  return g;
}

function buildTemple(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(box(5 - i * 0.5, 0.3, 3.2 - i * 0.4, 0, i * 0.3, 0, i % 2 ? STONE_DARK : STONE));
  // Mandapa (hall) with stacked pyramidal roof
  g.add(box(2.2, 1.4, 2.2, -1.3, 0.9, 0));
  for (let i = 0; i < 4; i++) g.add(box(2.4 - i * 0.55, 0.22, 2.4 - i * 0.55, -1.3, 2.3 + i * 0.22, 0, STONE_LIGHT));
  // Sanctum + curvilinear shikhara
  g.add(box(1.7, 1.6, 1.7, 1.3, 0.9, 0));
  for (let i = 0; i < 9; i++) {
    const s = 1.6 * Math.pow(1 - i / 10, 0.8);
    g.add(box(s, 0.34, s, 1.3, 2.5 + i * 0.34, 0, i % 2 ? STONE_LIGHT : STONE));
  }
  const kalasha = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(0xc79a3b));
  kalasha.position.set(1.3, 5.75, 0);
  g.add(kalasha);
  g.position.y = -1.8;
  return g;
}

function buildFort(): THREE.Group {
  const g = new THREE.Group();
  const W = 4.4, D = 3.4, H = 1.5;
  g.add(box(W, 0.2, D, 0, 0, 0, STONE_DARK));
  // Four curtain walls (merlons simplified as thin caps)
  g.add(box(W, H, 0.3, 0, 0.2, -D / 2)); g.add(box(W, H, 0.3, 0, 0.2, D / 2));
  g.add(box(0.3, H, D, -W / 2, 0.2, 0)); g.add(box(0.3, H, D, W / 2, 0.2, 0));
  for (let i = 0; i < 11; i++) {
    const x = -W / 2 + 0.2 + i * ((W - 0.4) / 10);
    g.add(box(0.2, 0.25, 0.3, x, 0.2 + H, -D / 2, STONE_LIGHT));
    g.add(box(0.2, 0.25, 0.3, x, 0.2 + H, D / 2, STONE_LIGHT));
  }
  for (let i = 0; i < 9; i++) {
    const z = -D / 2 + 0.2 + i * ((D - 0.4) / 8);
    g.add(box(0.3, 0.25, 0.2, -W / 2, 0.2 + H, z, STONE_LIGHT));
    g.add(box(0.3, 0.25, 0.2, W / 2, 0.2 + H, z, STONE_LIGHT));
  }
  // Corner bastions
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(cyl(0.45, 0.5, H + 0.5, x * W / 2, 0.2, z * D / 2, STONE_DARK));
    g.add(dome(0.38, x * W / 2, H + 0.7, z * D / 2));
  }
  // Gate + keep
  g.add(box(1.0, 1.9, 0.5, 0, 0.2, D / 2 + 0.1, STONE_DARK));
  g.add(box(0.5, 1.0, 0.55, 0, 0.2, D / 2 + 0.12, SHADOW));
  g.add(box(1.4, 1.8, 1.2, 0.4, 0.2, -0.3));
  g.add(box(1.0, 0.9, 0.8, 0.4, 2.0, -0.3, STONE_LIGHT));
  g.position.y = -1.0;
  return g;
}

function buildArchitecture(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(5, 0.3, 3.4, 0, 0, 0, STONE_DARK));
  g.add(box(3.6, 1.6, 2.4, 0, 0.3, 0));
  for (let i = 0; i < 7; i++) g.add(cyl(0.1, 0.12, 1.3, -1.6 + i * 0.53, 0.3, 1.35, STONE_LIGHT));
  g.add(box(3.8, 0.18, 0.5, 0, 1.6, 1.35, STONE_LIGHT));
  g.add(cyl(0.9, 0.95, 0.5, 0, 1.9, 0, STONE_LIGHT, 28));
  g.add(dome(0.95, 0, 2.4, 0));
  g.add(cyl(0.03, 0.03, 0.6, 0, 3.3, 0, 0xc79a3b, 8));
  for (const x of [-2.3, 2.3]) {
    g.add(cyl(0.22, 0.26, 2.6, x, 0.3, -1.2, STONE_LIGHT));
    g.add(dome(0.26, x, 2.9, -1.2));
  }
  for (const x of [-1.4, 1.4]) { g.add(cyl(0.3, 0.32, 0.7, x, 1.9, 0, STONE, 20)); g.add(dome(0.32, x, 2.6, 0)); }
  g.position.y = -1.5;
  return g;
}

function buildCave(): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(2.4, 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + 0.12 * Math.sin(x * 2.1) * Math.cos(z * 1.7) + 0.06 * Math.sin(y * 3.3);
    p.setXYZ(i, x * n * 1.35, Math.max(y, -0.2) * n * 0.85, z * n);
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, mat(0x9b8468));
  rock.castShadow = rock.receiveShadow = true;
  g.add(rock);
  // Rock-cut facade: arched openings with pillars
  g.add(box(3.2, 1.4, 0.3, 0, 0.1, 2.0, STONE_DARK));
  for (const x of [-1, 0, 1]) {
    g.add(box(0.5, 0.8, 0.35, x, 0.15, 2.05, SHADOW));
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.35, 16, 1, false, 0, Math.PI), mat(SHADOW));
    arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    arch.position.set(x, 0.95, 2.05);
    g.add(arch);
  }
  for (const x of [-1.5, -0.5, 0.5, 1.5]) g.add(cyl(0.09, 0.11, 1.1, x, 0.1, 2.25, STONE_LIGHT));
  g.position.y = -0.8;
  return g;
}

function buildStupa(): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(2.6, 2.7, 0.35, 0, 0, 0, STONE_DARK, 32));
  g.add(cyl(2.2, 2.3, 0.35, 0, 0.35, 0, STONE, 32));
  g.add(dome(1.9, 0, 0.7, 0, STONE_LIGHT));
  g.add(box(0.9, 0.35, 0.9, 0, 2.55, 0, STONE));
  for (let i = 0; i < 3; i++) g.add(cyl(0.7 - i * 0.18, 0.7 - i * 0.18, 0.06, 0, 3.05 + i * 0.22, 0, 0xc79a3b, 24));
  g.add(cyl(0.03, 0.03, 0.5, 0, 3.65, 0, 0xc79a3b, 8));
  // Railing posts
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.add(cyl(0.05, 0.05, 0.5, Math.cos(a) * 2.45, 0.7, Math.sin(a) * 2.45, STONE_LIGHT, 6));
  }
  g.position.y = -1.7;
  return g;
}

function buildRuins(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(5, 0.15, 5, 0, 0, 0, STONE_DARK));
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let ix = -2; ix <= 2; ix++) {
    for (let iz = -2; iz <= 2; iz++) {
      if ((ix + iz) % 2 === 0 && rnd() > 0.2) g.add(cyl(0.16, 0.2, 0.5 + rnd() * 1.4, ix * 0.95, 0.15, iz * 0.95));
    }
  }
  for (let i = 0; i < 6; i++) g.add(box(1.4 + rnd(), 0.4 + rnd() * 0.5, 0.2, -1.5 + rnd() * 3, 0.15, -2.3 + rnd() * 4.6, STONE_DARK).rotateY(rnd() * 1.5));
  g.position.y = -1.0;
  return g;
}

function buildCraft(): THREE.Group {
  const g = new THREE.Group();
  const pts = [
    [0.01, 0], [0.9, 0.05], [1.35, 0.7], [1.45, 1.3], [1.05, 1.9], [0.7, 2.2], [0.75, 2.5], [0.95, 2.62],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color: 0xb4572f, roughness: 0.7, side: THREE.DoubleSide }));
  m.castShadow = true;
  g.add(m);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4 - i * 0.18, 0.025, 8, 48), new THREE.MeshStandardMaterial({ color: 0xf1e2c1 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.85 + i * 0.28;
    g.add(ring);
  }
  g.position.y = -1.3;
  return g;
}

export function buildModelForCategory(category: string): THREE.Group {
  switch (category) {
    case 'Stepwells': return buildStepwell();
    case 'Temples': return buildTemple();
    case 'Forts': return buildFort();
    case 'Caves': return buildCave();
    case 'Monasteries': return buildStupa();
    case 'Archaeological Sites': return buildRuins();
    case 'Handicrafts': return buildCraft();
    default: return buildArchitecture();
  }
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({ category, name, modelUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const resetRef = useRef<() => void>(() => {});
  const [autoRotate, setAutoRotate] = useState(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isRealModel, setIsRealModel] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let frame = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const home = new THREE.Vector3(6.2, 3.6, 7.2);
    camera.position.copy(home);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setStatus('error');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'pan-y';

    scene.add(new THREE.HemisphereLight(0xfff3dc, 0x8a6f4c, 1.05));
    const sun = new THREE.DirectionalLight(0xffe7c2, 2.2);
    sun.position.set(5, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(6.5, 64), new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.85;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.autoRotateSpeed = 1.1;
    controls.target.set(0, 0.6, 0);
    controlsRef.current = controls;
    resetRef.current = () => {
      camera.position.copy(home);
      controls.target.set(0, 0.6, 0);
      controls.update();
    };

    const resize = () => {
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 380;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let model: THREE.Object3D | null = null;
    const useGenerated = () => {
      model = buildModelForCategory(category);
      scene.add(model);
      setIsRealModel(false);
      setStatus('ready');
    };

    if (modelUrl) {
      new GLTFLoader().load(
        modelUrl,
        gltf => {
          if (disposed) return;
          const obj = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(obj);
          const size = bounds.getSize(new THREE.Vector3());
          const scale = 4 / Math.max(size.x, size.y, size.z || 1);
          obj.scale.setScalar(scale);
          const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
          obj.position.sub(c);
          obj.position.y += (size.y * scale) / 2 - 1.8;
          obj.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
          model = obj;
          scene.add(obj);
          setIsRealModel(true);
          setStatus('ready');
        },
        undefined,
        () => { if (!disposed) useGenerated(); }
      );
    } else {
      useGenerated();
    }

    const tick = () => {
      frame = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mt = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mt)) mt.forEach(x => x.dispose());
        else mt?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      void model;
    };
  }, [category, modelUrl]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate, status]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#DCC9AD] bg-gradient-to-b from-[#FBF3E2] to-[#EBDDBF]">
      <div
        ref={mountRef}
        className="h-[340px] w-full sm:h-[420px] cursor-grab active:cursor-grabbing"
        role="img"
        aria-label={`Interactive 3D model of ${name}. Drag to rotate, scroll to zoom.`}
      />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[#777267]">Loading model…</div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-[#777267]">
          3D view needs WebGL, which this browser has turned off.
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#16192E]/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Move3d className="h-3.5 w-3.5" />
            <span>Drag to rotate · Scroll to zoom</span>
          </div>
          <div className="absolute right-3 top-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setAutoRotate(v => !v)}
              aria-pressed={autoRotate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCC9AD] bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#292821] hover:bg-white"
            >
              {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{autoRotate ? 'Pause spin' : 'Spin'}</span>
            </button>
            <button
              type="button"
              onClick={() => resetRef.current()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCC9AD] bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#292821] hover:bg-white"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Reset view</span>
            </button>
          </div>
          <p className="absolute bottom-2.5 left-3 right-3 text-[10.5px] text-[#777267]">
            {isRealModel
              ? 'Survey model supplied with this record.'
              : 'Simplified massing model by monument type. It shows typical form, not a survey scan.'}
          </p>
        </>
      )}
    </div>
  );
};

export default ModelViewer3D;
