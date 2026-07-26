import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { regionLabels, normalizePart } from "./symptom-data.js";

let renderer, scene, camera, controls, clock;
let raycaster, pointer;
let interactiveParts = [];
let hoveredMesh = null;
let scanGroup;
let userWantsAutoRotate = true;
let idleTimer = null;

let hoverCallback = () => {};
let selectCallback = () => {};

const COLOR_BASE = 0x1a2530;
const COLOR_HOVER = 0x2dd4bf;
const COLOR_REPORTED = 0xf5a623;

// ---- pointer-vs-drag bookkeeping ----
let downPos = null;
let downTime = 0;

export function onHover(cb) { hoverCallback = cb; }
export function onSelect(cb) { selectCallback = cb; }

export function setAutoRotate(on) {
  userWantsAutoRotate = on;
  if (controls) controls.autoRotate = on;
}

export function resetView() {
  if (!controls) return;
  camera.position.set(0, 1.15, 3.3);
  controls.target.set(0, 1.0, 0);
  controls.update();
}

export function markReported(partId) {
  const mesh = interactiveParts.find((p) => p.userData.partId === partId);
  if (!mesh) return;
  mesh.userData.reported = true;
  mesh.material.color.setHex(COLOR_REPORTED);
  mesh.material.emissive.setHex(COLOR_REPORTED);
  mesh.material.emissiveIntensity = 0.25;
}

export function initBodyScene(canvas) {
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.15, 3.3);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.3;
  controls.minDistance = 1.6;
  controls.maxDistance = 5.5;
  controls.maxPolarAngle = Math.PI * 0.85;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.update();

  addLights();
  buildBody();
  buildScanEffect();
  buildFloor();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  clock = new THREE.Clock();

  bindPointerEvents(canvas);
  observeResize(canvas);
  resizeToContainer(canvas);

  renderer.setAnimationLoop(tick);
}

function addLights() {
  const ambient = new THREE.AmbientLight(0x2a3644, 1.1);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2.2, 3.5, 2.6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x2dd4bf, 0.9);
  rim.position.set(-2.5, 1.8, -2.2);
  scene.add(rim);

  const fill = new THREE.PointLight(0x4a6577, 0.6, 8);
  fill.position.set(0, 1.6, 2.4);
  scene.add(fill);
}

function baseMaterial() {
  return new THREE.MeshStandardMaterial({
    color: COLOR_BASE,
    roughness: 0.55,
    metalness: 0.15,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
}

let bodyGroup;

function addPart(geometry, position, partId, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, baseMaterial());
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.userData.partId = partId;
  mesh.userData.baseType = normalizePart(partId);
  mesh.userData.reported = false;
  bodyGroup.add(mesh);
  interactiveParts.push(mesh);
  return mesh;
}

function buildBody() {
  bodyGroup = new THREE.Group();
  scene.add(bodyGroup);

  const cap = (r, len, seg = 10) => new THREE.CapsuleGeometry(r, len, 6, seg);

  // Feet
  addPart(new THREE.BoxGeometry(0.11, 0.08, 0.26), [-0.11, 0.04, 0.04], "foot_L");
  addPart(new THREE.BoxGeometry(0.11, 0.08, 0.26), [0.11, 0.04, 0.04], "foot_R");

  // Calves
  addPart(cap(0.062, 0.32), [-0.11, 0.26, 0], "calf_L");
  addPart(cap(0.062, 0.32), [0.11, 0.26, 0], "calf_R");

  // Knees
  addPart(new THREE.SphereGeometry(0.075, 16, 16), [-0.11, 0.47, 0], "knee_L");
  addPart(new THREE.SphereGeometry(0.075, 16, 16), [0.11, 0.47, 0], "knee_R");

  // Thighs
  addPart(cap(0.085, 0.34), [-0.11, 0.72, 0], "thigh_L");
  addPart(cap(0.085, 0.34), [0.11, 0.72, 0], "thigh_R");

  // Pelvis
  addPart(new THREE.CapsuleGeometry(0.14, 0.16, 6, 12), [0, 0.98, 0], "pelvis", [0, 0, Math.PI / 2]);

  // Abdomen (front) + lower back (rear collision plate)
  addPart(cap(0.13, 0.2), [0, 1.2, 0.01], "abdomen");
  addPart(new THREE.BoxGeometry(0.24, 0.24, 0.05), [0, 1.2, -0.13], "lower_back");

  // Chest (front) + upper back (rear collision plate)
  addPart(cap(0.165, 0.26), [0, 1.46, 0.01], "chest");
  addPart(new THREE.BoxGeometry(0.32, 0.28, 0.06), [0, 1.46, -0.17], "upper_back");

  // Neck + head
  addPart(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 14), [0, 1.65, 0], "neck");
  addPart(new THREE.SphereGeometry(0.13, 20, 20), [0, 1.83, 0], "head");

  // Shoulders / arms (both sides)
  [-1, 1].forEach((side) => {
    const s = side === -1 ? "_L" : "_R";
    const x = 0.29 * side;
    addPart(new THREE.SphereGeometry(0.08, 16, 16), [x, 1.58, 0], `shoulder${s}`);
    addPart(cap(0.055, 0.26), [x, 1.36, 0], `upperarm${s}`);
    addPart(new THREE.SphereGeometry(0.05, 14, 14), [x, 1.2, 0], `elbow${s}`);
    addPart(cap(0.045, 0.24), [x, 1.0, 0], `forearm${s}`);
    addPart(new THREE.SphereGeometry(0.055, 14, 14), [x, 0.85, 0], `hand${s}`);
  });
}

