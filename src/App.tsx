import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BotVehicleState,
  buildTrackSamples,
  CarCustomizationState,
  computeRacePosition,
  createInitialBots,
  createInitialVehicleState,
  DEFAULT_CUSTOMIZATION,
  DEFAULT_GAME_SETTINGS,
  evaluateSkyState,
  evaluateWindState,
  GameSettingsState,
  GRAPHICS_QUALITY_SPECS,
  LightingCycleMode,
  SkyAtmosphereState,
  stepBotVehicles,
  stepVehiclePhysics,
  SurfaceCondition,
  TrackSample,
  VehicleInput,
  VehicleState,
  WindState,
} from './game/physics';
import {
  applyCarCustomization,
  applyHypercarModelStyle,
  BotCarRig,
  buildBotHypercarRigs,
  buildHypercarRig,
  buildMonzaCircuitScene,
  CircuitEnvironment,
  HypercarRig,
  setHypercarLodLevel,
  updateCircuitEnvironmentForTrack,
} from './game/sceneBuilder';
import { racingAudio } from './game/audio';
import { TitleScreenOverlay } from './components/TitleScreenOverlay';
import {
  CameraMode,
  DevicePerfStats,
  RacingHudOverlay,
} from './components/RacingHudOverlay';
import { UnityBlueprintModal } from './components/UnityBlueprintModal';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

// Module-scope reusable math scratch objects (Zero GC inside requestAnimationFrame)
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _smoothedLookAt = new THREE.Vector3();
const _carForward = new THREE.Vector3();
const _carRight = new THREE.Vector3();
const _dummyMat = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyEuler = new THREE.Euler();

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
}

