/**
 * ROSSO CORSA GT: APEX RTX - Phase 1, 2, 3 & 4 Complete Simulation Engine
 * - 4 Selectable Hypercars (Ferrari F80 V12, Toro V12 Revuelto, Woking W1 GTR, Stuttgart 918 RSR)
 * - 4 F1-Inspired Circuits (Monza, Monaco, Spa-Francorchamps, Suzuka)
 * - Pacejka Tire Model, Weight Transfer, 7-Speed DCT, Active Aero (DRS + Airbrake)
 * - 24h Day/Night Celestial Dome, Volumetric Cloud & Wind Dynamics, 3 AI Rival Bots
 * Pure, deterministic TypeScript module (decoupled from DOM/Three.js for unit testing)
 */

export type SurfaceCondition = 'dry' | 'wet';

export type PaintFinishType = 'gloss' | 'matte' | 'satin' | 'platinum';

export type VinylLiveryId = 'none' | 'tricolore' | 'scuderia_16' | 'carbon_gt';

export type GraphicsQualityTier = 'baja' | 'media' | 'alta' | 'ultra';

export type ControlSchemeType = 'buttons' | 'wheel' | 'gyroscope';

export type LightingCycleMode = 'dynamic' | 'day' | 'sunset' | 'night';

export type RaceGameMode = 'quick_race' | 'time_trial' | 'championship';

export type BotDifficultyTier = 'facil' | 'medio' | 'dificil' | 'pro';

// ============================================================================
// PHASE 4: 4 HYPERCARS CATALOG & 4 F1-INSPIRED CIRCUITS CATALOG
// ============================================================================

export type HypercarModelId =
  | 'ferrari_f80'
  | 'lambo_revuelto'
  | 'mclaren_w1'
  | 'porsche_918';

export type CircuitTrackId = 'monza' | 'monaco' | 'spa' | 'suzuka';

export interface HypercarModelSpec {
  id: HypercarModelId;
  brandTag: string;
  name: string;
  shortName: string;
  engineLabel: string;
  powerHp: number;
  maxTorqueNm: number;
  massKg: number;
  redlineRpm: number;
  topSpeedKmh: number;
  accel0to100Sec: number;
  dragCoefficient: number;
  downforceCoefficient: number;
  defaultPaintId: string;
  defaultFinish: PaintFinishType;
  defaultLivery: VinylLiveryId;
  chassisStyle: 'maranello_v12' | 'santagata_wedge' | 'woking_aero' | 'stuttgart_gt';
}

export const HYPERCAR_CATALOG: readonly HypercarModelSpec[] = [
  {
    id: 'ferrari_f80',
    brandTag: 'MARANELLO · ESTRELLA',
    name: 'Scuderia F80 V12 Apex',
    shortName: 'Scuderia F80 V12',
    engineLabel: '6.5L V12 + HY-KERS',
    powerHp: 1200,
    maxTorqueNm: 790,
    massKg: 1410,
    redlineRpm: 9200,
    topSpeedKmh: 352,
    accel0to100Sec: 2.15,
    dragCoefficient: 0.33,
    downforceCoefficient: 3.25,
    defaultPaintId: 'rosso_corsa',
    defaultFinish: 'gloss',
    defaultLivery: 'tricolore',
    chassisStyle: 'maranello_v12',
  },
  {
    id: 'lambo_revuelto',
    brandTag: 'SANT’AGATA · V12',
    name: 'Toro V12 Revuelto SVJ',
    shortName: 'Toro V12 SVJ',
    engineLabel: '6.5L V12 Aspirado AWD',
    powerHp: 1015,
    maxTorqueNm: 825,
    massKg: 1455,
    redlineRpm: 9500,
    topSpeedKmh: 348,
    accel0to100Sec: 2.25,
    dragCoefficient: 0.35,
    downforceCoefficient: 3.45,
    defaultPaintId: 'verde_mantis',
    defaultFinish: 'satin',
    defaultLivery: 'carbon_gt',
    chassisStyle: 'santagata_wedge',
  },
  {
    id: 'mclaren_w1',
    brandTag: 'WOKING · AERO EXTR',
    name: 'Woking W1 GTR Longtail',
    shortName: 'Woking W1 GTR',
    engineLabel: '4.0L V8 Twin-Turbo MHP',
    powerHp: 1258,
    maxTorqueNm: 775,
    massKg: 1355,
    redlineRpm: 9000,
    topSpeedKmh: 356,
    accel0to100Sec: 2.1,
    dragCoefficient: 0.31,
    downforceCoefficient: 3.85,
    defaultPaintId: 'giallo_modena',
    defaultFinish: 'gloss',
    defaultLivery: 'scuderia_16',
    chassisStyle: 'woking_aero',
  },
  {
    id: 'porsche_918',
    brandTag: 'STUTTGART · WEISSACH',
    name: 'Stuttgart 918 RSR Weissach',
    shortName: 'Stuttgart 918 RSR',
    engineLabel: '4.6L V8 + E-Axle',
    powerHp: 960,
    maxTorqueNm: 840,
    massKg: 1385,
    redlineRpm: 8900,
    topSpeedKmh: 344,
    accel0to100Sec: 2.2,
    dragCoefficient: 0.30,
    downforceCoefficient: 3.55,
    defaultPaintId: 'argento_platinum',
    defaultFinish: 'platinum',
    defaultLivery: 'scuderia_16',
    chassisStyle: 'stuttgart_gt',
  },
];

export function getHypercarSpec(carId: HypercarModelId): HypercarModelSpec {
  return HYPERCAR_CATALOG.find((c) => c.id === carId) || HYPERCAR_CATALOG[0];
}

export interface CircuitTrackSpec {
  id: CircuitTrackId;
  name: string;
  shortName: string;
  country: string;
  lengthKm: string;
  cornersCount: number;
  characterLabel: string;
  kerbPrimaryHex: number;
  kerbSecondaryHex: number;
  grassTintHex: number;
  controlPoints: readonly { x: number; z: number }[];
}

export const MONZA_CONTROL_POINTS: readonly { x: number; z: number }[] = [
  { x: 0, z: -210 },
  { x: 0, z: 0 },
  { x: 0, z: 210 },
  { x: 18, z: 255 },
  { x: 48, z: 280 },
  { x: 115, z: 300 },
  { x: 180, z: 250 },
  { x: 195, z: 185 },
  { x: 165, z: 130 },
  { x: 155, z: 50 },
  { x: 185, z: -20 },
  { x: 200, z: -105 },
  { x: 175, z: -195 },
  { x: 115, z: -250 },
  { x: 45, z: -260 },
];

export const MONACO_CONTROL_POINTS: readonly { x: number; z: number }[] = [
  { x: 0, z: -155 },
  { x: 0, z: 0 },
  { x: 0, z: 145 },
  { x: 35, z: 195 }, // Sainte Dévote
  { x: 105, z: 210 }, // Beau Rivage climb
  { x: 150, z: 155 }, // Massenet / Casino
  { x: 120, z: 95 }, // Mirabeau
  { x: 72, z: 75 }, // Fairmont Hairpin entry
  { x: 135, z: 35 }, // Hairpin exit -> Portier
  { x: 195, z: -25 }, // Tunnel fast arc
  { x: 165, z: -125 }, // Nouvelle Chicane
  { x: 95, z: -145 }, // Tabac / Swimming Pool
  { x: 48, z: -195 }, // La Rascasse
  { x: 14, z: -190 }, // Anthony Noghès
];

