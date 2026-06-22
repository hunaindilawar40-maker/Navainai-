import * as THREE from 'three';

function initNavain3DHero(canvasId) {
  const canvas = document.getElementById(canvasId || 'navain-3d-hero');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();

  let width = canvas.clientWidth || canvas.parentElement.clientWidth;
  let height = canvas.clientHeight || canvas.parentElement.clientHeight;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  // ---------- Lighting (brass / navy brand palette) ----------
  scene.add(new THREE.AmbientLight(0x10202a, 1.6));

  const keyLight = new THREE.PointLight(0xe0a654, 28, 30, 2); // brass-bright
  keyLight.position.set(4, 4, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x4fd6ff, 10, 30, 2); // cool rim for contrast
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  // ---------- Core crystal ----------
  const group = new THREE.Group();
  scene.add(group);

  const coreGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xc98b3c,
    emissive: 0x6b3e10,
    emissiveIntensity: 0.55,
    metalness: 0.35,
    roughness: 0.18,
    transmission: 0.35,
    thickness: 1.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    transparent: true,
    opacity: 0.92,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // glowing edge lines over the facets
  const edges = new THREE.EdgesGeometry(coreGeo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.55 });
  const edgeLines = new THREE.LineSegments(edges, edgeMat);
  edgeLines.scale.setScalar(1.002);
  group.add(edgeLines);

  // inner glow sprite
  const glowTexture = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(224,166,84,0.9)');
    grad.addColorStop(1, 'rgba(224,166,84,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false }));
  glowSprite.scale.set(7, 7, 1);
  group.add(glowSprite);

  // ---------- Orbiting particle ring ----------
  const particleCount = 90;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3.3 + Math.random() * 0.9;
    const tilt = (Math.random() - 0.5) * 1.1;
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = tilt;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffe2ad,
    size: 0.05,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const particleRing = new THREE.Points(particleGeo, particleMat);
  scene.add(particleRing);

  // ---------- interaction: mouse parallax ----------
  let targetX = 0, targetY = 0;
  let pointerActive = !reducedMotion;
  if (pointerActive) {
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = nx * 0.45;
      targetY = ny * 0.3;
    });
  }

  // ---------- resize ----------
  function handleResize() {
    width = canvas.clientWidth || canvas.parentElement.clientWidth;
    height = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // ---------- render loop ----------
  const clock = new THREE.Clock();

  function renderFrame() {
    const dt = clock.getDelta();

    if (!reducedMotion) {
      group.rotation.y += dt * 0.28;
      group.rotation.x += dt * 0.07;
      particleRing.rotation.y -= dt * 0.12;

      camera.position.x += (targetX * 2 - camera.position.x) * 0.04;
      camera.position.y += (-targetY * 1.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  // If reduced motion, render a handful of static frames then stop.
  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    renderFrame();
  }
}

// Auto-init on DOM ready, looking for the default canvas id.
if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => initNavain3DHero('navain-3d-hero'), 0);
  } else {
    document.addEventListener('DOMContentLoaded', () => initNavain3DHero('navain-3d-hero'));
  }
}

window.initNavain3DHero = initNavain3DHero;