export default function App() {
  const initialSamples = useMemo(() => buildTrackSamples(24, 'monza'), []);

  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<GameState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [customization, setCustomization] =
    useState<CarCustomizationState>(DEFAULT_CUSTOMIZATION);
  const [settings, setSettings] = useState<GameSettingsState>(DEFAULT_GAME_SETTINGS);
  const [trackSamples, setTrackSamples] = useState<TrackSample[]>(initialSamples);
  const [surface, setSurface] = useState<SurfaceCondition>('dry');
  const [absEnabled, setAbsEnabled] = useState<boolean>(true);
  const [tcsEnabled, setTcsEnabled] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [isUnityModalOpen, setIsUnityModalOpen] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<VehicleState>(() =>
    createInitialVehicleState('monza', 'ferrari_f80')
  );
  const [bots, setBots] = useState<BotVehicleState[]>(() =>
    createInitialBots(initialSamples)
  );
  const [racePosition, setRacePosition] = useState<number>(4);
  const [skyState, setSkyState] = useState<SkyAtmosphereState>(() =>
    evaluateSkyState(14.5)
  );
  const [windState, setWindState] = useState<WindState>(() =>
    evaluateWindState(0)
  );
  const [perfStats, setPerfStats] = useState<DevicePerfStats>({
    fps: 60,
    frameTimeMs: 16.6,
    renderScale: 1.0,
    activeLodLabel: 'LOD0 Cabina',
  });

  // Refs for 60Hz loop access without re-mounting WebGL canvas
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const trackSamplesRef = useRef<TrackSample[]>(initialSamples);
  const vehicleStateRef = useRef<VehicleState>(
    createInitialVehicleState('monza', 'ferrari_f80')
  );
  const botsStateRef = useRef<BotVehicleState[]>(createInitialBots(initialSamples));
  const timeHoursRef = useRef<number>(14.5);
  const surfaceRef = useRef<SurfaceCondition>(surface);
  const absRef = useRef<boolean>(absEnabled);
  const tcsRef = useRef<boolean>(tcsEnabled);
  const settingsRef = useRef<GameSettingsState>(settings);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const isUnityModalOpenRef = useRef<boolean>(isUnityModalOpen);
  const smoothedFpsRef = useRef<number>(60);
  const dynamicRenderScaleRef = useRef<number>(1.0);

  const keysHeldRef = useRef<Set<string>>(new Set());
  const pendingManualShiftRef = useRef<1 | -1 | 0>(0);
  const gyroRawSteerRef = useRef<number>(0);
  const gyroZeroOffsetRef = useRef<number>(0);
  const lastCollisionTimerRef = useRef<number>(0);

  const touchInputRef = useRef<{
    throttle: number;
    brake: number;
    steer: number;
    handbrake: boolean;
  }>({
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
  });

  const carRigRef = useRef<HypercarRig | null>(null);
  const botRigsRef = useRef<BotCarRig[]>([]);
  const circuitEnvRef = useRef<CircuitEnvironment | null>(null);
  const sceneObjectsRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    showroomLight1: THREE.PointLight;
    showroomLight2: THREE.PointLight;
    isHeadless: boolean;
    maxAnisotropy: number;
  } | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
    document.body.dataset.state = gameState;
    if (gameState !== 'playing') {
      racingAudio.pause();
    }
  }, [gameState]);

  useEffect(() => {
    isUnityModalOpenRef.current = isUnityModalOpen;
  }, [isUnityModalOpen]);

  // Apply Car Customization changes immediately to 3D Hypercar
  const handleUpdateCustomization = useCallback(
    (patch: Partial<CarCustomizationState>) => {
      setCustomization((prev) => {
        const next = { ...prev, ...patch };
        if (carRigRef.current) {
          applyCarCustomization(carRigRef.current, next);
        }
        return next;
      });
    },
    []
  );

  // Apply Graphics, Car Model, Circuit Track, Lighting, Audio & Control Settings in real time
  const handleUpdateSettings = useCallback((patch: Partial<GameSettingsState>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;

      racingAudio.setMasterVolume(next.masterVolume);

      if (patch.lightingPreset) {
        if (patch.lightingPreset === 'day') timeHoursRef.current = 13.5;
        else if (patch.lightingPreset === 'sunset') timeHoursRef.current = 18.1;
        else if (patch.lightingPreset === 'night') timeHoursRef.current = 0.5;
      }

      if (patch.selectedCarId && carRigRef.current) {
        applyHypercarModelStyle(carRigRef.current, patch.selectedCarId);
      }

      const ctx = sceneObjectsRef.current;
      const env = circuitEnvRef.current;

      // Phase 4: Stream/rebuild circuit geometry if selectedTrackId changed
      if (patch.selectedTrackId && patch.selectedTrackId !== prev.selectedTrackId) {
        const newSamples = buildTrackSamples(24, patch.selectedTrackId);
        trackSamplesRef.current = newSamples;
        setTrackSamples(newSamples);

        if (env && ctx) {
          updateCircuitEnvironmentForTrack(
            env,
            newSamples,
            patch.selectedTrackId,
            ctx.maxAnisotropy
          );
        }

        const freshPlayer = createInitialVehicleState(
          patch.selectedTrackId,
          next.selectedCarId
        );
        const freshBots = createInitialBots(newSamples);
        vehicleStateRef.current = freshPlayer;
        botsStateRef.current = freshBots;
        setTelemetry(freshPlayer);
        setBots(freshBots);
      }

      if (ctx) {
        const qSpec = GRAPHICS_QUALITY_SPECS[next.quality];
        if (!ctx.isHeadless) {
          ctx.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, qSpec.pixelRatioCap)
          );
          ctx.dirLight.castShadow = qSpec.shadowsEnabled;
        }
        if (ctx.scene.fog instanceof THREE.FogExp2) {
          ctx.scene.fog.density = qSpec.drawDistanceFog;
        }

        ctx.showroomLight1.visible = next.quality !== 'baja';
        ctx.showroomLight2.visible = next.quality !== 'baja';

        if (env) {
          env.cloudLayerMeshes.forEach((layerMesh, idx) => {
            layerMesh.visible = idx < qSpec.volumetricCloudLayers;
          });
        }
      }

      // Show or hide AI bots depending on raceMode
      const botsEnabled = next.raceMode !== 'time_trial';
      botRigsRef.current.forEach((bRig) => {
        bRig.root.visible = botsEnabled;
      });

      return next;
    });
  }, []);

  const handleCycleTimePreset = useCallback(() => {
    const order: LightingCycleMode[] = ['dynamic', 'day', 'sunset', 'night'];
    const currentIdx = order.indexOf(settingsRef.current.lightingPreset);
    const nextPreset = order[(currentIdx + 1) % order.length];
    if (nextPreset === 'dynamic') {
      timeHoursRef.current = (timeHoursRef.current + 3.5) % 24;
    }
    handleUpdateSettings({ lightingPreset: nextPreset });
    setSkyState(evaluateSkyState(timeHoursRef.current));
  }, [handleUpdateSettings]);

  const applySurfaceCondition = useCallback((nextSurface: SurfaceCondition) => {
    setSurface(nextSurface);
    surfaceRef.current = nextSurface;
    const env = circuitEnvRef.current;
    if (!env) return;

    if (nextSurface === 'wet') {
      env.asphaltMaterial.roughness = 0.14;
      env.asphaltMaterial.metalness = 0.52;
      env.asphaltMaterial.envMapIntensity = 2.35;
      env.asphaltMaterial.color.setHex(0xb8c4d4);
    } else {
      env.asphaltMaterial.roughness = 0.58;
      env.asphaltMaterial.metalness = 0.22;
      env.asphaltMaterial.envMapIntensity = 1.35;
      env.asphaltMaterial.color.setHex(0xffffff);
    }
    env.asphaltMaterial.needsUpdate = true;
  }, []);

  const handleRepairChassis = useCallback(() => {
    vehicleStateRef.current = {
      ...vehicleStateRef.current,
      chassisIntegrity: 100,
      deformationFrontLeft: 0,
      deformationFrontRight: 0,
    };
    setTelemetry({ ...vehicleStateRef.current });
  }, []);

  const handleStartRace = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    keysHeldRef.current.clear();
    const activeSettings = settingsRef.current;
    const freshPlayer = createInitialVehicleState(
      activeSettings.selectedTrackId,
      activeSettings.selectedCarId
    );
    const freshBots = createInitialBots(trackSamplesRef.current);
    vehicleStateRef.current = freshPlayer;
    botsStateRef.current = freshBots;
    setTelemetry(freshPlayer);
    setBots(freshBots);
    racingAudio.init();
    document.body.dataset.state = 'playing';
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, []);

  const handleRestartRace = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    keysHeldRef.current.clear();
    const activeSettings = settingsRef.current;
    const fresh = createInitialVehicleState(
      activeSettings.selectedTrackId,
      activeSettings.selectedCarId
    );
    const freshBots = createInitialBots(trackSamplesRef.current);
    vehicleStateRef.current = fresh;
    botsStateRef.current = freshBots;
    setTelemetry(fresh);
    setBots(freshBots);
    setRacePosition(4);
    racingAudio.init();
    document.body.dataset.state = 'playing';
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, []);

  const handleReturnToTitle = useCallback(() => {
    keysHeldRef.current.clear();
    const activeSettings = settingsRef.current;
    const fresh = createInitialVehicleState(
      activeSettings.selectedTrackId,
      activeSettings.selectedCarId
    );
    const freshBots = createInitialBots(trackSamplesRef.current);
    vehicleStateRef.current = fresh;
    botsStateRef.current = freshBots;
    setTelemetry(fresh);
    setBots(freshBots);
    document.body.dataset.state = 'title';
    gameStateRef.current = 'title';
    setGameState('title');
  }, []);

  const handlePauseToggle = useCallback(() => {
    setGameState((prev) => {
      const next =
        prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev;
      gameStateRef.current = next;
      document.body.dataset.state = next;
      return next;
    });
  }, []);

  const handleCycleCamera = useCallback(() => {
    setCameraMode((prev) => {
      const next: CameraMode =
        prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'hood' : 'chase';
      cameraModeRef.current = next;
      return next;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      racingAudio.setMuted(next);
      return next;
    });
  }, []);

  // DeviceOrientation (Gyroscope) & Keyboard Listeners
  useEffect(() => {
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        gyroRawSteerRef.current = e.gamma / 32;
      }
    };
    window.addEventListener('deviceorientation', onDeviceOrientation);

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;

      if (code === 'Escape') {
        if (isUnityModalOpenRef.current) {
          setIsUnityModalOpen(false);
          return;
        }
        if (
          gameStateRef.current === 'playing' ||
          gameStateRef.current === 'paused'
        ) {
          handlePauseToggle();
          return;
        }
      }

      if (isUnityModalOpenRef.current) return;

      if (gameStateRef.current === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          handleStartRace();
          return;
        }
      }

      if (!e.repeat) {
        if (code === 'KeyP') {
          handleUpdateSettings({
            showPerfOverlay: !settingsRef.current.showPerfOverlay,
          });
        } else if (code === 'KeyC' && gameStateRef.current === 'playing') {
          handleCycleCamera();
        } else if (code === 'KeyG') {
          applySurfaceCondition(surfaceRef.current === 'dry' ? 'wet' : 'dry');
        } else if (code === 'KeyT') {
          handleCycleTimePreset();
        } else if (code === 'KeyU') {
          setIsUnityModalOpen((prev) => !prev);
        } else if (code === 'KeyM') {
          handleToggleMute();
        } else if (code === 'KeyR' && gameStateRef.current === 'playing') {
          handleRestartRace();
        } else if (code === 'KeyB' && gameStateRef.current === 'playing') {
          handleRepairChassis();
        } else if (code === 'KeyE' && gameStateRef.current === 'playing') {
          pendingManualShiftRef.current = 1;
        } else if (code === 'KeyQ' && gameStateRef.current === 'playing') {
          pendingManualShiftRef.current = -1;
        }
      }

      keysHeldRef.current.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const clearInputs = () => {
      keysHeldRef.current.clear();
      touchInputRef.current = {
        throttle: 0,
        brake: 0,
        steer: 0,
        handbrake: false,
      };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);

    return () => {
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, [
    applySurfaceCondition,
    handleCycleCamera,
    handleCycleTimePreset,
    handlePauseToggle,
    handleRepairChassis,
    handleRestartRace,
    handleStartRace,
    handleToggleMute,
    handleUpdateSettings,
  ]);

  // Mount Three.js WebGLRenderer & Scene ONCE
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1320);
    scene.fog = new THREE.FogExp2(0x0d1320, 0.0015);

    const camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.15,
      850
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, 1.5)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0x7aa2f7, 0x1a202c, 1.15);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff0d4, 2.7);
    dirLight.position.set(45, 75, 35);
    if (!isHeadless) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 220;
      const d = 55;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    const showroomLight1 = new THREE.PointLight(0xe11d2a, 14, 18);
    const showroomLight2 = new THREE.PointLight(0x38bdf8, 12, 18);
    scene.add(showroomLight1, showroomLight2);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    sceneObjectsRef.current = {
      renderer,
      scene,
      camera,
      dirLight,
      hemiLight,
      showroomLight1,
      showroomLight2,
      isHeadless,
      maxAnisotropy,
    };

    const circuitEnv = buildMonzaCircuitScene(
      scene,
      trackSamplesRef.current,
      maxAnisotropy,
      'monza'
    );
    circuitEnvRef.current = circuitEnv;

    const carRig = buildHypercarRig(maxAnisotropy, DEFAULT_CUSTOMIZATION);
    carRigRef.current = carRig;
    scene.add(carRig.root);

    // Build 3 Rival AI Bot Hypercar Rigs
    const botRigs = buildBotHypercarRigs(
      scene,
      botsStateRef.current,
      maxAnisotropy
    );
    botRigsRef.current = botRigs;

    const initV = vehicleStateRef.current;
    carRig.root.position.set(initV.x, 0, initV.z);
    carRig.root.rotation.y = initV.headingRad;
    _smoothedLookAt.set(initV.x, 0.8, initV.z);

    renderer.compile(scene, camera);

    const particles: ParticleSlot[] = Array.from({ length: 48 }, () => ({
      active: false,
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.6,
      scale: 0,
    }));
    let particleCursor = 0;

    const sparkParticles: ParticleSlot[] = Array.from({ length: 36 }, () => ({
      active: false,
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.35,
      scale: 0,
    }));
    let sparkCursor = 0;

    let animFrameId = 0;
    let lastTimeMs = performance.now();
    let lastHudSyncMs = 0;
    let lastRenderMs = 0;

    const animate = (nowMs: number) => {
      animFrameId = requestAnimationFrame(animate);

      if (isHeadless && nowMs - lastRenderMs < 160) {
        return;
      }
      lastRenderMs = nowMs;

      const rawDt = (nowMs - lastTimeMs) / 1000;
      lastTimeMs = nowMs;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const elapsedSec = nowMs * 0.001;

      // Phase 4 Frame Timing & Dynamic Resolution Profiler
      const instantFps = Math.min(60, 1 / Math.max(0.005, rawDt));
      smoothedFpsRef.current =
        smoothedFpsRef.current * 0.92 + instantFps * 0.08;

      const activeState = gameStateRef.current;
      const activeSettings = settingsRef.current;
      const activeSamples = trackSamplesRef.current;
      let vState = vehicleStateRef.current;
      let currentBots = botsStateRef.current;

      // 1. Evaluate Phase 3 Sky / Day-Night Cycle & Wind State
      if (activeSettings.lightingPreset === 'dynamic' && activeState !== 'paused') {
        timeHoursRef.current = (timeHoursRef.current + dt * 0.32) % 24;
      } else if (activeSettings.lightingPreset === 'day') {
        timeHoursRef.current = 13.5;
      } else if (activeSettings.lightingPreset === 'sunset') {
        timeHoursRef.current = 18.1;
      } else if (activeSettings.lightingPreset === 'night') {
        timeHoursRef.current = 0.5;
      }

      const currentSky = evaluateSkyState(timeHoursRef.current);
      const currentWind = evaluateWindState(elapsedSec);

      // Sync Celestial Dome, Sun/Moon, Starfield & Volumetric Cloud Tints
      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(currentSky.skyColorHex);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(currentSky.horizonColorHex);
      }
      scene.environmentIntensity =
        0.18 + Math.max(0, (currentSky.sunElevation + 0.15) / 1.15) * 0.82;
      dirLight.color.setHex(currentSky.sunLightColorHex);
      dirLight.intensity = currentSky.sunLightIntensity;
      hemiLight.intensity = currentSky.hemiLightIntensity;

      circuitEnv.sunMesh.position.set(
        vState.x + currentSky.sunX,
        currentSky.sunY,
        vState.z + currentSky.sunZ
      );
      circuitEnv.moonMesh.position.set(
        vState.x + currentSky.moonX,
        currentSky.moonY,
        vState.z + currentSky.moonZ
      );
      circuitEnv.starfieldInstanced.position.set(vState.x, 0, vState.z);
      circuitEnv.starfieldMaterial.opacity = currentSky.starfieldOpacity;
      circuitEnv.starfieldInstanced.visible = currentSky.starfieldOpacity > 0.02;

      circuitEnv.cloudLitMaterial.color.setHex(currentSky.cloudLitColorHex);
      circuitEnv.cloudShadowMaterial.color.setHex(currentSky.cloudShadowColorHex);

      // Drift Volumetric Cloud Deck with Wind
      const cloudDriftX = ((elapsedSec * currentWind.speedKmh * 0.14) % 240) - 120;
      circuitEnv.cloudGroup.position.set(
        vState.x + cloudDriftX,
        0,
        vState.z
      );

      carRig.headlightMaterial.emissiveIntensity = currentSky.headlightsIntensity;

      // Phase 4 LOD0/LOD1 Management
      const isCloseLod0 =
        activeState === 'title' ||
        cameraModeRef.current === 'cockpit' ||
        activeSettings.quality !== 'baja';
      setHypercarLodLevel(carRig, isCloseLod0 ? 0 : 1);

      // 2. Advance Player & AI Bot Physics when in 'playing' state
      if (activeState === 'playing') {
        const keys = keysHeldRef.current;
        const kbThrottle = keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0;
        const kbBrake = keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0;
        const kbSteer =
          (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) -
          (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
        const kbHandbrake = keys.has('Space');

        let activeSteer = -touchInputRef.current.steer;
        if (Math.abs(kbSteer) > 0.01) {
          activeSteer = kbSteer;
        } else if (activeSettings.controlScheme === 'gyroscope') {
          activeSteer = -(gyroRawSteerRef.current - gyroZeroOffsetRef.current);
        }

        const shiftCmd = pendingManualShiftRef.current;
        pendingManualShiftRef.current = 0;

        const combinedInput: VehicleInput = {
          throttle: Math.max(kbThrottle, touchInputRef.current.throttle),
          brake: Math.max(kbBrake, touchInputRef.current.brake),
          steer: activeSteer,
          handbrake: kbHandbrake || Boolean(touchInputRef.current.handbrake),
          absEnabled: absRef.current,
          tcsEnabled: tcsRef.current,
          surface: surfaceRef.current,
          manualTransmission: activeSettings.manualTransmission,
          shiftUpRequested: shiftCmd === 1,
          shiftDownRequested: shiftCmd === -1,
          steeringSensitivity: activeSettings.steeringSensitivity,
          crosswindSpeedMs: currentWind.crosswindMs,
          carModelId: activeSettings.selectedCarId,
        };

        vState = stepVehiclePhysics(
          vState,
          combinedInput,
          dt,
          activeSamples
        );
        vehicleStateRef.current = vState;

        // Step 3 AI Rival Bots if not in time_trial
        if (activeSettings.raceMode !== 'time_trial') {
          currentBots = stepBotVehicles(
            currentBots,
            vState,
            dt,
            activeSamples,
            activeSettings.botDifficulty,
            surfaceRef.current
          );
          botsStateRef.current = currentBots;
        }

        // Detect fresh collision event
        if (
          vState.collisionFlashTimer > 0.22 &&
          lastCollisionTimerRef.current <= 0.22
        ) {
          racingAudio.playCollisionImpact(vState.lastCollisionImpactMs / 35);
          if (activeSettings.hapticsEnabled && navigator.vibrate) {
            navigator.vibrate(45);
          }

          const sinH = Math.sin(vState.headingRad);
          const cosH = Math.cos(vState.headingRad);
          for (let s = 0; s < 12; s++) {
            const sp = sparkParticles[sparkCursor];
            sparkCursor = (sparkCursor + 1) % sparkParticles.length;
            sp.active = true;
            sp.x = vState.x + sinH * 1.8 + (Math.random() - 0.5) * 1.6;
            sp.y = 0.35 + Math.random() * 0.3;
            sp.z = vState.z + cosH * 1.8 + (Math.random() - 0.5) * 1.6;
            sp.vx = (Math.random() - 0.5) * 9;
            sp.vy = 2.5 + Math.random() * 4.5;
            sp.vz = (Math.random() - 0.5) * 9;
            sp.life = 0;
            sp.maxLife = 0.22 + Math.random() * 0.18;
            sp.scale = 1.0;
          }
        }
        lastCollisionTimerRef.current = vState.collisionFlashTimer;

        racingAudio.update(
          vState.rpm,
          combinedInput.throttle,
          vState.gear,
          vState.slipAngleDeg,
          vState.speedKmh
        );

        if (vState.currentLap > vState.totalLaps) {
          gameStateRef.current = 'gameover';
          document.body.dataset.state = 'gameover';
          setGameState('gameover');
          setTelemetry({ ...vState });
        }

        if (nowMs - lastHudSyncMs > 95) {
          lastHudSyncMs = nowMs;
          const activeBotsList =
            activeSettings.raceMode === 'time_trial' ? [] : currentBots;
          setTelemetry({ ...vState });
          setBots([...activeBotsList]);
          setRacePosition(computeRacePosition(vState, activeBotsList));
          setSkyState(currentSky);
          setWindState(currentWind);
          setPerfStats({
            fps: Math.round(smoothedFpsRef.current),
            frameTimeMs: 1000 / Math.max(15, smoothedFpsRef.current),
            renderScale: dynamicRenderScaleRef.current,
            activeLodLabel:
              carRig.activeLodLevel === 0
                ? 'LOD0 Cabina + Bots LOD1'
                : 'LOD1 Optimizado',
          });
        }
      } else if (nowMs - lastHudSyncMs > 250) {
        lastHudSyncMs = nowMs;
        setSkyState(currentSky);
        setWindState(currentWind);
      }

      // 3. Sync 3D Player & AI Bot Rigs
      carRig.root.position.set(vState.x, 0, vState.z);
      carRig.root.rotation.y = vState.headingRad;

      carRig.bodyGroup.rotation.x = vState.pitchRad;
      carRig.bodyGroup.rotation.z = vState.rollRad;

      // Active DRS / Airbrake Rear Wing Tilt
      carRig.rearWingBlade.rotation.x = (vState.wingAngleDeg * Math.PI) / 180;

      // Visual Fender Deformation on Barrier Impact
      carRig.frontFenderLeft.position.y =
        0.36 - vState.deformationFrontLeft * 0.045;
      carRig.frontFenderLeft.rotation.z = vState.deformationFrontLeft * 0.08;
      carRig.frontFenderRight.position.y =
        0.36 - vState.deformationFrontRight * 0.045;
      carRig.frontFenderRight.rotation.z = -vState.deformationFrontRight * 0.08;

      carRig.wheelFL.rotation.set(
        vState.wheelSpinRad,
        vState.steerAngleRad,
        0,
        'YXZ'
      );
      carRig.wheelFR.rotation.set(
        vState.wheelSpinRad,
        vState.steerAngleRad,
        0,
        'YXZ'
      );
      carRig.wheelRL.rotation.set(vState.wheelSpinRad, 0, 0, 'YXZ');
      carRig.wheelRR.rotation.set(vState.wheelSpinRad, 0, 0, 'YXZ');

      carRig.steeringWheel.rotation.z = -vState.steerAngleRad * 2.2;

      const isBraking =
        activeState === 'playing' &&
        (keysHeldRef.current.has('KeyS') ||
          keysHeldRef.current.has('ArrowDown') ||
          touchInputRef.current.brake > 0.1);
      carRig.taillightMaterial.emissiveIntensity = isBraking ? 6.5 : 2.2;

      const discHeatFactor = Math.max(
        0,
        Math.min(1, (vState.brakeTempC - 320) / 550)
      );
      for (const mat of carRig.brakeDiscMaterials) {
        mat.emissiveIntensity = discHeatFactor * 3.8;
      }

      // Sync 3 AI Bot Rigs + Distance-Based LOD1/LOD2
      const botsVisible = activeSettings.raceMode !== 'time_trial';
      for (let bIdx = 0; bIdx < botRigs.length; bIdx++) {
        const bRig = botRigs[bIdx];
        const bState = currentBots[bIdx];
        if (!bRig || !bState) continue;
        bRig.root.visible = botsVisible;
        bRig.root.position.set(bState.x, 0, bState.z);
        bRig.root.rotation.y = bState.headingRad;
        bRig.wheelFL.rotation.set(
          bState.wheelSpinRad,
          bState.steerAngleRad,
          0,
          'YXZ'
        );
        bRig.wheelFR.rotation.set(
          bState.wheelSpinRad,
          bState.steerAngleRad,
          0,
          'YXZ'
        );
        bRig.wheelRL.rotation.set(bState.wheelSpinRad, 0, 0, 'YXZ');
        bRig.wheelRR.rotation.set(bState.wheelSpinRad, 0, 0, 'YXZ');
        bRig.taillightMaterial.emissiveIntensity = bState.isBraking ? 6.2 : 2.0;
      }

      // 4. Update Pooled Tire Smoke & Collision Sparks
      const shouldSpawnParticles =
        activeState === 'playing' &&
        vState.speedKmh > 35 &&
        (Math.abs(vState.slipAngleDeg) > 4.5 ||
          surfaceRef.current === 'wet' ||
          vState.offTrack);

      if (shouldSpawnParticles) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % particles.length;
        const sinH = Math.sin(vState.headingRad);
        const cosH = Math.cos(vState.headingRad);
        const sideSign = particleCursor % 2 === 0 ? 0.85 : -0.85;

        p.active = true;
        p.x = vState.x - sinH * 1.65 + cosH * sideSign;
        p.y = 0.22;
        p.z = vState.z - cosH * 1.65 - sinH * sideSign;
        p.vx = (Math.random() - 0.5) * 1.8;
        p.vy = 0.9 + Math.random() * 1.2;
        p.vz = (Math.random() - 0.5) * 1.8;
        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.25;
        p.scale = surfaceRef.current === 'wet' ? 1.15 : 0.9;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          _dummyMat.makeScale(0, 0, 0);
          circuitEnv.particleMesh.setMatrixAt(i, _dummyMat);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const normLife = p.life / p.maxLife;
        const s = p.scale * (0.6 + normLife * 1.8) * (1 - normLife);
        _dummyPos.set(p.x, p.y, p.z);
        _dummyQuat.identity();
        _dummyScale.set(s, s, s);
        _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
        circuitEnv.particleMesh.setMatrixAt(i, _dummyMat);
      }
      circuitEnv.particleMesh.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < sparkParticles.length; i++) {
        const sp = sparkParticles[i];
        if (!sp.active) continue;
        sp.life += dt;
        if (sp.life >= sp.maxLife) {
          sp.active = false;
          _dummyMat.makeScale(0, 0, 0);
          circuitEnv.sparkParticleMesh.setMatrixAt(i, _dummyMat);
          continue;
        }
        sp.vy -= 14 * dt;
        sp.x += sp.vx * dt;
        sp.y = Math.max(0.05, sp.y + sp.vy * dt);
        sp.z += sp.vz * dt;
        const s = sp.scale * (1 - sp.life / sp.maxLife);
        _dummyPos.set(sp.x, sp.y, sp.z);
        _dummyQuat.identity();
        _dummyScale.set(s, s, s);
        _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
        circuitEnv.sparkParticleMesh.setMatrixAt(i, _dummyMat);
      }
      circuitEnv.sparkParticleMesh.instanceMatrix.needsUpdate = true;

      // 5. Phase 3 Wind Vertex Animation on Track Flags, Cypress Trees & Grass Tufts
      const qSpec = GRAPHICS_QUALITY_SPECS[activeSettings.quality];
      if (!isHeadless && qSpec.treeWindAnimation) {
        const windWave = currentWind.wavePhase;
        const treeSway = Math.sin(windWave * 0.8) * 0.04 * currentWind.gustFactor;

        for (let i = 0; i < circuitEnv.treeBaseMatrices.length; i += 2) {
          _dummyMat.copy(circuitEnv.treeBaseMatrices[i]);
          _dummyEuler.set(treeSway, 0, treeSway * 0.5);
          _dummyQuat.setFromEuler(_dummyEuler);
          _dummyPos.setFromMatrixPosition(_dummyMat);
          _dummyScale.setFromMatrixScale(_dummyMat);
          _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
          circuitEnv.treeFoliageInstanced.setMatrixAt(i, _dummyMat);
        }
        circuitEnv.treeFoliageInstanced.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < circuitEnv.flagBaseMatrices.length; i++) {
          _dummyMat.copy(circuitEnv.flagBaseMatrices[i]);
          const flutter =
            Math.sin(windWave * 2.4 + i * 0.9) * 0.28 * currentWind.gustFactor;
          _dummyEuler.set(0, flutter, flutter * 0.25);
          _dummyQuat.setFromEuler(_dummyEuler);
          _dummyPos.setFromMatrixPosition(_dummyMat);
          _dummyScale.setFromMatrixScale(_dummyMat);
          _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
          circuitEnv.flagClothInstanced.setMatrixAt(i, _dummyMat);
        }
        circuitEnv.flagClothInstanced.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < circuitEnv.grassBaseMatrices.length; i += 2) {
          _dummyMat.copy(circuitEnv.grassBaseMatrices[i]);
          const grassLean =
            Math.sin(windWave * 1.5 + i * 0.5) * 0.14 * currentWind.gustFactor;
          _dummyEuler.set(grassLean, i * 0.9, grassLean * 0.5);
          _dummyQuat.setFromEuler(_dummyEuler);
          _dummyPos.setFromMatrixPosition(_dummyMat);
          _dummyScale.setFromMatrixScale(_dummyMat);
          _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
          circuitEnv.grassTuftInstanced.setMatrixAt(i, _dummyMat);
        }
        circuitEnv.grassTuftInstanced.instanceMatrix.needsUpdate = true;
      }

      // 6. Camera Choreography
      const sinH = Math.sin(vState.headingRad);
      const cosH = Math.cos(vState.headingRad);
      _carForward.set(sinH, 0, cosH);
      _carRight.set(cosH, 0, -sinH);

      if (activeState === 'title') {
        const orbitAngle =
          vState.headingRad + 0.55 + Math.sin(elapsedSec * 0.35) * 0.48;
        const radius = 5.4;
        _camTargetPos.set(
          vState.x + Math.sin(orbitAngle) * radius,
          1.55 + Math.sin(elapsedSec * 0.5) * 0.18,
          vState.z + Math.cos(orbitAngle) * radius
        );
        _camLookAt.set(
          vState.x - Math.cos(orbitAngle) * 1.05,
          0.68,
          vState.z + Math.sin(orbitAngle) * 1.05
        );

        camera.position.lerp(_camTargetPos, 1 - Math.exp(-6 * dt));
        _smoothedLookAt.lerp(_camLookAt, 1 - Math.exp(-8 * dt));
        camera.lookAt(_smoothedLookAt);
        camera.fov = THREE.MathUtils.lerp(camera.fov, 50, 1 - Math.exp(-6 * dt));
        camera.updateProjectionMatrix();

        showroomLight1.position.set(
          vState.x + Math.cos(elapsedSec * 1.1) * 3.5,
          2.6,
          vState.z + Math.sin(elapsedSec * 1.1) * 3.5
        );
        showroomLight2.position.set(
          vState.x - Math.cos(elapsedSec * 0.8) * 3.5,
          2.2,
          vState.z - Math.sin(elapsedSec * 0.8) * 3.5
        );
      } else {
        const mode = cameraModeRef.current;
        const trauma = vState.collisionFlashTimer * 2.5;
        const shakeX =
          trauma > 0 ? (Math.random() - 0.5) * trauma * trauma * 0.18 : 0;
        const shakeY =
          trauma > 0 ? (Math.random() - 0.5) * trauma * trauma * 0.18 : 0;

        if (mode === 'cockpit') {
          _camTargetPos
            .set(vState.x, 0.93 + shakeY, vState.z)
            .addScaledVector(_carForward, 0.02)
            .addScaledVector(_carRight, 0.32 + shakeX);
          _camLookAt
            .copy(_camTargetPos)
            .addScaledVector(_carForward, 18)
            .add(new THREE.Vector3(0, -0.45, 0));

          camera.position.copy(_camTargetPos);
          camera.lookAt(_camLookAt);
          camera.fov = THREE.MathUtils.lerp(
            camera.fov,
            66 + (vState.speedKmh / 340) * 8,
            1 - Math.exp(-10 * dt)
          );
          camera.updateProjectionMatrix();
        } else if (mode === 'hood') {
          _camTargetPos
            .set(vState.x, 0.84 + shakeY, vState.z)
            .addScaledVector(_carForward, 1.05)
            .addScaledVector(_carRight, shakeX);
          _camLookAt
            .copy(_camTargetPos)
            .addScaledVector(_carForward, 24)
            .add(new THREE.Vector3(0, -0.35, 0));

          camera.position.copy(_camTargetPos);
          camera.lookAt(_camLookAt);
          camera.fov = THREE.MathUtils.lerp(
            camera.fov,
            68 + (vState.speedKmh / 340) * 12,
            1 - Math.exp(-10 * dt)
          );
          camera.updateProjectionMatrix();
        } else {
          const isPortrait = camera.aspect < 0.85;
          const followDist =
            (isPortrait ? 6.15 : 5.45) + (vState.speedKmh / 340) * 1.1;
          const lateralSwing = -vState.steerAngleRad * 2.2 + shakeX;
          _camTargetPos
            .set(vState.x, (isPortrait ? 2.48 : 2.22) + shakeY, vState.z)
            .addScaledVector(_carForward, -followDist)
            .addScaledVector(_carRight, lateralSwing);

          _camLookAt
            .set(vState.x, isPortrait ? 0.18 : 0.34, vState.z)
            .addScaledVector(_carForward, 6.5);

          const dampPos = 1 - Math.exp(-11 * dt);
          const dampLook = 1 - Math.exp(-15 * dt);
          camera.position.lerp(_camTargetPos, dampPos);
          _smoothedLookAt.lerp(_camLookAt, dampLook);
          camera.lookAt(_smoothedLookAt);

          const targetFov = 60 + (vState.speedKmh / 330) * 16;
          camera.fov = THREE.MathUtils.lerp(
            camera.fov,
            targetFov,
            1 - Math.exp(-8 * dt)
          );
          camera.updateProjectionMatrix();
        }

        const sunAlt = Math.max(25, currentSky.sunY * 0.25 + 45);
        dirLight.position.set(
          vState.x + currentSky.sunX * 0.15,
          sunAlt,
          vState.z + currentSky.sunZ * 0.15
        );
        dirLight.target.position.set(vState.x, 0, vState.z);
        dirLight.target.updateMatrixWorld();
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090C] select-none">
      {/* Dedicated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="webgl-canvas-container"
        className="fixed inset-0 w-full h-full z-0"
      />

      {/* Phase 1-4 Main Menu, 4-Car / 4-Track Selector & 3D Garage Customization */}
      {gameState === 'title' && (
        <TitleScreenOverlay
          customization={customization}
          onUpdateCustomization={handleUpdateCustomization}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          surface={surface}
          onToggleSurface={applySurfaceCondition}
          onCalibrateGyro={() => {
            gyroZeroOffsetRef.current = gyroRawSteerRef.current;
          }}
          onStartRace={handleStartRace}
          onOpenUnityBlueprint={() => setIsUnityModalOpen(true)}
        />
      )}

      {/* Playing HUD, Dynamic 4-Track Minimap, Sky/Wind/Profiler Telemetry & Modals */}
      {gameState !== 'title' && (
        <RacingHudOverlay
          gameState={gameState}
          telemetry={telemetry}
          bots={bots}
          racePosition={racePosition}
          skyState={skyState}
          windState={windState}
          perfStats={perfStats}
          samples={trackSamples}
          surface={surface}
          absEnabled={absEnabled}
          tcsEnabled={tcsEnabled}
          cameraMode={cameraMode}
          isMuted={isMuted}
          showTouchControls={showTouchControls}
          settings={settings}
          onToggleSurface={() =>
            applySurfaceCondition(surface === 'dry' ? 'wet' : 'dry')
          }
          onCycleTimePreset={handleCycleTimePreset}
          onTogglePerfOverlay={() =>
            handleUpdateSettings({ showPerfOverlay: !settings.showPerfOverlay })
          }
          onToggleAbs={() => {
            setAbsEnabled((prev) => {
              absRef.current = !prev;
              return !prev;
            });
          }}
          onToggleTcs={() => {
            setTcsEnabled((prev) => {
              tcsRef.current = !prev;
              return !prev;
            });
          }}
          onCycleCamera={handleCycleCamera}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onOpenUnityBlueprint={() => setIsUnityModalOpen(true)}
          onRepairChassis={handleRepairChassis}
          onManualShift={(dir) => {
            pendingManualShiftRef.current = dir;
          }}
          onPauseToggle={handlePauseToggle}
          onRestart={handleRestartRace}
          onReturnToTitle={handleReturnToTitle}
          onTouchInputChange={(patch) => {
            touchInputRef.current = {
              ...touchInputRef.current,
              ...patch,
            };
          }}
        />
      )}

      {/* Unity 6 URP C# Phase 1 + 2 + 3 + 4 Deliverable & Code Inspector Modal */}
      <UnityBlueprintModal
        isOpen={isUnityModalOpen}
        onClose={() => setIsUnityModalOpen(false)}
      />
    </main>
  );
}