export const SPA_CONTROL_POINTS: readonly { x: number; z: number }[] = [
  { x: 0, z: -185 },
  { x: 0, z: 0 },
  { x: 0, z: 165 }, // La Source Hairpin
  { x: 52, z: 185 },
  { x: 75, z: 95 }, // Eau Rouge
  { x: 105, z: 25 }, // Raidillon crest
  { x: 195, z: -35 }, // Kemmel Straight
  { x: 245, z: -115 }, // Les Combes
  { x: 195, z: -185 }, // Bruxelles
  { x: 125, z: -145 }, // Pouhon double-apex
  { x: 145, z: -235 }, // Campus / Stavelot
  { x: 75, z: -265 }, // Blanchimont high-speed
  { x: 22, z: -235 }, // Bus Stop Chicane
];

export const SUZUKA_CONTROL_POINTS: readonly { x: number; z: number }[] = [
  { x: 0, z: -190 },
  { x: 0, z: 0 },
  { x: 0, z: 185 }, // First Corner
  { x: 55, z: 235 }, // S-Curves 1
  { x: 110, z: 190 }, // S-Curves 2
  { x: 165, z: 225 }, // Dunlop Curve
  { x: 225, z: 165 }, // Degner 1 & 2
  { x: 190, z: 65 }, // Crossover Underpass
  { x: 240, z: -15 }, // Hairpin Curve
  { x: 205, z: -135 }, // Spoon Curve entry
  { x: 135, z: -195 }, // Spoon exit -> Back straight
  { x: 75, z: -115 }, // 130R high speed
  { x: 32, z: -225 }, // Casio Triangle Chicane
];

export const CIRCUIT_CATALOG: readonly CircuitTrackSpec[] = [
  {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    shortName: 'Monza · Italia',
    country: 'Italia',
    lengthKm: '5.79 km',
    cornersCount: 11,
    characterLabel: 'Templo de la Velocidad · DRS 350+ km/h',
    kerbPrimaryHex: 0xd91c24,
    kerbSecondaryHex: 0xf1f5f9,
    grassTintHex: 0x162417,
    controlPoints: MONZA_CONTROL_POINTS,
  },
  {
    id: 'monaco',
    name: 'Circuit de Monte-Carlo',
    shortName: 'Mónaco · Riviera',
    country: 'Mónaco',
    lengthKm: '3.34 km',
    cornersCount: 19,
    characterLabel: 'Urbano Técnico · Horquilla Fairmont y Túnel',
    kerbPrimaryHex: 0xe11d2a,
    kerbSecondaryHex: 0xf8fafc,
    grassTintHex: 0x182026,
    controlPoints: MONACO_CONTROL_POINTS,
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    shortName: 'Spa · Bélgica',
    country: 'Bélgica',
    lengthKm: '7.00 km',
    cornersCount: 19,
    characterLabel: 'Eau Rouge, Kemmel y Bosque de las Ardenas',
    kerbPrimaryHex: 0xd91c24,
    kerbSecondaryHex: 0xfacc15,
    grassTintHex: 0x122216,
    controlPoints: SPA_CONTROL_POINTS,
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Circuit',
    shortName: 'Suzuka · Japón',
    country: 'Japón',
    lengthKm: '5.81 km',
    cornersCount: 18,
    characterLabel: 'Curvas S, Horquilla, Spoon y 130R a fondo',
    kerbPrimaryHex: 0xe11d2a,
    kerbSecondaryHex: 0xf1f5f9,
    grassTintHex: 0x172619,
    controlPoints: SUZUKA_CONTROL_POINTS,
  },
];

export function getCircuitSpec(trackId: CircuitTrackId): CircuitTrackSpec {
  return CIRCUIT_CATALOG.find((t) => t.id === trackId) || CIRCUIT_CATALOG[0];
}

// ============================================================================
// CUSTOMIZATION & SETTINGS CATALOGS
// ============================================================================

export interface CarCustomizationState {
  paintId: string;
  paintHex: string;
  flakeHex: string;
  finishType: PaintFinishType;
  rimColorId: string;
  rimHex: string;
  caliperColorId: string;
  caliperHex: string;
  vinylLivery: VinylLiveryId;
}

export interface GameSettingsState {
  selectedCarId: HypercarModelId;
  selectedTrackId: CircuitTrackId;
  quality: GraphicsQualityTier;
  dynamicResolution: boolean;
  showPerfOverlay: boolean;
  controlScheme: ControlSchemeType;
  steeringSensitivity: number; // 0.5 .. 1.8
  manualTransmission: boolean;
  lightingPreset: LightingCycleMode;
  masterVolume: number; // 0 .. 1
  hapticsEnabled: boolean;
  raceMode: RaceGameMode;
  botDifficulty: BotDifficultyTier;
}

export const PAINT_PRESETS = [
  {
    id: 'rosso_corsa',
    name: 'Rosso Corsa',
    hex: '#D4121E',
    flakeHex: '#FF5E4D',
  },
  {
    id: 'giallo_modena',
    name: 'Giallo Modena',
    hex: '#F5B700',
    flakeHex: '#FFF078',
  },
  {
    id: 'nero_carbonio',
    name: 'Nero Carbonio',
    hex: '#16181D',
    flakeHex: '#475569',
  },
  {
    id: 'bianco_avus',
    name: 'Bianco Avus',
    hex: '#EAECEF',
    flakeHex: '#FFFFFF',
  },
  {
    id: 'blu_tour_de_france',
    name: 'Blu Tour de France',
    hex: '#0F3C8A',
    flakeHex: '#60A5FA',
  },
  {
    id: 'verde_mantis',
    name: 'Verde Tricolore',
    hex: '#16A34A',
    flakeHex: '#86EFAC',
  },
  {
    id: 'argento_platinum',
    name: 'Argento Platinado',
    hex: '#94A3B8',
    flakeHex: '#F8FAFC',
  },
] as const;

export const FINISH_TYPE_SPECS: Record<
  PaintFinishType,
  {
    label: string;
    metalness: number;
    roughness: number;
    clearcoat: number;
    clearcoatRoughness: number;
  }
> = {
  gloss: {
    label: 'Brillante (Clearcoat RTX)',
    metalness: 0.72,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  },
  satin: {
    label: 'Satinado (Seda Metálica)',
    metalness: 0.78,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  },
  matte: {
    label: 'Mate (Stealth Racing)',
    metalness: 0.45,
    roughness: 0.58,
    clearcoat: 0.08,
    clearcoatRoughness: 0.48,
  },
  platinum: {
    label: 'Platinado (Cromo Espejo)',
    metalness: 0.96,
    roughness: 0.09,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  },
};

export const RIM_COLOR_PRESETS = [
  { id: 'forged_silver', name: 'Aluminio Forjado', hex: '#CBD5E1', metalness: 0.92, roughness: 0.18 },
  { id: 'oro_corsa', name: 'Oro Maranello', hex: '#D4AF37', metalness: 0.88, roughness: 0.22 },
  { id: 'nero_forgiato', name: 'Negro Satinado', hex: '#1E222A', metalness: 0.75, roughness: 0.32 },
  { id: 'bronzo_gt', name: 'Bronce Magnesio', hex: '#9A6B41', metalness: 0.86, roughness: 0.24 },
] as const;

