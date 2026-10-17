import * as THREE from 'three';
import {
  BotVehicleState,
  CALIPER_COLOR_PRESETS,
  CarCustomizationState,
  CircuitTrackId,
  DEFAULT_CUSTOMIZATION,
  FINISH_TYPE_SPECS,
  getCircuitSpec,
  HypercarModelId,
  PAINT_PRESETS,
  RIM_COLOR_PRESETS,
  TRACK_WIDTH_M,
  TrackSample,
  VinylLiveryId,
} from './physics';

export interface HypercarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  cockpitGroup: THREE.Group;
  canopyMesh: THREE.Mesh;
  sideIntakeMesh: THREE.Mesh;
  paintMaterials: THREE.MeshPhysicalMaterial[];
  rimMaterials: THREE.MeshPhysicalMaterial[];
  caliperMaterials: THREE.MeshStandardMaterial[];
  brakeDiscMaterials: THREE.MeshStandardMaterial[];
  taillightMaterial: THREE.MeshStandardMaterial;
  headlightMaterial: THREE.MeshStandardMaterial;
  liveryDecalMesh: THREE.Mesh;
  liveryCanvas: HTMLCanvasElement;
  liveryTexture: THREE.CanvasTexture;
  rearWingBlade: THREE.Mesh;
  frontFenderLeft: THREE.Mesh;
  frontFenderRight: THREE.Mesh;
  steeringWheel: THREE.Group;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Group;
  wheelRR: THREE.Group;
  activeLodLevel: 0 | 1 | 2;
}

export interface BotCarRig {
  id: string;
  root: THREE.Group;
  rig: HypercarRig;
  taillightMaterial: THREE.MeshStandardMaterial;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Group;
  wheelRR: THREE.Group;
}

export interface CircuitEnvironment {
  grassMaterial: THREE.MeshStandardMaterial;
  roadMesh: THREE.Mesh;
  kerbMesh: THREE.Mesh;
  asphaltMaterial: THREE.MeshStandardMaterial;
  kerbMaterial: THREE.MeshStandardMaterial;
  leftBarrierInstanced: THREE.InstancedMesh;
  rightBarrierInstanced: THREE.InstancedMesh;
  standInstanced: THREE.InstancedMesh;
  roofInstanced: THREE.InstancedMesh;
  gantryGroup: THREE.Group;
  trunkInstanced: THREE.InstancedMesh;
  treeFoliageInstanced: THREE.InstancedMesh;
  treeBaseMatrices: THREE.Matrix4[];
  flagPoleInstanced: THREE.InstancedMesh;
  flagClothInstanced: THREE.InstancedMesh;
  flagBaseMatrices: THREE.Matrix4[];
  grassTuftInstanced: THREE.InstancedMesh;
  grassBaseMatrices: THREE.Matrix4[];
  sunMesh: THREE.Mesh;
  moonMesh: THREE.Mesh;
  starfieldInstanced: THREE.InstancedMesh;
  starfieldMaterial: THREE.MeshBasicMaterial;
  cloudGroup: THREE.Group;
  cloudLayerMeshes: THREE.InstancedMesh[];
  cloudLitMaterial: THREE.MeshStandardMaterial;
  cloudShadowMaterial: THREE.MeshStandardMaterial;
  particleMesh: THREE.InstancedMesh;
  sparkParticleMesh: THREE.InstancedMesh;
}

function createAsphaltTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181b22';
  ctx.fillRect(0, 0, size, size);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 2500; i++) {
    const x = Math.floor(rand() * size);
    const y = Math.floor(rand() * size);
    const v = 24 + Math.floor(rand() * 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#14171d');
  grad.addColorStop(0.025, '#14171d');
  grad.addColorStop(0.03, '#f8fafc');
  grad.addColorStop(0.055, '#f8fafc');
  grad.addColorStop(0.06, '#1f232c');
  grad.addColorStop(0.35, '#171a21');
  grad.addColorStop(0.5, '#0f1116');
  grad.addColorStop(0.65, '#171a21');
  grad.addColorStop(0.94, '#1f232c');
  grad.addColorStop(0.945, '#f8fafc');
  grad.addColorStop(0.97, '#f8fafc');
  grad.addColorStop(0.975, '#14171d');
  grad.addColorStop(1, '#14171d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

function createKerbTexture(
  maxAnisotropy: number,
  primaryHex = 0xe11d2a,
  secondaryHex = 0xf8fafc
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const pColor = `#${primaryHex.toString(16).padStart(6, '0')}`;
  const sColor = `#${secondaryHex.toString(16).padStart(6, '0')}`;

  ctx.fillStyle = pColor;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = sColor;
  ctx.fillRect(0, 128, 128, 128);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 120, 128, 8);
  ctx.fillRect(0, 248, 128, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createCarbonTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#121316';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#24272e';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      const offset = (y / 8) % 2 === 0 ? 0 : 4;
      ctx.fillRect((x + offset) % 64, y, 4, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function drawVinylLiveryCanvas(
  canvas: HTMLCanvasElement,
  liveryId: VinylLiveryId
) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (liveryId === 'none') {
    return;
  }

  const cx = w * 0.5;
  if (liveryId === 'tricolore') {
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(cx - 30, 0, 19, h);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 10, 0, 20, h);
    ctx.fillStyle = '#E11D2A';
    ctx.fillRect(cx + 11, 0, 19, h);
  } else if (liveryId === 'carbon_gt') {
    ctx.fillStyle = '#111318';
    ctx.fillRect(cx - 68, 0, 136, h);
    ctx.fillStyle = '#E11D2A';
    ctx.fillRect(cx - 74, 0, 6, h);
    ctx.fillRect(cx + 68, 0, 6, h);
  } else if (liveryId === 'scuderia_16') {
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(cx - 15, 0, 9, h);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 5, 0, 10, h);
    ctx.fillStyle = '#E11D2A';
    ctx.fillRect(cx + 6, 0, 9, h);

    ctx.beginPath();
    ctx.arc(cx, h * 0.52, 68, 0, Math.PI * 2);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0F172A';
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('16', cx, h * 0.54);
  }
}

export function applyCarCustomization(
  rig: HypercarRig,
  custom: CarCustomizationState
) {
  const paintPreset =
    PAINT_PRESETS.find((p) => p.id === custom.paintId) || PAINT_PRESETS[0];
  const finishSpec =
    FINISH_TYPE_SPECS[custom.finishType] || FINISH_TYPE_SPECS.gloss;
  const rimPreset =
    RIM_COLOR_PRESETS.find((r) => r.id === custom.rimColorId) ||
    RIM_COLOR_PRESETS[0];
  const caliperPreset =
    CALIPER_COLOR_PRESETS.find((c) => c.id === custom.caliperColorId) ||
    CALIPER_COLOR_PRESETS[0];

  rig.paintMaterials.forEach((mat) => {
    mat.color.set(paintPreset.hex);
    mat.metalness = finishSpec.metalness;
    mat.roughness = finishSpec.roughness;
    mat.clearcoat = finishSpec.clearcoat;
    mat.clearcoatRoughness = finishSpec.clearcoatRoughness;
    mat.needsUpdate = true;
  });

  rig.rimMaterials.forEach((mat) => {
    mat.color.set(rimPreset.hex);
    mat.metalness = rimPreset.metalness;
    mat.roughness = rimPreset.roughness;
    mat.needsUpdate = true;
  });

  rig.caliperMaterials.forEach((mat) => {
    mat.color.set(caliperPreset.hex);
    mat.needsUpdate = true;
  });

  drawVinylLiveryCanvas(rig.liveryCanvas, custom.vinylLivery);
  rig.liveryTexture.needsUpdate = true;
  rig.liveryDecalMesh.visible = custom.vinylLivery !== 'none';
}

/**
 * Phase 4: Adapts the 3D Hypercar chassis geometry & proportions to match the selected model
 * (Scuderia F80 V12, Toro V12 Revuelto SVJ, Woking W1 GTR, Stuttgart 918 RSR).
 */
export function applyHypercarModelStyle(
  rig: HypercarRig,
  carId: HypercarModelId
) {
  if (carId === 'ferrari_f80') {
    rig.canopyMesh.scale.set(0.96, 0.46, 1.78);
    rig.rearWingBlade.scale.set(1.0, 1.0, 1.0);
    rig.rearWingBlade.position.y = 0.96;
    rig.sideIntakeMesh.scale.set(1.0, 1.0, 1.0);
  } else if (carId === 'lambo_revuelto') {
    // Wider angular wedge canopy + aggressive wide SVJ wing + wider intakes
    rig.canopyMesh.scale.set(1.04, 0.41, 1.88);
    rig.rearWingBlade.scale.set(1.12, 1.15, 1.15);
    rig.rearWingBlade.position.y = 1.01;
    rig.sideIntakeMesh.scale.set(1.08, 1.22, 1.15);
  } else if (carId === 'mclaren_w1') {
    // Compact teardrop fighter-jet canopy + Longtail high-downforce wing
    rig.canopyMesh.scale.set(0.86, 0.48, 1.65);
    rig.rearWingBlade.scale.set(1.06, 1.1, 1.35);
    rig.rearWingBlade.position.y = 0.98;
    rig.sideIntakeMesh.scale.set(0.96, 1.05, 1.1);
  } else if (carId === 'porsche_918') {
    // Classic Le Mans rounded GT canopy + low-drag Weissach wing
    rig.canopyMesh.scale.set(0.94, 0.51, 1.72);
    rig.rearWingBlade.scale.set(0.96, 0.95, 0.92);
    rig.rearWingBlade.position.y = 0.92;
    rig.sideIntakeMesh.scale.set(0.98, 0.9, 0.95);
  }
}

/**
 * Phase 4: Dynamic LOD Switching (LOD0 full interior/cockpit in garage & close cam,
 * LOD1/LOD2 hides interior cockpit submeshes at distance to save draw calls).
 */
export function setHypercarLodLevel(rig: HypercarRig, lodLevel: 0 | 1 | 2) {
  if (rig.activeLodLevel === lodLevel) return;
  rig.activeLodLevel = lodLevel;
  rig.cockpitGroup.visible = lodLevel === 0;
}

export function buildHypercarRig(
  maxAnisotropy: number,
  initialCustomization: CarCustomizationState = DEFAULT_CUSTOMIZATION
): HypercarRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const preset =
    PAINT_PRESETS.find((p) => p.id === initialCustomization.paintId) ||
    PAINT_PRESETS[0];
  const finishSpec = FINISH_TYPE_SPECS[initialCustomization.finishType];
  const carbonTex = createCarbonTexture(maxAnisotropy);

  const mainPaintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.hex),
    metalness: finishSpec.metalness,
    roughness: finishSpec.roughness,
    clearcoat: finishSpec.clearcoat,
    clearcoatRoughness: finishSpec.clearcoatRoughness,
    envMapIntensity: 1.55,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: carbonTex,
    roughness: 0.52,
    metalness: 0.35,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d121a,
    metalness: 0.15,
    roughness: 0.06,
    transmission: 0.62,
    transparent: true,
    opacity: 0.88,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x141519,
    roughness: 0.85,
    metalness: 0.08,
  });

  // --- PART 1: Low-Slung Aerodynamic Wedge Main Hull ---
  const sideProfile = new THREE.Shape();
  sideProfile.moveTo(-2.22, 0.16);
  sideProfile.lineTo(-1.85, 0.42);
  sideProfile.lineTo(-0.75, 0.58);
  sideProfile.lineTo(0.45, 0.62);
  sideProfile.lineTo(1.88, 0.64);
  sideProfile.lineTo(2.12, 0.44);
  sideProfile.lineTo(2.02, 0.18);
  sideProfile.lineTo(-2.22, 0.16);

  const hullGeo = new THREE.ExtrudeGeometry(sideProfile, {
    depth: 1.62,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.11,
    bevelThickness: 0.14,
  });
  hullGeo.rotateY(Math.PI / 2);
  hullGeo.translate(-0.81, 0, 0);
  hullGeo.scale(1, 1, -1);
  hullGeo.computeVertexNormals();

  const mainHull = new THREE.Mesh(hullGeo, mainPaintMat);
  mainHull.castShadow = true;
  mainHull.receiveShadow = true;
  bodyGroup.add(mainHull);

  // --- PART 1B: Vinyl Livery Decal Strip on Front Hood ---
  const liveryCanvas = document.createElement('canvas');
  liveryCanvas.width = 256;
  liveryCanvas.height = 512;
  drawVinylLiveryCanvas(liveryCanvas, initialCustomization.vinylLivery);

  const liveryTexture = new THREE.CanvasTexture(liveryCanvas);
  liveryTexture.colorSpace = THREE.SRGBColorSpace;
  liveryTexture.anisotropy = maxAnisotropy;

  const liveryMat = new THREE.MeshStandardMaterial({
    map: liveryTexture,
    transparent: true,
    roughness: 0.25,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const liveryDecalMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 1.38),
    liveryMat
  );
  liveryDecalMesh.rotation.x = -Math.PI / 2 + 0.145;
  liveryDecalMesh.position.set(0, 0.675, 1.26);
  bodyGroup.add(liveryDecalMesh);

  // --- PART 2: Split Left & Right Front Fender Arches + Rear Haunches ---
  const halfFenderGeo = new THREE.BoxGeometry(0.98, 0.36, 1.25);
  const frontFenderLeft = new THREE.Mesh(halfFenderGeo, mainPaintMat);
  frontFenderLeft.position.set(0.52, 0.36, 1.32);
  frontFenderLeft.castShadow = true;

  const frontFenderRight = new THREE.Mesh(halfFenderGeo, mainPaintMat);
  frontFenderRight.position.set(-0.52, 0.36, 1.32);
  frontFenderRight.castShadow = true;
  bodyGroup.add(frontFenderLeft, frontFenderRight);

  const rearHaunchGeo = new THREE.BoxGeometry(2.08, 0.44, 1.48);
  const rearFender = new THREE.Mesh(rearHaunchGeo, mainPaintMat);
  rearFender.position.set(0, 0.42, -1.28);
  rearFender.castShadow = true;
  bodyGroup.add(rearFender);

  const intakeGeo = new THREE.BoxGeometry(2.04, 0.24, 0.92);
  const sideIntakeMesh = new THREE.Mesh(intakeGeo, carbonMat);
  sideIntakeMesh.position.set(0, 0.40, -0.32);
  bodyGroup.add(sideIntakeMesh);

  // --- PART 3: Sleek Low-Profile Teardrop Glass Canopy ---
  const canopyGeo = new THREE.SphereGeometry(0.72, 28, 18);
  const canopyMesh = new THREE.Mesh(canopyGeo, glassMat);
  canopyMesh.scale.set(0.96, 0.46, 1.78);
  canopyMesh.position.set(0, 0.72, 0.10);
  canopyMesh.renderOrder = 2;
  bodyGroup.add(canopyMesh);

  // --- PART 4: Ultra-Detailed Cockpit Interior (LOD0 Only) ---
  const cockpitGroup = new THREE.Group();
  cockpitGroup.position.set(0, 0.50, 0.25);

  const dashMesh = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.24, 0.46), interiorMat);
  dashMesh.position.set(0, 0.14, 0.42);
  cockpitGroup.add(dashMesh);

  const screenMat = new THREE.MeshBasicMaterial({ color: 0xe11d2a });
  const dashScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.11), screenMat);
  dashScreen.position.set(0.32, 0.22, 0.17);
  dashScreen.rotation.y = Math.PI;
  cockpitGroup.add(dashScreen);

  const seatGeo = new THREE.BoxGeometry(0.42, 0.52, 0.40);
  const driverSeat = new THREE.Mesh(seatGeo, interiorMat);
  driverSeat.position.set(0.32, 0.10, -0.28);
  const passengerSeat = new THREE.Mesh(seatGeo, interiorMat);
  passengerSeat.position.set(-0.32, 0.10, -0.28);
  cockpitGroup.add(driverSeat, passengerSeat);

  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(0.32, 0.21, 0.08);
  steeringWheel.rotation.x = -0.22;

  const rimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.022, 10, 24),
    carbonMat
  );
  const hubBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.025), carbonMat);
  const topLedMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.028, 0.028),
    new THREE.MeshBasicMaterial({ color: 0xe11d2a })
  );
  topLedMarker.position.set(0, 0.14, 0);
  steeringWheel.add(rimTorus, hubBar, topLedMarker);
  cockpitGroup.add(steeringWheel);
  bodyGroup.add(cockpitGroup);

  // --- PART 5: Carbon Fiber Front Aero Splitter & Side Skirts ---
  const splitterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.04, 0.055, 0.62),
    carbonMat
  );
  splitterMesh.position.set(0, 0.14, 2.08);
  bodyGroup.add(splitterMesh);

  const skirtMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 0.065, 2.42),
    carbonMat
  );
  skirtMesh.position.set(0, 0.14, 0.0);
  bodyGroup.add(skirtMesh);

  // --- PART 6: Rear Carbon Diffuser & Active DRS Swan-Neck Wing ---
  const diffuserMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.22, 0.52),
    carbonMat
  );
  diffuserMesh.position.set(0, 0.21, -2.08);
  bodyGroup.add(diffuserMesh);

  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.20, 0.55), carbonMat);
    fin.position.set(i * 0.36, 0.19, -2.10);
    bodyGroup.add(fin);
  }

  const wingPylonGeo = new THREE.BoxGeometry(0.05, 0.34, 0.26);
  const leftPylon = new THREE.Mesh(wingPylonGeo, carbonMat);
  leftPylon.position.set(-0.52, 0.80, -1.88);
  leftPylon.rotation.x = 0.25;
  const rightPylon = new THREE.Mesh(wingPylonGeo, carbonMat);
  rightPylon.position.set(0.52, 0.80, -1.88);
  rightPylon.rotation.x = 0.25;

  const rearWingBlade = new THREE.Mesh(
    new THREE.BoxGeometry(1.96, 0.045, 0.35),
    carbonMat
  );
  rearWingBlade.position.set(0, 0.96, -1.98);
  rearWingBlade.rotation.x = 0.14;
  rearWingBlade.castShadow = true;
  bodyGroup.add(leftPylon, rightPylon, rearWingBlade);

  // --- PART 7: Quad Titanium Exhausts & Forged Rims Material ---
  const rimPreset =
    RIM_COLOR_PRESETS.find((r) => r.id === initialCustomization.rimColorId) ||
    RIM_COLOR_PRESETS[0];

  const rimMetalMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(rimPreset.hex),
    metalness: rimPreset.metalness,
    roughness: rimPreset.roughness,
    anisotropy: 0.8,
  });

  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
  exhaustGeo.rotateX(Math.PI / 2);
  [-0.42, -0.26, 0.26, 0.42].forEach((xPos) => {
    const pipe = new THREE.Mesh(exhaustGeo, rimMetalMat);
    pipe.position.set(xPos, 0.34, -2.16);
    bodyGroup.add(pipe);
  });

  // --- PART 8: Razor LED Headlights & Reactive Ferrari Twin Taillights ---
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });
  const hlGeo = new THREE.BoxGeometry(0.36, 0.04, 0.16);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(0.70, 0.40, 2.15);
  hlLeft.rotation.y = 0.22;
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(-0.70, 0.40, 2.15);
  hlRight.rotation.y = -0.22;
  bodyGroup.add(hlLeft, hlRight);

  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1122,
    emissive: 0xe11d2a,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const tlGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.08, 20);
  tlGeo.rotateX(Math.PI / 2);
  [-0.74, -0.46, 0.46, 0.74].forEach((xPos) => {
    const tl = new THREE.Mesh(tlGeo, taillightMaterial);
    tl.position.set(xPos, 0.50, -2.14);
    bodyGroup.add(tl);
  });

  // --- PART 9..12: 4 Forged Wheel Assemblies + Thermal Glowing Brake Discs & Calipers ---
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141518,
    roughness: 0.82,
    metalness: 0.08,
  });

  const caliperPreset =
    CALIPER_COLOR_PRESETS.find(
      (c) => c.id === initialCustomization.caliperColorId
    ) || CALIPER_COLOR_PRESETS[0];

  const caliperMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(caliperPreset.hex),
    roughness: 0.25,
    metalness: 0.65,
  });

  const brakeDiscMat = new THREE.MeshStandardMaterial({
    color: 0x646870,
    roughness: 0.35,
    metalness: 0.85,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 0.0,
  });

  const createWheelAssembly = (isLeft: boolean): THREE.Group => {
    const wheelGroup = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(0.345, 0.345, 0.31, 28);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    const rimOuterGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 24);
    rimOuterGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimOuterGeo, rimMetalMat);
    wheelGroup.add(rimMesh);

    const spokeGeo = new THREE.BoxGeometry(0.33, 0.04, 0.44);
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(spokeGeo, rimMetalMat);
      spoke.rotation.x = (s * Math.PI) / 5;
      wheelGroup.add(spoke);
    }

    const discGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.04, 24);
    discGeo.rotateZ(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, brakeDiscMat);
    discMesh.position.x = isLeft ? -0.04 : 0.04;
    wheelGroup.add(discMesh);

    const caliperGeo = new THREE.BoxGeometry(0.09, 0.16, 0.11);
    const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
    caliperMesh.position.set(isLeft ? 0.06 : -0.06, 0.08, -0.11);
    wheelGroup.add(caliperMesh);

    return wheelGroup;
  };

  const wheelFL = createWheelAssembly(true);
  wheelFL.position.set(0.95, 0.345, 1.34);

  const wheelFR = createWheelAssembly(false);
  wheelFR.position.set(-0.95, 0.345, 1.34);

  const wheelRL = createWheelAssembly(true);
  wheelRL.position.set(0.98, 0.355, -1.31);

  const wheelRR = createWheelAssembly(false);
  wheelRR.position.set(-0.98, 0.355, -1.31);

  root.add(wheelFL, wheelFR, wheelRL, wheelRR);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const radGrad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 62);
  radGrad.addColorStop(0, 'rgba(0,0,0,0.92)');
  radGrad.addColorStop(0.65, 'rgba(0,0,0,0.48)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
  sCtx.fillStyle = radGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 5.15),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.82,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.028;
  root.add(contactShadow);

  return {
    root,
    bodyGroup,
    cockpitGroup,
    canopyMesh,
    sideIntakeMesh,
    paintMaterials: [mainPaintMat],
    rimMaterials: [rimMetalMat],
    caliperMaterials: [caliperMat],
    brakeDiscMaterials: [brakeDiscMat],
    taillightMaterial,
    headlightMaterial: headlightMat,
    liveryDecalMesh,
    liveryCanvas,
    liveryTexture,
    rearWingBlade,
    frontFenderLeft,
    frontFenderRight,
    steeringWheel,
    wheelFL,
    wheelFR,
    wheelRL,
    wheelRR,
    activeLodLevel: 0,
  };
}

