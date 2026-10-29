import {
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PanelContext, PanelHandle } from '../panels/catalog';
import { loadBoard } from './board';
import { onThemeChange, readSceneTokens, type SceneTokens } from './tokens';

/**
 * Cena do spike (E0-06): carrega o board glTF e muda o LED quando o estado
 * publicado pelo core muda. Nenhum timing ou estado de pino é calculado aqui.
 */
export function createScene(host: HTMLElement, ctx: PanelContext): PanelHandle {
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let tokens: SceneTokens = readSceneTokens();

  const scene = new Scene();
  scene.background = new Color(tokens.background);

  const camera = new PerspectiveCamera(45, 1, 0.1, 2000);
  camera.position.set(55, 85, 105);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
  host.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reducedMotion;
  controls.minDistance = 35;
  controls.maxDistance = 320;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.target.set(12.7, 2, 27.2);
  controls.listenToKeyEvents(host);
  controls.update();

  const hemisphere = new HemisphereLight(
    new Color(tokens.lightSky),
    new Color(tokens.lightGround),
    2.4,
  );
  const key = new DirectionalLight(new Color(tokens.lightSky), 2.2);
  key.position.set(40, 90, 30);
  scene.add(hemisphere, key);

  let ledMaterial: MeshStandardMaterial | undefined;
  let lastOn: boolean | undefined;
  let disposed = false;
  let frame = 0;

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const applyLed = () => {
    if (!ledMaterial || lastOn === ctx.state.on) return;
    lastOn = ctx.state.on;
    ledMaterial.emissive.set(lastOn ? tokens.ledOn : tokens.ledOff);
    ledMaterial.emissiveIntensity = lastOn ? 1.4 : 0.25;
    // Diagnóstico e teste de fumaça; a UI não reage a evento de pino (AP-02).
    host.dataset.led = lastOn ? 'on' : 'off';
  };

  const applyTokens = () => {
    tokens = readSceneTokens();
    scene.background = new Color(tokens.background);
    hemisphere.color.set(tokens.lightSky);
    hemisphere.groundColor.set(tokens.lightGround);
    key.color.set(tokens.lightSky);
    lastOn = undefined;
  };
  const stopTheme = onThemeChange(applyTokens);

  const render = () => {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    try {
      ctx.pump();
      applyLed();
      controls.update();
      renderer.render(scene, camera);
    } catch (error) {
      disposed = true;
      cancelAnimationFrame(frame);
      ctx.onError(error);
    }
  };

  loadBoard(ctx.boardUrl)
    .then((board) => {
      if (disposed) return;
      const material = board.led.mesh.material;
      if (!(material instanceof MeshStandardMaterial)) {
        throw new Error('material do LED_USER não é MeshStandardMaterial');
      }
      ledMaterial = material;
      scene.add(board.root);
      controls.target.copy(new Box3().setFromObject(board.root).getCenter(new Vector3()));
      controls.update();
    })
    .catch((error) => ctx.onError(error));

  render();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      stopTheme();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      });
      scene.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