export const CALIPER_COLOR_PRESETS = [
  { id: 'rosso_brembo', name: 'Rosso Scuderia', hex: '#E11D2A' },
  { id: 'giallo_brembo', name: 'Giallo Modena', hex: '#FACC15' },
  { id: 'verde_acido', name: 'Verde Ácido', hex: '#22C55E' },
  { id: 'azzurro_gt', name: 'Azzurro Hyper', hex: '#38BDF8' },
] as const;

export const VINYL_LIVERY_PRESETS: { id: VinylLiveryId; name: string; description: string }[] = [
  { id: 'none', name: 'Limpio (Puro)', description: 'Carrocería sin vinilos' },
  { id: 'tricolore', name: 'Franja Tricolore', description: 'Verde · Blanco · Rojo longitudinal' },
  { id: 'scuderia_16', name: 'Dorsal #16 GT', description: 'Doble franja de competición + #16' },
  { id: 'carbon_gt', name: 'Capó Carbono', description: 'Sección central en fibra de carbono' },
];

export const GRAPHICS_QUALITY_SPECS: Record<
  GraphicsQualityTier,
  {
    label: string;
    targetFpsLabel: string;
    targetFpsCap: number;
    pixelRatioCap: number;
    shadowMapSize: number;
    shadowsEnabled: boolean;
    drawDistanceFog: number;
    ssrWetnessBoost: number;
    treeWindAnimation: boolean;
    volumetricCloudLayers: number;
    lodBiasMultiplier: number;
  }
> = {
  baja: {
    label: 'Baja (30 FPS)',
    targetFpsLabel: '30 FPS · Gama Baja',
    targetFpsCap: 30,
    pixelRatioCap: 0.85,
    shadowMapSize: 512,
    shadowsEnabled: false,
    drawDistanceFog: 0.0028,
    ssrWetnessBoost: 0.5,
    treeWindAnimation: false,
    volumetricCloudLayers: 1,
    lodBiasMultiplier: 0.55,
  },
  media: {
    label: 'Media (60 FPS)',
    targetFpsLabel: '60 FPS · Gama Media',
    targetFpsCap: 60,
    pixelRatioCap: 1.15,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    drawDistanceFog: 0.002,
    ssrWetnessBoost: 0.8,
    treeWindAnimation: true,
    volumetricCloudLayers: 2,
    lodBiasMultiplier: 0.85,
  },
  alta: {
    label: 'Alta (60 FPS RTX)',
    targetFpsLabel: '60 FPS · Gama Alta',
    targetFpsCap: 60,
    pixelRatioCap: 1.5,
    shadowMapSize: 1536,
    shadowsEnabled: true,
    drawDistanceFog: 0.0015,
    ssrWetnessBoost: 1.0,
    treeWindAnimation: true,
    volumetricCloudLayers: 3,
    lodBiasMultiplier: 1.0,
  },
  ultra: {
    label: 'Ultra (Max RTX)',
    targetFpsLabel: '60+ FPS · Flagship',
    targetFpsCap: 60,
    pixelRatioCap: 2.0,
    shadowMapSize: 2048,
    shadowsEnabled: true,
    drawDistanceFog: 0.0012,
    ssrWetnessBoost: 1.15,
    treeWindAnimation: true,
    volumetricCloudLayers: 4,
    lodBiasMultiplier: 1.25,
  },
};

export const DEFAULT_CUSTOMIZATION: CarCustomizationState = {
  paintId: PAINT_PRESETS[0].id,
  paintHex: PAINT_PRESETS[0].hex,
  flakeHex: PAINT_PRESETS[0].flakeHex,
  finishType: 'gloss',
  rimColorId: RIM_COLOR_PRESETS[0].id,
  rimHex: RIM_COLOR_PRESETS[0].hex,
  caliperColorId: CALIPER_COLOR_PRESETS[1].id,
  caliperHex: CALIPER_COLOR_PRESETS[1].hex,
  vinylLivery: 'tricolore',
};

export const DEFAULT_GAME_SETTINGS: GameSettingsState = {
  selectedCarId: 'ferrari_f80',
  selectedTrackId: 'monza',
  quality: 'alta',
  dynamicResolution: true,
  showPerfOverlay: false,
  controlScheme: 'buttons',
  steeringSensitivity: 1.0,
  manualTransmission: false,
  lightingPreset: 'dynamic',
  masterVolume: 0.8,
  hapticsEnabled: true,
  raceMode: 'quick_race',
  botDifficulty: 'medio',
};

export interface PacejkaCoefficients {
  B: number; // Stiffness factor
  C: number; // Shape factor
  D: number; // Peak grip factor (mu)
  E: number; // Curvature factor
}

export const DRY_PACEJKA: PacejkaCoefficients = {
  B: 10.5,
  C: 1.9,
  D: 1.68, // High-grip slick hypercar tire on dry F1 tarmac
  E: 0.97,
};

export const WET_PACEJKA: PacejkaCoefficients = {
  B: 7.4,
  C: 1.85,
  D: 1.12, // Wet tarmac grip reduction (~33% less peak lateral/longitudinal force)
  E: 1.02,
};

export interface VehicleConfig {
  massKg: number;
  wheelbaseM: number;
  cgHeightM: number;
  frontWeightBias: number;
  dragCoefficient: number;
  frontalAreaM2: number;
  downforceCoefficient: number;
  drsDragReductionFactor: number;
  maxSteerAngleRad: number;
  maxBrakeForceN: number;
  idleRpm: number;
  redlineRpm: number;
  shiftUpRpm: number;
  shiftDownRpm: number;
  finalDriveRatio: number;
  gearRatios: readonly number[];
  wheelRadiusM: number;
}

export const HYPERCAR_FERRARI_CONFIG: VehicleConfig = {
  massKg: 1410,
  wheelbaseM: 2.68,
  cgHeightM: 0.44,
  frontWeightBias: 0.43,
  dragCoefficient: 0.33,
  frontalAreaM2: 1.95,
  downforceCoefficient: 3.25,
  drsDragReductionFactor: 0.76,
  maxSteerAngleRad: 0.52,
  maxBrakeForceN: 29500,
  idleRpm: 1100,
  redlineRpm: 9200,
  shiftUpRpm: 8750,
  shiftDownRpm: 4200,
  finalDriveRatio: 3.55,
  gearRatios: [3.15, 2.28, 1.76, 1.41, 1.16, 0.97, 0.82],
  wheelRadiusM: 0.35,
};

export function buildVehicleConfigForModel(carId: HypercarModelId): VehicleConfig {
  const spec = getHypercarSpec(carId);
  return {
    ...HYPERCAR_FERRARI_CONFIG,
    massKg: spec.massKg,
    dragCoefficient: spec.dragCoefficient,
    downforceCoefficient: spec.downforceCoefficient,
    redlineRpm: spec.redlineRpm,
    shiftUpRpm: spec.redlineRpm - 450,
  };
}

export interface VehicleInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (left is +1 in world yaw, right is -1)
  handbrake: boolean;
  absEnabled: boolean;
  tcsEnabled: boolean;
  surface: SurfaceCondition;
  manualTransmission?: boolean;
  shiftUpRequested?: boolean;
  shiftDownRequested?: boolean;
  steeringSensitivity?: number;
  crosswindSpeedMs?: number;
  carModelId?: HypercarModelId;
}