/**
 * Builds the 3 Rival AI Hypercar 3D Rigs (Toro V10, Woking P1, Stuttgart 918)
 */
export function buildBotHypercarRigs(
  scene: THREE.Scene,
  bots: BotVehicleState[],
  maxAnisotropy: number
): BotCarRig[] {
  const botStyles: HypercarModelId[] = [
    'lambo_revuelto',
    'mclaren_w1',
    'porsche_918',
  ];
  return bots.map((bot, idx) => {
    const rig = buildHypercarRig(maxAnisotropy, {
      ...DEFAULT_CUSTOMIZATION,
      vinylLivery: 'carbon_gt',
    });

    applyHypercarModelStyle(rig, botStyles[idx % botStyles.length]);
    setHypercarLodLevel(rig, 1);

    rig.paintMaterials.forEach((mat) => {
      mat.color.set(bot.brandColorHex);
      mat.metalness = 0.82;
      mat.roughness = 0.2;
      mat.clearcoat = 1.0;
      mat.needsUpdate = true;
    });

    rig.root.position.set(bot.x, 0, bot.z);
    rig.root.rotation.y = bot.headingRad;
    scene.add(rig.root);

    return {
      id: bot.id,
      root: rig.root,
      rig,
      taillightMaterial: rig.taillightMaterial,
      wheelFL: rig.wheelFL,
      wheelFR: rig.wheelFR,
      wheelRL: rig.wheelRL,
      wheelRR: rig.wheelRR,
    };
  });
}

