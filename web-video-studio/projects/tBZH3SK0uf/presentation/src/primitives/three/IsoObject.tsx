// @ts-nocheck
"use client";
import { useEffect, useRef, type CSSProperties } from "react";

interface IsoObjectProps {
  /** Path or URL to a GLTF/GLB model file */
  src: string;
  /** Camera angle preset. Default: "iso" */
  cameraPreset?: "iso" | "front" | "top" | "side";
  /** Auto-rotate. Default: true */
  rotate?: boolean;
  /** Rotation speed (radians/sec). Default: 0.4 */
  rotateSpeed?: number;
  /** Background color. Default: "transparent" */
  background?: string;
  /** Whether to apply exploded view (separates parts). Default: false */
  exploded?: boolean;
  /** Explode distance multiplier (0–1, driven by stepTime). Default: 0 */
  explodeProgress?: number;
  stepTime?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Three.js GLTF model viewer with isometric camera and optional exploded view.
 *
 * Usage:
 *   <IsoObject src="/models/chip.glb" rotate stepTime={stepTime} />
 *   <IsoObject src="/models/pcb.glb" exploded explodeProgress={0.8} cameraPreset="iso" />
 */
export function IsoObject({
  src,
  cameraPreset = "iso",
  rotate = true,
  rotateSpeed = 0.4,
  background = "transparent",
  exploded = false,
  explodeProgress = 0,
  stepTime,
  style,
  className,
}: IsoObjectProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateRef = useRef<any>({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let rafId: number;
    let renderer: { dispose(): void; render(s: unknown, c: unknown): void; domElement: HTMLCanvasElement; setSize(w: number, h: number): void };
    let mixer: { update(dt: number): void } | null = null;
    let startTime = performance.now();

    import("three").then(async (THREE) => {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const w = mount.clientWidth || 400, h = mount.clientHeight || 300;

      // Scene
      const scene = new THREE.Scene();
      if (background !== "transparent") {
        scene.background = new THREE.Color(background);
      }

      // Camera
      const aspect = w / h;
      let camera: THREE.Camera;
      if (cameraPreset === "iso") {
        const frustum = 2.5;
        const ortho = new THREE.OrthographicCamera(
          -frustum * aspect, frustum * aspect,
          frustum, -frustum, 0.1, 100,
        );
        ortho.position.set(4, 4, 4);
        ortho.lookAt(0, 0, 0);
        camera = ortho;
      } else {
        const persp = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        if (cameraPreset === "front") persp.position.set(0, 0, 5);
        else if (cameraPreset === "top") persp.position.set(0, 5, 0);
        else persp.position.set(5, 0, 0);
        persp.lookAt(0, 0, 0);
        camera = persp;
      }

      // Renderer
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: background === "transparent" });
      r.setSize(w, h);
      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      r.shadowMap.enabled = true;
      mount.appendChild(r.domElement);
      renderer = r;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 8, 5);
      dirLight.castShadow = true;
      const pointLight = new THREE.PointLight(0x4080ff, 0.8, 20);
      pointLight.position.set(-4, 4, -4);
      scene.add(ambient, dirLight, pointLight);

      // Load model
      const loader = new GLTFLoader();
      let model: THREE.Group;
      let originalPositions: THREE.Vector3[] = [];

      loader.load(src, (gltf) => {
        model = gltf.scene;

        // Center and scale
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);
        const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
        model.position.sub(center);

        scene.add(model);

        // Store original child positions for exploded view
        if (exploded) {
          originalPositions = model.children.map((c) => c.position.clone());
        }

        // Animations
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer!.clipAction(clip).play());
        }

        stateRef.current = { model, originalPositions };
      });

      // Render loop
      let lastTime = performance.now();
      const loop = () => {
        rafId = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        if (model) {
          if (rotate && stepTime === undefined) {
            const elapsed = (now - startTime) / 1000;
            model.rotation.y = elapsed * rotateSpeed;
          } else if (stepTime !== undefined) {
            model.rotation.y = stepTime * rotateSpeed;
          }

          // Exploded view
          if (exploded && originalPositions.length) {
            const ep = explodeProgress ?? 0;
            model.children.forEach((child, i) => {
              const orig = originalPositions[i];
              if (orig) {
                const dir = orig.clone().normalize();
                child.position.copy(orig.clone().add(dir.multiplyScalar(ep * 0.8)));
              }
            });
          }
        }

        mixer?.update(dt);
        r.render(scene, camera);
      };
      loop();
    });

    return () => {
      cancelAnimationFrame(rafId);
      renderer?.dispose();
      const canvas = mount.querySelector("canvas");
      if (canvas) mount.removeChild(canvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, cameraPreset]);

  // Update explode progress reactively
  useEffect(() => {
    const { model, originalPositions } = stateRef.current;
    if (!model || !originalPositions?.length) return;
    const ep = explodeProgress ?? 0;
    model.children.forEach((child: { position: { copy(v: unknown): void } }, i: number) => {
      const orig = originalPositions[i];
      if (orig) {
        import("three").then(({ Vector3 }) => {
          const dir = new Vector3(orig.x, orig.y, orig.z).normalize();
          child.position.copy(new Vector3(orig.x + dir.x * ep * 0.8, orig.y + dir.y * ep * 0.8, orig.z + dir.z * ep * 0.8));
        });
      }
    });
  }, [explodeProgress]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