export interface VehicleState {
  x: number;
  z: number;
  headingRad: number;
  vxLocal: number; // Lateral velocity (m/s)
  vzLocal: number; // Forward velocity (m/s)
  yawRateRad: number;
  speedMs: number;
  speedKmh: number;
  gear: number; // 1..7
  rpm: number;
  steerAngleRad: number;
  wheelSpinRad: number;

  // Weight transfer & Aerodynamics
  frontAxleLoadN: number;
  rearAxleLoadN: number;
  downforceN: number;
  dragForceN: number;
  longitudinalG: number;
  lateralG: number;
  drsActive: boolean;
  wingAngleDeg: number;

  // Tire slip & assists
  slipAngleDeg: number;
  slipRatio: number;
  absActive: boolean;
  tcsActive: boolean;
  offTrack: boolean;

  // Brake disc thermal state
  brakeTempC: number;

  // Suspension & Collision Deformation
  pitchRad: number;
  rollRad: number;
  chassisIntegrity: number;
  collisionFlashTimer: number;
  lastCollisionImpactMs: number;
  deformationFrontLeft: number;
  deformationFrontRight: number;

  // Lap & Track progress
  trackProgress: number;
  currentLap: number;
  totalLaps: number;
  currentLapTimeMs: number;
  bestLapTimeMs: number | null;
  lastLapTimeMs: number | null;
  sectorIndex: 1 | 2 | 3;
  maxSpeedKmhReached: number;
  passedHalfway: boolean;
}

// ============================================================================
// PHASE 3 & 4: SKY / DAY-NIGHT CYCLE & VOLUMETRIC CLOUD / WIND ATMOSPHERE MODEL
// ============================================================================

export interface SkyAtmosphereState {
  timeHours: number; // 0 .. 24
  formattedClock: string; // e.g. "14:25"
  phaseLabel: 'DÍA SOLAR' | 'ATARDECER RTX' | 'NOCHE ESTELAR' | 'AMANECER';
  sunAngleRad: number;
  sunElevation: number; // -1 .. +1
  sunX: number;
  sunY: number;
  sunZ: number;
  moonX: number;
  moonY: number;
  moonZ: number;
  skyColorHex: number;
  horizonColorHex: number;
  sunLightColorHex: number;
  sunLightIntensity: number;
  hemiLightIntensity: number;
  cloudLitColorHex: number;
  cloudShadowColorHex: number;
  starfieldOpacity: number; // 0..1
  headlightsIntensity: number;
}

function lerpColorHex(hexA: number, hexB: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const rA = (hexA >> 16) & 0xff;
  const gA = (hexA >> 8) & 0xff;
  const bA = hexA & 0xff;

  const rB = (hexB >> 16) & 0xff;
  const gB = (hexB >> 8) & 0xff;
  const bB = hexB & 0xff;

  const r = Math.round(rA + (rB - rA) * clamped);
  const g = Math.round(gA + (gB - gA) * clamped);
  const b = Math.round(bA + (bB - bA) * clamped);

  return (r << 16) | (g << 8) | b;
}

/**
 * Pure calculation of the 24-hour celestial dome (Sun, Moon, Stars, Volumetric Cloud tint, Fog).
 */