function buildTrackGeometryFromSamples(samples: readonly TrackSample[]): {
  roadGeo: THREE.BufferGeometry;
  kerbGeo: THREE.BufferGeometry;
} {
  const numSegs = samples.length;
  const halfWidth = TRACK_WIDTH_M * 0.5;
  const kerbWidth = 1.45;

  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const kerbPositions: number[] = [];
  const kerbNormals: number[] = [];
  const kerbUvs: number[] = [];
  const kerbIndices: number[] = [];

  for (let i = 0; i <= numSegs; i++) {
    const s = samples[i % numSegs];
    const vCoord = i * 0.35;
    const normalX = s.tz;
    const normalZ = -s.tx;

    const lx = s.x - normalX * halfWidth;
    const lz = s.z - normalZ * halfWidth;
    const rx = s.x + normalX * halfWidth;
    const rz = s.z + normalZ * halfWidth;

    roadPositions.push(lx, 0.015, lz, rx, 0.015, rz);
    roadNormals.push(0, 1, 0, 0, 1, 0);
    roadUvs.push(0, vCoord, 1, vCoord);

    const klx = s.x - normalX * (halfWidth + kerbWidth);
    const klz = s.z - normalZ * (halfWidth + kerbWidth);
    const krx = s.x + normalX * (halfWidth + kerbWidth);
    const krz = s.z + normalZ * (halfWidth + kerbWidth);

    kerbPositions.push(
      klx, 0.035, klz,
      lx, 0.024, lz,
      rx, 0.024, rz,
      krx, 0.035, krz
    );
    kerbNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    kerbUvs.push(0, vCoord * 2.2, 1, vCoord * 2.2, 0, vCoord * 2.2, 1, vCoord * 2.2);

    if (i < numSegs) {
      const rBase = i * 2;
      roadIndices.push(rBase, rBase + 2, rBase + 1, rBase + 1, rBase + 2, rBase + 3);

      const kBase = i * 4;
      kerbIndices.push(kBase, kBase + 4, kBase + 1, kBase + 1, kBase + 4, kBase + 5);
      kerbIndices.push(kBase + 2, kBase + 6, kBase + 3, kBase + 3, kBase + 6, kBase + 7);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  const kerbGeo = new THREE.BufferGeometry();
  kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPositions, 3));
  kerbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(kerbNormals, 3));
  kerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(kerbUvs, 2));
  kerbGeo.setIndex(kerbIndices);

  return { roadGeo, kerbGeo };
}