function buildScanEffect() {
  scanGroup = new THREE.Group();
  bodyGroup.add(scanGroup);

  const ringGeo = new THREE.TorusGeometry(0.34, 0.004, 8, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.55 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scanGroup.add(ring);

  const planeGeo = new THREE.PlaneGeometry(0.75, 0.75);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = Math.PI / 2;
  scanGroup.add(plane);
}

function buildFloor() {
  const geo = new THREE.CircleGeometry(1.15, 48);
  const mat = new THREE.MeshBasicMaterial({ color: 0x14202a, transparent: true, opacity: 0.5 });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  scene.add(floor);

  const ringGeo = new THREE.RingGeometry(1.14, 1.16, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);
}

function setHovered(mesh) {
  if (hoveredMesh === mesh) return;
  if (hoveredMesh && !hoveredMesh.userData.reported) {
    hoveredMesh.material.color.setHex(COLOR_BASE);
    hoveredMesh.material.emissiveIntensity = 0;
  }
  hoveredMesh = mesh;
  if (hoveredMesh && !hoveredMesh.userData.reported) {
    hoveredMesh.material.color.setHex(COLOR_HOVER);
    hoveredMesh.material.emissive.setHex(COLOR_HOVER);
    hoveredMesh.material.emissiveIntensity = 0.35;
  }
  const label = mesh ? regionLabels[mesh.userData.baseType] || mesh.userData.partId : null;
  hoverCallback(label, mesh ? mesh.userData.partId : null);
}

function raycastAt(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveParts, false);
  return hits.length ? hits[0].object : null;
}

function bindPointerEvents(canvas) {
  canvas.addEventListener("pointerdown", (e) => {
    downPos = { x: e.clientX, y: e.clientY };
    downTime = performance.now();
    if (controls) controls.autoRotate = false;
    clearTimeout(idleTimer);
  });

  canvas.addEventListener("pointerup", (e) => {
    const dx = downPos ? e.clientX - downPos.x : 0;
    const dy = downPos ? e.clientY - downPos.y : 0;
    const dist = Math.hypot(dx, dy);
    const duration = performance.now() - downTime;

    if (dist < 6 && duration < 450) {
      const mesh = raycastAt(e.clientX, e.clientY);
      if (mesh) selectCallback(mesh.userData.partId);
    }

    idleTimer = setTimeout(() => {
      if (userWantsAutoRotate && controls) controls.autoRotate = true;
    }, 2600);
  });

  canvas.addEventListener("pointermove", (e) => {
    const mesh = raycastAt(e.clientX, e.clientY);
    setHovered(mesh);
    canvas.style.cursor = mesh ? "crosshair" : "grab";
  });

  canvas.addEventListener("pointerleave", () => setHovered(null));
}

function observeResize(canvas) {
  const ro = new ResizeObserver(() => resizeToContainer(canvas));
  ro.observe(canvas.parentElement);
  window.addEventListener("resize", () => resizeToContainer(canvas));
}

function resizeToContainer(canvas) {
  const parent = canvas.parentElement;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function tick() {
  const t = clock.getElapsedTime();

  // scan sweep between ankle height and just above the head
  const y = 0.15 + (Math.sin(t * 0.55) * 0.5 + 0.5) * 1.75;
  scanGroup.position.y = y;
  scanGroup.children.forEach((child) => {
    child.material.opacity = child.geometry.type === "TorusGeometry" ? 0.5 : 0.045;
  });

  controls.update();
  renderer.render(scene, camera);
}