export function evaluateSkyState(rawHours: number): SkyAtmosphereState {
  const timeHours = ((rawHours % 24) + 24) % 24;
  const wholeHours = Math.floor(timeHours);
  const mins = Math.floor((timeHours - wholeHours) * 60);
  const formattedClock = `${String(wholeHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

  // Sun peaks at 12:00 (elevation = +1), sets at 18:00 (0), lowest at 00:00 (-1), rises at 06:00 (0)
  const sunAngleRad = ((timeHours - 6) / 24) * Math.PI * 2;
  const sunElevation = Math.sin(sunAngleRad);
  const sunHorizontal = Math.cos(sunAngleRad);

  const orbitRadius = 320;
  const sunX = sunHorizontal * orbitRadius;
  const sunY = sunElevation * orbitRadius;
  const sunZ = -95;

  // Moon is opposite the Sun
  const moonX = -sunX;
  const moonY = -sunY;
  const moonZ = 95;

  let phaseLabel: SkyAtmosphereState['phaseLabel'] = 'DÍA SOLAR';
  if (sunElevation < -0.12) {
    phaseLabel = 'NOCHE ESTELAR';
  } else if (sunElevation < 0.28) {
    phaseLabel = timeHours >= 12 ? 'ATARDECER RTX' : 'AMANECER';
  }

  // Blend factors
  const dayFactor = Math.max(0, Math.min(1, (sunElevation + 0.05) / 0.55));
  const twilightFactor = Math.max(
    0,
    1 - Math.abs(sunElevation - 0.06) / 0.34
  );
  const starfieldOpacity = Math.max(0, Math.min(1, (-sunElevation + 0.12) / 0.35));

  const nightSky = 0x03050a;
  const daySky = 0x1e569b;
  const sunsetSky = 0x3b183a;

  let skyColorHex = lerpColorHex(nightSky, daySky, dayFactor);
  skyColorHex = lerpColorHex(skyColorHex, sunsetSky, twilightFactor * 0.85);

  const nightHorizon = 0x060913;
  const dayHorizon = 0x5c9bd6;
  const sunsetHorizon = 0xd95326;

  let horizonColorHex = lerpColorHex(nightHorizon, dayHorizon, dayFactor);
  horizonColorHex = lerpColorHex(horizonColorHex, sunsetHorizon, twilightFactor * 0.9);

  const nightLight = 0x6c8ef2;
  const dayLight = 0xfff5e0;
  const sunsetLight = 0xff773d;

  let sunLightColorHex = lerpColorHex(nightLight, dayLight, dayFactor);
  sunLightColorHex = lerpColorHex(sunLightColorHex, sunsetLight, twilightFactor);

  const cloudLitColorHex = lerpColorHex(
    0x162032,
    lerpColorHex(0xffffff, 0xfb923c, twilightFactor * 0.85),
    Math.max(0.12, dayFactor)
  );
  const cloudShadowColorHex = lerpColorHex(0x090e1a, 0x64748b, dayFactor);

  const sunLightIntensity = 0.24 + dayFactor * 2.45 + twilightFactor * 0.45;
  const hemiLightIntensity = 0.16 + dayFactor * 0.92;
  const headlightsIntensity = sunElevation < 0.15 ? 6.4 : 3.2;

  return {
    timeHours,
    formattedClock,
    phaseLabel,
    sunAngleRad,
    sunElevation,
    sunX,
    sunY,
    sunZ,
    moonX,
    moonY,
    moonZ,
    skyColorHex,
    horizonColorHex,
    sunLightColorHex,
    sunLightIntensity,
    hemiLightIntensity,
    cloudLitColorHex,
    cloudShadowColorHex,
    starfieldOpacity,
    headlightsIntensity,
  };
}

export interface WindState {
  speedKmh: number;
  directionDeg: number;
  crosswindMs: number;
  gustFactor: number;
  wavePhase: number;
}

export function evaluateWindState(elapsedSec: number): WindState {
  const gustFactor = 0.65 + 0.35 * Math.sin(elapsedSec * 0.45) * Math.cos(elapsedSec * 0.19);
  const speedKmh = 18 + gustFactor * 16; // 18 .. 34 km/h
  const directionDeg = (245 + Math.sin(elapsedSec * 0.12) * 28 + 360) % 360;
  const crosswindMs = (speedKmh / 3.6) * Math.sin((directionDeg * Math.PI) / 180);
  return {
    speedKmh,
    directionDeg,
    crosswindMs,
    gustFactor,
    wavePhase: elapsedSec * (2.2 + gustFactor * 1.1),
  };
}

// ============================================================================
// PHASE 3 & 4: AI BOT RIVALS (Toro V10, Woking P1, Stuttgart 918)
// ============================================================================

export interface BotVehicleState {
  id: string;
  name: string;
  brandColorHex: string;
  flakeHex: string;
  x: number;
  z: number;
  headingRad: number;
  speedMs: number;
  speedKmh: number;
  trackProgress: number; // 0..1
  currentLap: number;
  laneOffsetM: number; // lateral offset from centerline (-5..+5)
  targetLaneOffsetM: number;
  basePaceFactor: number;
  wheelSpinRad: number;
  steerAngleRad: number;
  isBraking: boolean;
}

export const BOT_DIFFICULTY_MULTIPLIERS: Record<BotDifficultyTier, number> = {
  facil: 0.76,
  medio: 0.87,
  dificil: 0.96,
  pro: 1.04,
};

export function createInitialBots(
  samples: readonly TrackSample[]
): BotVehicleState[] {
  const botConfigs = [
    {
      id: 'bot_toro',
      name: 'Toro V10 Huracán',
      brandColorHex: '#16A34A',
      flakeHex: '#86EFAC',
      startProgress: 0.092,
      laneOffsetM: -3.2,
      basePaceFactor: 0.97,
    },
    {
      id: 'bot_woking',
      name: 'Woking P1 GTR',
      brandColorHex: '#F97316',
      flakeHex: '#FDBA74',
      startProgress: 0.108,
      laneOffsetM: 3.1,
      basePaceFactor: 1.0,
    },
    {
      id: 'bot_stuttgart',
      name: 'Stuttgart 918 GT',
      brandColorHex: '#0284C7',
      flakeHex: '#7DD3FC',
      startProgress: 0.124,
      laneOffsetM: -3.0,
      basePaceFactor: 1.025,
    },
  ];

  return botConfigs.map((cfg) => {
    const idx = Math.floor(cfg.startProgress * samples.length) % samples.length;
    const pt = samples[idx];
    const rightX = pt.tz;
    const rightZ = -pt.tx;
    return {
      id: cfg.id,
      name: cfg.name,
      brandColorHex: cfg.brandColorHex,
      flakeHex: cfg.flakeHex,
      x: pt.x + rightX * cfg.laneOffsetM,
      z: pt.z + rightZ * cfg.laneOffsetM,
      headingRad: Math.atan2(pt.tx, pt.tz),
      speedMs: 0,
      speedKmh: 0,
      trackProgress: cfg.startProgress,
      currentLap: 1,
      laneOffsetM: cfg.laneOffsetM,
      targetLaneOffsetM: cfg.laneOffsetM,
      basePaceFactor: cfg.basePaceFactor,
      wheelSpinRad: 0,
      steerAngleRad: 0,
      isBraking: false,
    };
  });
}

function getSampleAtNormalizedProgress(
  samples: readonly TrackSample[],
  tNorm: number
): TrackSample {
  const wrapped = ((tNorm % 1) + 1) % 1;
  const fIdx = wrapped * samples.length;
  const idx0 = Math.floor(fIdx) % samples.length;
  const idx1 = (idx0 + 1) % samples.length;
  const frac = fIdx - Math.floor(fIdx);
  const s0 = samples[idx0];
  const s1 = samples[idx1];
  return {
    x: s0.x + (s1.x - s0.x) * frac,
    z: s0.z + (s1.z - s0.z) * frac,
    tx: s0.tx + (s1.tx - s0.tx) * frac,
    tz: s0.tz + (s1.tz - s0.tz) * frac,
    lengthAccum: s0.lengthAccum + (s1.lengthAccum - s0.lengthAccum) * frac,
    t: wrapped,
  };
}

/**
 * Advances all AI Bot rivals along the circuit spline with lookahead corner braking,
 * dynamic lane switching, and difficulty scaling.
 */
export function stepBotVehicles(
  bots: readonly BotVehicleState[],
  player: VehicleState,
  dtSeconds: number,
  samples: readonly TrackSample[],
  difficulty: BotDifficultyTier,
  surface: SurfaceCondition
): BotVehicleState[] {
  const dt = Math.min(Math.max(dtSeconds, 0.001), 0.05);
  const totalTrackLen =
    samples.length > 1 ? samples[samples.length - 1].lengthAccum + 12 : 1650;
  const diffMult = BOT_DIFFICULTY_MULTIPLIERS[difficulty] ?? 0.87;
  const surfaceMult = surface === 'wet' ? 0.84 : 1.0;

  return bots.map((bot, botIdx) => {
    const sampleNow = getSampleAtNormalizedProgress(samples, bot.trackProgress);
    const sampleAhead1 = getSampleAtNormalizedProgress(
      samples,
      bot.trackProgress + 0.025
    );
    const sampleAhead2 = getSampleAtNormalizedProgress(
      samples,
      bot.trackProgress + 0.055
    );

    const dot1 = sampleNow.tx * sampleAhead1.tx + sampleNow.tz * sampleAhead1.tz;
    const dot2 = sampleAhead1.tx * sampleAhead2.tx + sampleAhead1.tz * sampleAhead2.tz;
    const curvature = Math.max(0, 1 - Math.min(dot1, dot2));

    const maxStraightMs = 76;
    const minCornerMs = 31;
    const rawTargetMs =
      maxStraightMs - Math.min(1, Math.sqrt(curvature * 4.2)) * (maxStraightMs - minCornerMs);

    const targetSpeedMs =
      rawTargetMs * bot.basePaceFactor * diffMult * surfaceMult;

    let speedMs = bot.speedMs;
    const isBraking = speedMs > targetSpeedMs + 1.8;
    if (speedMs < targetSpeedMs) {
      speedMs = Math.min(targetSpeedMs, speedMs + 17.5 * diffMult * dt);
    } else {
      speedMs = Math.max(targetSpeedMs, speedMs - 26.0 * dt);
    }

    let targetLane = bot.targetLaneOffsetM;
    const dxPlayer = player.x - bot.x;
    const dzPlayer = player.z - bot.z;
    const distSqPlayer = dxPlayer * dxPlayer + dzPlayer * dzPlayer;
    if (distSqPlayer < 160) {
      targetLane = botIdx % 2 === 0 ? -3.6 : 3.6;
    }

    const laneOffsetM =
      bot.laneOffsetM + (targetLane - bot.laneOffsetM) * Math.min(1, dt * 2.5);

    const deltaProgress = (speedMs * dt) / totalTrackLen;
    let nextProgress = bot.trackProgress + deltaProgress;
    let currentLap = bot.currentLap;
    if (nextProgress >= 1.0) {
      nextProgress -= 1.0;
      currentLap += 1;
    }

    const nextSample = getSampleAtNormalizedProgress(samples, nextProgress);
    const rightX = nextSample.tz;
    const rightZ = -nextSample.tx;

    const nextX = nextSample.x + rightX * laneOffsetM;
    const nextZ = nextSample.z + rightZ * laneOffsetM;

    const moveDx = nextX - bot.x;
    const moveDz = nextZ - bot.z;
    const headingRad =
      moveDx * moveDx + moveDz * moveDz > 0.0001
        ? Math.atan2(moveDx, moveDz)
        : Math.atan2(nextSample.tx, nextSample.tz);

    const crossTurn =
      sampleNow.tx * sampleAhead1.tz - sampleNow.tz * sampleAhead1.tx;
    const steerAngleRad = Math.max(-0.4, Math.min(0.4, -crossTurn * 1.4));

    return {
      ...bot,
      x: nextX,
      z: nextZ,
      headingRad,
      speedMs,
      speedKmh: speedMs * 3.6,
      trackProgress: nextProgress,
      currentLap,
      laneOffsetM,
      targetLaneOffsetM: targetLane,
      wheelSpinRad: (bot.wheelSpinRad + (speedMs / 0.35) * dt) % (Math.PI * 2),
      steerAngleRad,
      isBraking,
    };
  });
}

/**
 * Computes the player's overall race position (1 .. bots.length + 1)
 * based on total distance completed (currentLap + normalized trackProgress).
 */
export function computeRacePosition(
  player: VehicleState,
  bots: readonly BotVehicleState[]
): number {
  const wrapProgress = (p: number) => (p < 0.05 ? p + 1.0 : p);
  const playerScore = player.currentLap * 10 + wrapProgress(player.trackProgress);

  let position = 1;
  for (const b of bots) {
    const botScore = b.currentLap * 10 + wrapProgress(b.trackProgress);
    if (botScore > playerScore) {
      position += 1;
    }
  }
  return position;
}

// ============================================================================
// CORE PACEJKA & VEHICLE DYNAMICS
// ============================================================================

export function evaluatePacejkaNormalized(
  slip: number,
  coeff: PacejkaCoefficients
): number {
  const { B, C, D, E } = coeff;
  const bx = B * slip;
  return D * Math.sin(C * Math.atan(bx - E * (bx - Math.atan(bx))));
}

export function evaluateCombinedPacejkaGrip(
  slipRatio: number,
  slipAngleRad: number,
  normalLoadN: number,
  coeff: PacejkaCoefficients
): { fx: number; fy: number } {
  const eps = 1e-5;
  const rawFxNorm = evaluatePacejkaNormalized(slipRatio, coeff);
  const rawFyNorm = evaluatePacejkaNormalized(slipAngleRad, coeff);

  const mag = Math.hypot(rawFxNorm, rawFyNorm);
  const peakAllowed = coeff.D;

  let scale = 1.0;
  if (mag > peakAllowed && mag > eps) {
    scale = peakAllowed / mag;
  }

  return {
    fx: rawFxNorm * scale * normalLoadN,
    fy: rawFyNorm * scale * normalLoadN,
  };
}

export function evaluateEngineTorqueNm(
  rpm: number,
  carId: HypercarModelId = 'ferrari_f80'
): number {
  const spec = getHypercarSpec(carId);
  const clamped = Math.max(1000, Math.min(9600, rpm));
  const norm = (clamped - 1000) / (spec.redlineRpm - 1000);
  const basePeak = spec.maxTorqueNm;
  // Broad hybrid/V12 torque curve peaking around 65% of RPM range
  return basePeak * (0.66 + 0.34 * Math.sin(Math.min(1, norm) * Math.PI * 0.86));
}

export interface TrackSample {
  x: number;
  z: number;
  tx: number;
  tz: number;
  lengthAccum: number;
  t: number;
}

export const TRACK_WIDTH_M = 14.5;

function catmullRomPoint(
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  p3: { x: number; z: number },
  t: number
): { x: number; z: number } {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const z =
    0.5 *
    (2 * p1.z +
      (-p0.z + p2.z) * t +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);
  return { x, z };
}

export function buildTrackSamples(
  subdivisionsPerSegment = 24,
  trackId: CircuitTrackId = 'monza'
): TrackSample[] {
  const pts = getCircuitSpec(trackId).controlPoints;
  const n = pts.length;
  const rawPoints: { x: number; z: number }[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < subdivisionsPerSegment; s++) {
      const u = s / subdivisionsPerSegment;
      rawPoints.push(catmullRomPoint(p0, p1, p2, p3, u));
    }
  }

  const totalPts = rawPoints.length;
  const samples: TrackSample[] = [];
  let accum = 0;

  for (let i = 0; i < totalPts; i++) {
    const curr = rawPoints[i];
    const next = rawPoints[(i + 1) % totalPts];
    if (i > 0) {
      const prev = rawPoints[i - 1];
      accum += Math.hypot(curr.x - prev.x, curr.z - prev.z);
    }
    const dx = next.x - curr.x;
    const dz = next.z - curr.z;
    const len = Math.hypot(dx, dz) || 1;
    samples.push({
      x: curr.x,
      z: curr.z,
      tx: dx / len,
      tz: dz / len,
      lengthAccum: accum,
      t: i / totalPts,
    });
  }

  return samples;
}

export function findClosestTrackSample(
  x: number,
  z: number,
  samples: readonly TrackSample[]
): { sample: TrackSample; distance: number; index: number } {
  let bestIdx = 0;
  let bestDistSq = Infinity;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const dx = x - s.x;
    const dz = z - s.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }

  return {
    sample: samples[bestIdx],
    distance: Math.sqrt(bestDistSq),
    index: bestIdx,
  };
}

export function createInitialVehicleState(
  trackId: CircuitTrackId = 'monza',
  carId: HypercarModelId = 'ferrari_f80'
): VehicleState {
  const cfg = buildVehicleConfigForModel(carId);
  const g = 9.81;
  const staticWeight = cfg.massKg * g;
  const startPt = getCircuitSpec(trackId).controlPoints[1];

  return {
    x: startPt.x,
    z: startPt.z,
    headingRad: 0,
    vxLocal: 0,
    vzLocal: 0,
    yawRateRad: 0,
    speedMs: 0,
    speedKmh: 0,
    gear: 1,
    rpm: cfg.idleRpm,
    steerAngleRad: 0,
    wheelSpinRad: 0,

    frontAxleLoadN: staticWeight * cfg.frontWeightBias,
    rearAxleLoadN: staticWeight * (1 - cfg.frontWeightBias),
    downforceN: 0,
    dragForceN: 0,
    longitudinalG: 0,
    lateralG: 0,
    drsActive: false,
    wingAngleDeg: 8,

    slipAngleDeg: 0,
    slipRatio: 0,
    absActive: false,
    tcsActive: false,
    offTrack: false,

    brakeTempC: 185,
    pitchRad: 0,
    rollRad: 0,
    chassisIntegrity: 100,
    collisionFlashTimer: 0,
    lastCollisionImpactMs: 0,
    deformationFrontLeft: 0,
    deformationFrontRight: 0,

    trackProgress: 0.068,
    currentLap: 1,
    totalLaps: 3,
    currentLapTimeMs: 0,
    bestLapTimeMs: null,
    lastLapTimeMs: null,
    sectorIndex: 1,
    maxSpeedKmhReached: 0,
    passedHalfway: false,
  };
}

export function stepVehiclePhysics(
  state: VehicleState,
  input: VehicleInput,
  dtSeconds: number,
  samples: readonly TrackSample[],
  baseConfig: VehicleConfig = HYPERCAR_FERRARI_CONFIG
): VehicleState {
  const dt = Math.min(Math.max(dtSeconds, 0.001), 0.05);
  const g = 9.81;
  const airDensity = 1.225;

  const activeCarId = input.carModelId ?? 'ferrari_f80';
  const config = input.carModelId
    ? buildVehicleConfigForModel(input.carModelId)
    : baseConfig;

  const pacejka = input.surface === 'wet' ? WET_PACEJKA : DRY_PACEJKA;

  const sensitivity = Math.max(0.5, Math.min(1.8, input.steeringSensitivity ?? 1.0));
  const speedRatio = Math.min(state.speedKmh / 330, 1);
  const maxEffectiveSteer =
    config.maxSteerAngleRad * (1 - 0.68 * speedRatio) * Math.min(1.25, sensitivity);
  const targetSteer =
    Math.max(-1, Math.min(1, input.steer)) * maxEffectiveSteer;
  const steerRate = 7.5 * sensitivity;
  const steerAngleRad =
    state.steerAngleRad +
    (targetSteer - state.steerAngleRad) * Math.min(1, steerRate * dt);

  const speedSq = state.vzLocal * state.vzLocal;
  const speedKmhPrev = state.speedKmh;

  const drsActive =
    speedKmhPrev > 145 &&
    input.throttle > 0.72 &&
    input.brake < 0.05 &&
    Math.abs(steerAngleRad) < 0.065;

  const airbrakeActive = speedKmhPrev > 100 && input.brake > 0.45;
  const targetWingDeg = drsActive ? 2 : airbrakeActive ? 34 : 11;
  const wingAngleDeg =
    state.wingAngleDeg + (targetWingDeg - state.wingAngleDeg) * Math.min(1, 10 * dt);

  const effectiveDragCoeff = drsActive
    ? config.dragCoefficient * config.drsDragReductionFactor
    : airbrakeActive
    ? config.dragCoefficient * 1.45
    : config.dragCoefficient;

  const effectiveDownforceCoeff = drsActive
    ? config.downforceCoefficient * 0.72
    : airbrakeActive
    ? config.downforceCoefficient * 1.32
    : config.downforceCoefficient;

  const downforceN =
    0.5 * airDensity * effectiveDownforceCoeff * config.frontalAreaM2 * speedSq;
  const dragForceN =
    0.5 * airDensity * effectiveDragCoeff * config.frontalAreaM2 * speedSq;

  const staticWeightN = config.massKg * g;
  const longitudinalTransferN =
    (config.massKg * (state.longitudinalG * g) * config.cgHeightM) /
    config.wheelbaseM;

  const frontAxleLoadN = Math.max(
    1500,
    staticWeightN * config.frontWeightBias +
      downforceN * 0.44 -
      longitudinalTransferN
  );
  const rearAxleLoadN = Math.max(
    1800,
    staticWeightN * (1 - config.frontWeightBias) +
      downforceN * 0.56 +
      longitudinalTransferN
  );

  let gear = state.gear;
  const gearRatio = config.gearRatios[gear - 1];
  const wheelAngularVel = Math.max(0, state.vzLocal) / config.wheelRadiusM;
  const computedRpm =
    (wheelAngularVel * gearRatio * config.finalDriveRatio * 60) / (2 * Math.PI);

  let rpm = Math.max(
    config.idleRpm,
    Math.min(config.redlineRpm + 250, computedRpm)
  );

  if (state.vzLocal < 3 && input.throttle > 0.05) {
    rpm = Math.max(rpm, config.idleRpm + input.throttle * 4200);
  }

  if (input.manualTransmission) {
    if (input.shiftUpRequested && gear < config.gearRatios.length) {
      gear += 1;
    } else if (input.shiftDownRequested && gear > 1) {
      gear -= 1;
    }
  } else {
    if (
      rpm >= config.shiftUpRpm &&
      gear < config.gearRatios.length &&
      input.throttle > 0.25
    ) {
      gear += 1;
      rpm *= config.gearRatios[gear - 1] / gearRatio;
    } else if (rpm <= config.shiftDownRpm && gear > 1 && state.vzLocal > 4) {
      gear -= 1;
      rpm *= config.gearRatios[gear - 1] / gearRatio;
    }
  }

  const engineTorque = evaluateEngineTorqueNm(rpm, activeCarId);
  const drivelineEfficiency = 0.91;
  const rawDriveForceN =
    (input.throttle *
      engineTorque *
      config.gearRatios[gear - 1] *
      config.finalDriveRatio *
      drivelineEfficiency) /
    config.wheelRadiusM;

  const rawBrakeForceN = input.brake * config.maxBrakeForceN;
  const handbrakeForceN = input.handbrake ? 11000 : 0;

  const closest = findClosestTrackSample(state.x, state.z, samples);
  const halfTrack = TRACK_WIDTH_M * 0.5;
  const offTrack = closest.distance > halfTrack;
  const offTrackGripPenalty = offTrack ? 0.68 : 1.0;

  const maxRearTractionN = rearAxleLoadN * pacejka.D * offTrackGripPenalty;
  const maxTotalBrakeN =
    (frontAxleLoadN + rearAxleLoadN) * pacejka.D * offTrackGripPenalty;

  let tcsActive = false;
  let effectiveDriveForceN = rawDriveForceN;
  let slipRatio = rawDriveForceN / Math.max(1, maxRearTractionN) * 0.14;

  if (rawDriveForceN > maxRearTractionN) {
    if (input.tcsEnabled) {
      tcsActive = true;
      effectiveDriveForceN = maxRearTractionN * 0.98;
      slipRatio = 0.11;
    } else {
      effectiveDriveForceN = maxRearTractionN * 0.78;
      slipRatio = 0.35;
    }
  }

  let absActive = false;
  let effectiveBrakeForceN = rawBrakeForceN;
  if (rawBrakeForceN > maxTotalBrakeN && state.vzLocal > 2.5) {
    if (input.absEnabled) {
      absActive = true;
      effectiveBrakeForceN = maxTotalBrakeN * 0.97;
      slipRatio = -0.12;
    } else {
      effectiveBrakeForceN = maxTotalBrakeN * 0.74;
      slipRatio = -0.45;
    }
  } else if (rawBrakeForceN > 100) {
    slipRatio = -(rawBrakeForceN / Math.max(1, maxTotalBrakeN)) * 0.11;
  }

  const rollingResistanceN = (offTrack ? 950 : 260) + state.vzLocal * 5.2;
  const netForwardForceN =
    effectiveDriveForceN -
    (state.vzLocal > 0.2 ? effectiveBrakeForceN + handbrakeForceN : 0) -
    dragForceN -
    rollingResistanceN;

  const forwardAccelMs2 = netForwardForceN / config.massKg;
  let vzLocal = Math.max(0, state.vzLocal + forwardAccelMs2 * dt);

  if (vzLocal < 0.15 && input.throttle < 0.01) {
    vzLocal = 0;
  }

  const forwardRef = Math.max(4.0, vzLocal);
  const rawSlipAngleRad =
    steerAngleRad - Math.atan2(state.vxLocal, forwardRef) * 0.65;

  const { fy: lateralForceN } = evaluateCombinedPacejkaGrip(
    slipRatio,
    rawSlipAngleRad,
    (frontAxleLoadN + rearAxleLoadN) * offTrackGripPenalty,
    pacejka
  );

  const lateralAccelMs2 = lateralForceN / config.massKg;
  const targetYawRate =
    vzLocal > 0.3
      ? (vzLocal / config.wheelbaseM) * Math.tan(steerAngleRad)
      : 0;

  const gripCompliance =
    (input.surface === 'wet' ? 0.72 : 0.96) *
    offTrackGripPenalty *
    (input.handbrake ? 0.55 : 1.0);

  const yawRateRad =
    state.yawRateRad +
    (targetYawRate * gripCompliance - state.yawRateRad) * Math.min(1, 10 * dt);

  const crosswindMs = input.crosswindSpeedMs ?? 3.8;
  const windLateralForceN =
    0.5 * airDensity * 0.55 * 2.1 * crosswindMs * Math.abs(crosswindMs) * (vzLocal / 65);
  const windDrift = (windLateralForceN / config.massKg) * dt;

  const targetVxLocal =
    vzLocal * Math.sin(rawSlipAngleRad) * (1 - gripCompliance) * 0.48 +
    windDrift;
  const vxLocal =
    state.vxLocal + (targetVxLocal - state.vxLocal) * Math.min(1, 8.5 * dt);

  let headingRad = state.headingRad + yawRateRad * dt;

  const sinH = Math.sin(headingRad);
  const cosH = Math.cos(headingRad);

  const worldVx = vzLocal * sinH + vxLocal * cosH;
  const worldVz = vzLocal * cosH - vxLocal * sinH;

  let nextX = state.x + worldVx * dt;
  let nextZ = state.z + worldVz * dt;

  const nextClosest = findClosestTrackSample(nextX, nextZ, samples);
  const maxBarrierRadius = halfTrack + 3.4;

  let chassisIntegrity = state.chassisIntegrity;
  let collisionFlashTimer = Math.max(0, state.collisionFlashTimer - dt);
  let lastCollisionImpactMs = state.lastCollisionImpactMs;
  let deformationFrontLeft = state.deformationFrontLeft;
  let deformationFrontRight = state.deformationFrontRight;

  if (nextClosest.distance > maxBarrierRadius) {
    const s = nextClosest.sample;
    const dx = nextX - s.x;
    const dz = nextZ - s.z;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;

    nextX = s.x + nx * (maxBarrierRadius - 0.15);
    nextZ = s.z + nz * (maxBarrierRadius - 0.15);

    const impactSeverity = Math.max(0, vzLocal - 6);
    if (impactSeverity > 2.5 && collisionFlashTimer <= 0.05) {
      collisionFlashTimer = 0.35;
      lastCollisionImpactMs = impactSeverity;
      chassisIntegrity = Math.max(
        25,
        chassisIntegrity - Math.min(18, impactSeverity * 0.32)
      );
      const crossSide = dx * s.tz - dz * s.tx;
      if (crossSide >= 0) {
        deformationFrontRight = Math.min(1, deformationFrontRight + impactSeverity * 0.018);
      } else {
        deformationFrontLeft = Math.min(1, deformationFrontLeft + impactSeverity * 0.018);
      }
    }

    vzLocal *= 0.84;
    const trackHeading = Math.atan2(s.tx, s.tz);
    let angleDiff = trackHeading - headingRad;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    headingRad += angleDiff * 0.32;
  }

  const speedMs = Math.hypot(vzLocal, vxLocal);
  const speedKmh = speedMs * 3.6;

  const longitudinalG = forwardAccelMs2 / g;
  const lateralG = (yawRateRad * vzLocal) / g;

  const targetPitch = Math.max(-0.045, Math.min(0.055, -longitudinalG * 0.022));
  const targetRoll = Math.max(-0.06, Math.min(0.06, lateralG * 0.024));

  const pitchRad =
    state.pitchRad + (targetPitch - state.pitchRad) * Math.min(1, 12 * dt);
  const rollRad =
    state.rollRad + (targetRoll - state.rollRad) * Math.min(1, 12 * dt);

  const heatInput =
    effectiveBrakeForceN > 500 && vzLocal > 2
      ? (effectiveBrakeForceN * vzLocal * 0.00048) * dt
      : 0;
  const airCooling = (state.brakeTempC - 160) * (0.14 + speedRatio * 0.45) * dt;
  const brakeTempC = Math.max(
    160,
    Math.min(940, state.brakeTempC + heatInput - airCooling)
  );

  const wheelSpinRad =
    (state.wheelSpinRad + (vzLocal / config.wheelRadiusM) * dt) % (Math.PI * 2);

  const prevProgress = state.trackProgress;
  const newProgress = nextClosest.sample.t;

  let passedHalfway = state.passedHalfway;
  if (newProgress > 0.42 && newProgress < 0.65) {
    passedHalfway = true;
  }

  let currentLap = state.currentLap;
  let currentLapTimeMs = state.currentLapTimeMs + dt * 1000;
  let lastLapTimeMs = state.lastLapTimeMs;
  let bestLapTimeMs = state.bestLapTimeMs;

  const startLineProgress = 0.068;
  const crossedFinish =
    passedHalfway &&
    prevProgress < startLineProgress &&
    newProgress >= startLineProgress &&
    currentLapTimeMs > 8000;

  if (crossedFinish) {
    lastLapTimeMs = currentLapTimeMs;
    if (bestLapTimeMs === null || currentLapTimeMs < bestLapTimeMs) {
      bestLapTimeMs = currentLapTimeMs;
    }
    currentLap += 1;
    currentLapTimeMs = 0;
    passedHalfway = false;
  }

  const sectorIndex: 1 | 2 | 3 =
    newProgress < 0.36 ? 1 : newProgress < 0.7 ? 2 : 3;

  return {
    x: nextX,
    z: nextZ,
    headingRad,
    vxLocal,
    vzLocal,
    yawRateRad,
    speedMs,
    speedKmh,
    gear,
    rpm,
    steerAngleRad,
    wheelSpinRad,

    frontAxleLoadN,
    rearAxleLoadN,
    downforceN,
    dragForceN,
    longitudinalG,
    lateralG,
    drsActive,
    wingAngleDeg,

    slipAngleDeg: (rawSlipAngleRad * 180) / Math.PI,
    slipRatio,
    absActive,
    tcsActive,
    offTrack,

    brakeTempC,
    pitchRad,
    rollRad,
    chassisIntegrity,
    collisionFlashTimer,
    lastCollisionImpactMs,
    deformationFrontLeft,
    deformationFrontRight,

    trackProgress: newProgress,
    currentLap,
    totalLaps: state.totalLaps,
    currentLapTimeMs,
    bestLapTimeMs,
    lastLapTimeMs,
    sectorIndex,
    maxSpeedKmhReached: Math.max(state.maxSpeedKmhReached, speedKmh),
    passedHalfway,
  };
}

export function formatLapTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) {
    return '--:--.---';
  }
  const totalMs = Math.floor(ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;

  const minStr = String(minutes).padStart(1, '0');
  const secStr = String(seconds).padStart(2, '0');
  const msStr = String(millis).padStart(3, '0');
  return `${minStr}:${secStr}.${msStr}`;
}