/**
 * Phase 4: Dynamically streams/updates the 3D circuit spline road, kerbs, barriers,
 * grandstands, trees, flags, and gantry when switching between Monza, Monaco, Spa, and Suzuka.
 */
export function updateCircuitEnvironmentForTrack(
  env: CircuitEnvironment,
  samples: readonly TrackSample[],
  trackId: CircuitTrackId,
  maxAnisotropy: number
) {
  const spec = getCircuitSpec(trackId);
  const halfWidth = TRACK_WIDTH_M * 0.5;
  const dummy = new THREE.Object3D();

  env.grassMaterial.color.setHex(spec.grassTintHex);

  const { roadGeo, kerbGeo } = buildTrackGeometryFromSamples(samples);
  env.roadMesh.geometry.dispose();
  env.roadMesh.geometry = roadGeo;

  env.kerbMesh.geometry.dispose();
  env.kerbMesh.geometry = kerbGeo;
  if (env.kerbMaterial.map) env.kerbMaterial.map.dispose();
  env.kerbMaterial.map = createKerbTexture(
    maxAnisotropy,
    spec.kerbPrimaryHex,
    spec.kerbSecondaryHex
  );
  env.kerbMaterial.needsUpdate = true;

  // Barriers
  const barrierPostCount = env.leftBarrierInstanced.count;
  for (let i = 0; i < barrierPostCount; i++) {
    const s = samples[Math.floor((i / barrierPostCount) * samples.length)];
    const yaw = Math.atan2(s.tx, s.tz);
    const offset = halfWidth + 3.4;
    const normalX = s.tz;
    const normalZ = -s.tx;

    dummy.position.set(s.x - normalX * offset, 0.35, s.z - normalZ * offset);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    env.leftBarrierInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.set(s.x + normalX * offset, 0.35, s.z + normalZ * offset);
    dummy.updateMatrix();
    env.rightBarrierInstanced.setMatrixAt(i, dummy.matrix);
  }
  env.leftBarrierInstanced.instanceMatrix.needsUpdate = true;
  env.rightBarrierInstanced.instanceMatrix.needsUpdate = true;

  // Gantry
  const startSample = samples[Math.floor(samples.length * 0.068)];
  env.gantryGroup.position.set(startSample.x, 0, startSample.z);
  env.gantryGroup.rotation.y = Math.atan2(startSample.tx, startSample.tz);

  // Grandstands
  const standCount = env.standInstanced.count;
  for (let i = 0; i < standCount; i++) {
    const s = samples[Math.floor(((i * 0.095 + 0.02) % 1) * samples.length)];
    const normalX = s.tz;
    const normalZ = -s.tx;
    const side = i % 2 === 0 ? 1 : -1;
    const dist = halfWidth + 14.5;

    dummy.position.set(s.x + normalX * dist * side, 2.75, s.z + normalZ * dist * side);
    dummy.rotation.set(
      0,
      Math.atan2(s.tx, s.tz) + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
      0
    );
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    env.standInstanced.setMatrixAt(i, dummy.matrix);

    dummy.position.y = 5.75;
    dummy.updateMatrix();
    env.roofInstanced.setMatrixAt(i, dummy.matrix);
  }
  env.standInstanced.instanceMatrix.needsUpdate = true;
  env.roofInstanced.instanceMatrix.needsUpdate = true;

  // Flags
  const flagCount = env.flagClothInstanced.count;
  env.flagBaseMatrices.length = 0;
  for (let i = 0; i < flagCount; i++) {
    const s = samples[Math.floor(((i / flagCount) % 1) * samples.length)];
    const normalX = s.tz;
    const normalZ = -s.tx;
    const side = i % 2 === 0 ? 1 : -1;
    const dist = halfWidth + 5.8;

    dummy.position.set(s.x + normalX * dist * side, 0, s.z + normalZ * dist * side);
    dummy.rotation.set(0, Math.atan2(s.tx, s.tz), 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();

    env.flagPoleInstanced.setMatrixAt(i, dummy.matrix);
    env.flagClothInstanced.setMatrixAt(i, dummy.matrix);
    env.flagBaseMatrices.push(dummy.matrix.clone());
  }
  env.flagPoleInstanced.instanceMatrix.needsUpdate = true;
  env.flagClothInstanced.instanceMatrix.needsUpdate = true;

  // Trees
  const treeCount = env.treeFoliageInstanced.count;
  env.treeBaseMatrices.length = 0;
  for (let i = 0; i < treeCount; i++) {
    const s = samples[Math.floor(((i / treeCount) % 1) * samples.length)];
    const normalX = s.tz;
    const normalZ = -s.tx;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = halfWidth + 11.5 + ((i * 17) % 24);
    const scale = 0.85 + ((i * 13) % 35) * 0.01;

    dummy.position.set(s.x + normalX * offset * side, 0, s.z + normalZ * offset * side);
    dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();

    env.trunkInstanced.setMatrixAt(i, dummy.matrix);
    env.treeFoliageInstanced.setMatrixAt(i, dummy.matrix);
    env.treeBaseMatrices.push(dummy.matrix.clone());
  }
  env.trunkInstanced.instanceMatrix.needsUpdate = true;
  env.treeFoliageInstanced.instanceMatrix.needsUpdate = true;

  // Grass tufts
  const grassCount = env.grassTuftInstanced.count;
  env.grassBaseMatrices.length = 0;
  for (let i = 0; i < grassCount; i++) {
    const s = samples[Math.floor(((i / grassCount) % 1) * samples.length)];
    const normalX = s.tz;
    const normalZ = -s.tx;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = halfWidth + 2.2 + ((i * 7) % 4) * 0.35;

    dummy.position.set(s.x + normalX * offset * side, 0, s.z + normalZ * offset * side);
    dummy.rotation.set(0, i * 0.9, 0);
    dummy.scale.set(1.1, 0.8 + (i % 3) * 0.2, 1.1);
    dummy.updateMatrix();
    env.grassTuftInstanced.setMatrixAt(i, dummy.matrix);
    env.grassBaseMatrices.push(dummy.matrix.clone());
  }
  env.grassTuftInstanced.instanceMatrix.needsUpdate = true;
}

export function buildMonzaCircuitScene(
  scene: THREE.Scene,
  samples: TrackSample[],
  maxAnisotropy: number,
  initialTrackId: CircuitTrackId = 'monza'
): CircuitEnvironment {
  const spec = getCircuitSpec(initialTrackId);
  const halfWidth = TRACK_WIDTH_M * 0.5;

  // 1. Ground Meadow Plane
  const grassGeo = new THREE.PlaneGeometry(1600, 1600);
  grassGeo.rotateX(-Math.PI / 2);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: spec.grassTintHex,
    roughness: 0.92,
    metalness: 0.02,
  });
  const grassMesh = new THREE.Mesh(grassGeo, grassMaterial);
  grassMesh.position.y = -0.03;
  grassMesh.receiveShadow = true;
  scene.add(grassMesh);

  // 2. Spline Road & F1 Kerb Ribbons
  const { roadGeo, kerbGeo } = buildTrackGeometryFromSamples(samples);

  const { map: asphaltMap, bumpMap: asphaltBump } = createAsphaltTextures(maxAnisotropy);
  const asphaltMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: asphaltMap,
    bumpMap: asphaltBump,
    bumpScale: 0.015,
    roughness: 0.58,
    metalness: 0.22,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
  });

  const roadMesh = new THREE.Mesh(roadGeo, asphaltMaterial);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  const kerbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createKerbTexture(maxAnisotropy, spec.kerbPrimaryHex, spec.kerbSecondaryHex),
    roughness: 0.48,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const kerbMesh = new THREE.Mesh(kerbGeo, kerbMaterial);
  kerbMesh.receiveShadow = true;
  scene.add(kerbMesh);

  // 3. Instanced Metallic Guardrail Barriers
  const barrierPostCount = 180;
  const barrierRailGeo = new THREE.BoxGeometry(0.18, 0.55, 4.2);
  const barrierRailMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.78,
    roughness: 0.32,
  });
  const leftBarrierInstanced = new THREE.InstancedMesh(
    barrierRailGeo,
    barrierRailMat,
    barrierPostCount
  );
  const rightBarrierInstanced = new THREE.InstancedMesh(
    barrierRailGeo,
    barrierRailMat,
    barrierPostCount
  );
  leftBarrierInstanced.frustumCulled = false;
  rightBarrierInstanced.frustumCulled = false;
  scene.add(leftBarrierInstanced, rightBarrierInstanced);

  // 4. Start/Finish Gantry Bridge
  const gantryGroup = new THREE.Group();
  const gantryFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e222a,
    metalness: 0.8,
    roughness: 0.28,
  });
  const gantryRedBannerMat = new THREE.MeshStandardMaterial({
    color: 0xd4121e,
    roughness: 0.32,
    metalness: 0.4,
  });

  const pillarGeo = new THREE.BoxGeometry(0.65, 6.8, 0.65);
  const leftPillar = new THREE.Mesh(pillarGeo, gantryFrameMat);
  leftPillar.position.set(-halfWidth - 2.2, 3.4, 0);
  const rightPillar = new THREE.Mesh(pillarGeo, gantryFrameMat);
  rightPillar.position.set(halfWidth + 2.2, 3.4, 0);

  const crossBeam = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH_M + 5.2, 1.25, 0.9),
    gantryRedBannerMat
  );
  crossBeam.position.set(0, 6.2, 0);

  const lightPodMat = new THREE.MeshStandardMaterial({
    color: 0xff1e27,
    emissive: 0xe11d2a,
    emissiveIntensity: 3.2,
  });
  for (let l = -2; l <= 2; l++) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.25), lightPodMat);
    pod.position.set(l * 1.15, 5.25, -0.45);
    gantryGroup.add(pod);
  }

  const checkerCanvas = document.createElement('canvas');
  checkerCanvas.width = 256;
  checkerCanvas.height = 64;
  const cCtx = checkerCanvas.getContext('2d')!;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      cCtx.fillStyle = (x + y) % 2 === 0 ? '#f8fafc' : '#0f172a';
      cCtx.fillRect(x * 16, y * 16, 16, 16);
    }
  }
  const checkerTex = new THREE.CanvasTexture(checkerCanvas);
  checkerTex.colorSpace = THREE.SRGBColorSpace;
  const finishLineMat = new THREE.MeshBasicMaterial({
    map: checkerTex,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const finishLinePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK_WIDTH_M, 2.8),
    finishLineMat
  );
  finishLinePlane.rotation.x = -Math.PI / 2;
  finishLinePlane.position.y = 0.036;
  gantryGroup.add(leftPillar, rightPillar, crossBeam, finishLinePlane);
  scene.add(gantryGroup);

  // 5. Grandstands & Wind-Animated Racing Flags
  const standCount = 10;
  const standGeo = new THREE.BoxGeometry(18, 5.5, 6);
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x262932,
    roughness: 0.7,
    metalness: 0.3,
  });
  const standInstanced = new THREE.InstancedMesh(standGeo, standMat, standCount);
  standInstanced.frustumCulled = false;

  const roofGeo = new THREE.BoxGeometry(18.6, 0.45, 6.8);
  const roofInstanced = new THREE.InstancedMesh(roofGeo, gantryRedBannerMat, standCount);
  roofInstanced.frustumCulled = false;
  scene.add(standInstanced, roofInstanced);

  const flagCount = 28;
  const flagPoleGeo = new THREE.CylinderGeometry(0.05, 0.07, 6.2, 8);
  flagPoleGeo.translate(0, 3.1, 0);
  const flagPoleInstanced = new THREE.InstancedMesh(
    flagPoleGeo,
    barrierRailMat,
    flagCount
  );
  flagPoleInstanced.frustumCulled = false;

  const flagClothGeo = new THREE.BoxGeometry(1.75, 0.95, 0.04);
  flagClothGeo.translate(0.88, 5.4, 0);
  const flagClothMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    metalness: 0.1,
  });
  const flagClothInstanced = new THREE.InstancedMesh(
    flagClothGeo,
    flagClothMat,
    flagCount
  );
  flagClothInstanced.frustumCulled = false;

  const flagPalette = [
    new THREE.Color(0xe11d2a),
    new THREE.Color(0xfacc15),
    new THREE.Color(0x16a34a),
    new THREE.Color(0xf8fafc),
  ];
  for (let i = 0; i < flagCount; i++) {
    flagClothInstanced.setColorAt(i, flagPalette[i % flagPalette.length]);
  }
  scene.add(flagPoleInstanced, flagClothInstanced);

  // 6. Wind-Animated Cypress Trees & Trackside Grass Clusters
  const treeCount = 140;
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.6, 7);
  trunkGeo.translate(0, 1.3, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2c20, roughness: 0.9 });
  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  trunkInstanced.frustumCulled = false;

  const foliageGeo = new THREE.ConeGeometry(2.15, 7.2, 8);
  foliageGeo.translate(0, 5.4, 0);
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.02,
  });
  const treeFoliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
  treeFoliageInstanced.frustumCulled = false;
  const treeColor = new THREE.Color();
  for (let i = 0; i < treeCount; i++) {
    const hue = 0.31 + ((i % 5) - 2) * 0.012;
    const light = 0.20 + (i % 4) * 0.025;
    treeColor.setHSL(hue, 0.48, light);
    treeFoliageInstanced.setColorAt(i, treeColor);
  }
  scene.add(trunkInstanced, treeFoliageInstanced);

  const grassCount = 120;
  const grassBladeGeo = new THREE.ConeGeometry(0.42, 0.85, 5);
  grassBladeGeo.translate(0, 0.42, 0);
  const grassBladeMat = new THREE.MeshStandardMaterial({
    color: 0x264628,
    roughness: 0.88,
  });
  const grassTuftInstanced = new THREE.InstancedMesh(
    grassBladeGeo,
    grassBladeMat,
    grassCount
  );
  grassTuftInstanced.frustumCulled = false;
  scene.add(grassTuftInstanced);

  // 7. PHASE 3 CELESTIAL DOME (Sun, Moon, 200-Star Field & Volumetric Cloud Layers)
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(14, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xfff4d2 })
  );
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(10, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xdbeafe })
  );
  scene.add(sunMesh, moonMesh);

  const starCount = 200;
  const starGeo = new THREE.OctahedronGeometry(1.15, 0);
  const starfieldMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0,
  });
  const starfieldInstanced = new THREE.InstancedMesh(
    starGeo,
    starfieldMaterial,
    starCount
  );
  starfieldInstanced.frustumCulled = false;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < starCount; i++) {
    const theta = ((i * 137.5) % 360) * (Math.PI / 180);
    const phi = (0.12 + ((i * 29) % 75) / 100) * (Math.PI * 0.48);
    const r = 360;
    dummy.position.set(
      r * Math.cos(phi) * Math.cos(theta),
      Math.max(28, r * Math.sin(phi)),
      r * Math.cos(phi) * Math.sin(theta)
    );
    const s = 0.6 + (i % 4) * 0.35;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    starfieldInstanced.setMatrixAt(i, dummy.matrix);
  }
  scene.add(starfieldInstanced);

  const cloudGroup = new THREE.Group();
  const cloudPuffGeo = new THREE.DodecahedronGeometry(14, 1);
  cloudPuffGeo.scale(1.85, 0.42, 1.35);

  const cloudLitMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.92,
    metalness: 0.0,
    transparent: true,
    opacity: 0.82,
  });

  const cloudShadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.76,
  });

  const cloudLayerMeshes: THREE.InstancedMesh[] = [];
  const puffsPerLayer = 28;

  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const isShadowBase = layerIdx === 0;
    const layerMesh = new THREE.InstancedMesh(
      cloudPuffGeo,
      isShadowBase ? cloudShadowMaterial : cloudLitMaterial,
      puffsPerLayer
    );
    layerMesh.frustumCulled = false;

    for (let i = 0; i < puffsPerLayer; i++) {
      const angle = (i / puffsPerLayer) * Math.PI * 2 + layerIdx * 0.18;
      const dist = 110 + ((i * 43) % 210);
      const baseX = Math.cos(angle) * dist + 60;
      const baseZ = Math.sin(angle) * dist;
      const baseY = 72 + layerIdx * 5.2 + (i % 3) * 3.5;

      dummy.position.set(
        baseX + layerIdx * 4.5,
        baseY,
        baseZ - layerIdx * 3.2
      );
      dummy.rotation.set(0, angle * 0.5, 0);
      const sx = (1.1 + (i % 4) * 0.35) * (1 - layerIdx * 0.14);
      const sy = 0.75 + layerIdx * 0.12;
      dummy.scale.set(sx, sy, sx);
      dummy.updateMatrix();
      layerMesh.setMatrixAt(i, dummy.matrix);
    }

    cloudGroup.add(layerMesh);
    cloudLayerMeshes.push(layerMesh);
  }
  scene.add(cloudGroup);

  // 8. Zero-GC Pooled Particle Ring Buffers
  const particleGeo = new THREE.DodecahedronGeometry(0.22, 0);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.45,
  });
  const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, 48);
  particleMesh.frustumCulled = false;

  const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.35);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xff9e00,
  });
  const sparkParticleMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, 36);
  sparkParticleMesh.frustumCulled = false;

  dummy.scale.set(0, 0, 0);
  dummy.updateMatrix();
  for (let i = 0; i < 48; i++) {
    particleMesh.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < 36; i++) {
    sparkParticleMesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(particleMesh, sparkParticleMesh);

  const env: CircuitEnvironment = {
    grassMaterial,
    roadMesh,
    kerbMesh,
    asphaltMaterial,
    kerbMaterial,
    leftBarrierInstanced,
    rightBarrierInstanced,
    standInstanced,
    roofInstanced,
    gantryGroup,
    trunkInstanced,
    treeFoliageInstanced,
    treeBaseMatrices: [],
    flagPoleInstanced,
    flagClothInstanced,
    flagBaseMatrices: [],
    grassTuftInstanced,
    grassBaseMatrices: [],
    sunMesh,
    moonMesh,
    starfieldInstanced,
    starfieldMaterial,
    cloudGroup,
    cloudLayerMeshes,
    cloudLitMaterial,
    cloudShadowMaterial,
    particleMesh,
    sparkParticleMesh,
  };

  updateCircuitEnvironmentForTrack(env, samples, initialTrackId, maxAnisotropy);
  return env;
}
