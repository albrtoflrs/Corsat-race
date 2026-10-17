import React, { useMemo, useRef, useState } from 'react';
import {
  BotVehicleState,
  formatLapTime,
  GameSettingsState,
  getCircuitSpec,
  getHypercarSpec,
  SkyAtmosphereState,
  SurfaceCondition,
  TrackSample,
  VehicleState,
  WindState,
} from '../game/physics';

export type CameraMode = 'chase' | 'cockpit' | 'hood';

export interface DevicePerfStats {
  fps: number;
  frameTimeMs: number;
  renderScale: number;
  activeLodLabel: string;
}

interface RacingHudOverlayProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  telemetry: VehicleState;
  bots: BotVehicleState[];
  racePosition: number;
  skyState: SkyAtmosphereState;
  windState: WindState;
  perfStats?: DevicePerfStats;
  samples: TrackSample[];
  surface: SurfaceCondition;
  absEnabled: boolean;
  tcsEnabled: boolean;
  cameraMode: CameraMode;
  isMuted: boolean;
  showTouchControls: boolean;
  settings: GameSettingsState;
  onToggleSurface: () => void;
  onCycleTimePreset: () => void;
  onTogglePerfOverlay?: () => void;
  onToggleAbs: () => void;
  onToggleTcs: () => void;
  onCycleCamera: () => void;
  onToggleTouchControls: () => void;
  onToggleMute: () => void;
  onOpenUnityBlueprint: () => void;
  onRepairChassis: () => void;
  onManualShift: (dir: 1 | -1) => void;
  onPauseToggle: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  onTouchInputChange: (patch: {
    steer?: number;
    throttle?: number;
    brake?: number;
    handbrake?: boolean;
  }) => void;
}

export const RacingHudOverlay: React.FC<RacingHudOverlayProps> = ({
  gameState,
  telemetry,
  bots,
  racePosition,
  skyState,
  windState,
  perfStats,
  samples,
  surface,
  absEnabled,
  tcsEnabled,
  cameraMode,
  isMuted,
  showTouchControls,
  settings,
  onToggleSurface,
  onCycleTimePreset,
  onTogglePerfOverlay,
  onToggleAbs,
  onToggleTcs,
  onCycleCamera,
  onToggleTouchControls,
  onToggleMute,
  onOpenUnityBlueprint,
  onRepairChassis,
  onManualShift,
  onPauseToggle,
  onRestart,
  onReturnToTitle,
  onTouchInputChange,
}) => {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [virtualWheelDeg, setVirtualWheelDeg] = useState(0);
  const isDraggingWheelRef = useRef(false);

  const circuitSpec = getCircuitSpec(settings.selectedTrackId);
  const carSpec = getHypercarSpec(settings.selectedCarId);

  const minimapData = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const s of samples) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.z < minZ) minZ = s.z;
      if (s.z > maxZ) maxZ = s.z;
    }
    const pad = 25;
    minX -= pad;
    maxX += pad;
    minZ -= pad;
    maxZ += pad;
    const width = maxX - minX || 1;
    const height = maxZ - minZ || 1;

    const toSvgX = (x: number) => ((x - minX) / width) * 120;
    const toSvgY = (z: number) => ((z - minZ) / height) * 120;

    const pathParts = samples.map((s, idx) => {
      const sx = toSvgX(s.x).toFixed(1);
      const sy = toSvgY(s.z).toFixed(1);
      return `${idx === 0 ? 'M' : 'L'}${sx},${sy}`;
    });
    pathParts.push('Z');

    const startPt = circuitSpec.controlPoints[1];
    return {
      d: pathParts.join(' '),
      minX,
      minZ,
      width,
      height,
      startX: toSvgX(startPt.x),
      startY: toSvgY(startPt.z),
    };
  }, [samples, circuitSpec]);

  const carMapX = ((telemetry.x - minimapData.minX) / minimapData.width) * 120;
  const carMapY = ((telemetry.z - minimapData.minZ) / minimapData.height) * 120;

  const roundedSpeed = Math.round(telemetry.speedKmh);
  const roundedRpm = Math.round(telemetry.rpm);
  const roundedBrakeTemp = Math.round(telemetry.brakeTempC);
  const roundedIntegrity = Math.round(telemetry.chassisIntegrity);
  const roundedWindKmh = Math.round(windState.speedKmh);
  const rpmRatio = Math.min(
    1,
    Math.max(0, (telemetry.rpm - 1100) / (carSpec.redlineRpm - 1100))
  );

  const handleWheelPointerMove = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = clientX - cx;
    const dy = Math.max(18, cy - clientY + rect.height * 0.35);
    const angleDeg = Math.max(-120, Math.min(120, (Math.atan2(dx, dy) * 180) / Math.PI));
    setVirtualWheelDeg(angleDeg);
    onTouchInputChange({ steer: angleDeg / 120 });
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Subtle Peripheral Screen Vignette on Barrier Impact */}
      {telemetry.collisionFlashTimer > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity"
          style={{
            boxShadow: 'inset 0 0 90px rgba(225, 29, 42, 0.55)',
          }}
        />
      )}

      {/* TOP PERIMETER ROW: Cluster 1 (Top-Left Position/Lap/Weather) & Cluster 2 (Top-Right Minimap & Utility) */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Corner Cluster: Position, Lap, Sector, Sky Cycle, Wind & Assists */}
        <div
          className="p-3 sm:p-4 rounded-xl border border-white/15 shadow-xl pointer-events-auto"
          style={{ backgroundColor: 'rgba(10, 12, 16, 0.84)' }}
        >
          <div className="flex items-baseline gap-4">
            {/* Race Position vs AI Bots */}
            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400">
                POSICIÓN
              </div>
              <div
                data-testid="hud-race-position"
                className="text-xl sm:text-2xl font-bold font-display tabular-nums text-[#FACC15] leading-none mt-0.5"
              >
                {bots.length > 0 ? `P${racePosition}/${bots.length + 1}` : 'SOLO'}
              </div>
            </div>

            <div className="h-7 w-px bg-white/10" />

            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400">
                VUELTA
              </div>
              <div
                data-testid="hud-lap"
                className="text-xl sm:text-2xl font-bold font-display tabular-nums text-white leading-none mt-0.5"
              >
                {Math.min(telemetry.currentLap, telemetry.totalLaps)}/{telemetry.totalLaps}
              </div>
            </div>

            <div className="h-7 w-px bg-white/10" />

            <div>
              <div className="text-[10px] font-mono tracking-wider text-slate-400">
                TIEMPO · SECTOR {telemetry.sectorIndex}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white leading-none mt-0.5">
                {formatLapTime(telemetry.currentLapTimeMs)}
              </div>
            </div>

            <div className="hidden sm:block h-7 w-px bg-white/10" />

            <div className="hidden sm:block">
              <div className="text-[10px] font-mono tracking-wider text-slate-400">
                MEJOR VUELTA
              </div>
              <div className="text-sm font-mono tabular-nums text-[#FACC15] leading-none mt-1.5">
                {formatLapTime(telemetry.bestLapTimeMs)}
              </div>
            </div>
          </div>

          {/* Interactive Sky Cycle [T], Asphalt Grip [G], Wind Speed, ABS, TCS & DRS Readout */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/10">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleTimePreset();
              }}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {skyState.formattedClock} · {skyState.phaseLabel} [T]
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSurface();
              }}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                surface === 'wet'
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              Asfalto: {surface === 'wet' ? 'Mojado' : 'Seco'} [G]
            </button>

            <span className="px-2 py-1 text-[11px] font-mono text-slate-300 bg-white/5 rounded whitespace-nowrap">
              Viento {roundedWindKmh} km/h
            </span>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleAbs();
              }}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                telemetry.absActive
                  ? 'bg-[#FACC15] text-black'
                  : absEnabled
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              ABS {absEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTcs();
              }}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                telemetry.tcsActive
                  ? 'bg-[#FACC15] text-black'
                  : tcsEnabled
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              TCS {tcsEnabled ? 'ON' : 'OFF'}
            </button>

            <span
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded whitespace-nowrap ${
                telemetry.drsActive
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              DRS {telemetry.drsActive ? 'ACTIVO' : 'LISTO'}
            </span>

            {roundedIntegrity < 100 && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRepairChassis();
                }}
                className="px-2 py-1 text-[11px] font-mono font-bold rounded bg-[#E11D2A] text-white hover:bg-[#c81521] transition-colors cursor-pointer whitespace-nowrap"
              >
                Chasis {roundedIntegrity}% · Reparar [B]
              </button>
            )}
          </div>

          {/* Phase 4 Device Performance & LOD Telemetry Strip (when active) */}
          {settings.showPerfOverlay && perfStats && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/10 text-[10px] font-mono text-[#86EFAC]">
              <span>FPS: {perfStats.fps}</span>
              <span>·</span>
              <span>FRAME: {perfStats.frameTimeMs.toFixed(1)} ms</span>
              <span>·</span>
              <span>RES: {Math.round(perfStats.renderScale * 100)}%</span>
              <span>·</span>
              <span>{perfStats.activeLodLabel}</span>
            </div>
          )}
        </div>

        {/* Top-Right Corner Cluster: Utility Buttons + Live Spline Minimap with 3 AI Bots */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto shrink-0">
          <div
            className="flex flex-wrap justify-end items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl border border-white/15 shadow-xl max-w-[156px] sm:max-w-none"
            style={{ backgroundColor: 'rgba(10, 12, 16, 0.84)' }}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Cambiar Cámara (${cameraMode})`}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleCamera();
              }}
              className="px-2 sm:px-2.5 h-8 sm:h-9 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M4 6h3l2-2h6l2 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
              <span className="hidden md:inline">
                {cameraMode === 'chase'
                  ? 'Persecución [C]'
                  : cameraMode === 'cockpit'
                  ? 'Cabina V12 [C]'
                  : 'Capó [C]'}
              </span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Alternar Controles Táctiles"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchControls();
              }}
              className={`px-2 sm:px-2.5 h-8 sm:h-9 flex items-center gap-1 rounded-lg text-[11px] sm:text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                showTouchControls
                  ? 'bg-[#E11D2A] text-white'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <span>Táctil</span>
            </button>

            {onTogglePerfOverlay && (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Alternar Profiler de Rendimiento"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTogglePerfOverlay();
                }}
                className={`hidden sm:flex px-2.5 h-9 items-center gap-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  settings.showPerfOverlay
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                <span>FPS [P]</span>
              </button>
            )}

            <button
              type="button"
              tabIndex={-1}
              aria-label="Abrir Código Unity 6 C#"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenUnityBlueprint();
              }}
              className="px-2 sm:px-2.5 h-8 sm:h-9 flex items-center gap-1 rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white text-[11px] sm:text-xs font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="sm:hidden">C#</span>
              <span className="hidden sm:inline">Unity C# [U]</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Activar Audio' : 'Silenciar Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                {isMuted ? (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                ) : (
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Reiniciar Vuelta"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pausar Simulación"
              onClick={(e) => {
                e.currentTarget.blur();
                onPauseToggle();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          </div>

          {/* Dynamic F1 Circuit Spline Minimap with Player + 3 AI Bots */}
          <div
            className="hidden sm:flex flex-col items-center p-2.5 rounded-xl border border-white/15 shadow-xl"
            style={{ backgroundColor: 'rgba(10, 12, 16, 0.84)' }}
          >
            <svg
              viewBox="0 0 120 120"
              className="w-24 h-24 overflow-visible"
              aria-label={`Mapa del Circuito ${circuitSpec.shortName}`}
            >
              <path
                d={minimapData.d}
                fill="none"
                stroke="#334155"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path
                d={minimapData.d}
                fill="none"
                stroke="#F8FAFC"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle
                cx={minimapData.startX}
                cy={minimapData.startY}
                r="3.2"
                fill="#FACC15"
              />
              {/* 3 AI Bot Rivals */}
              {bots.map((b) => {
                const bx = ((b.x - minimapData.minX) / minimapData.width) * 120;
                const by = ((b.z - minimapData.minZ) / minimapData.height) * 120;
                return (
                  <circle
                    key={b.id}
                    cx={bx}
                    cy={by}
                    r="3.6"
                    fill={b.brandColorHex}
                    stroke="#0F172A"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Player Hypercar */}
              <circle
                cx={carMapX}
                cy={carMapY}
                r="5"
                fill="#E11D2A"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
              {circuitSpec.shortName.split('·')[0].trim()} · IA{' '}
              {settings.botDifficulty.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM PERIMETER ROW: Touch Controls + Scuderia F1 Digital Telemetry Cluster */}
      <div className="flex items-end justify-between gap-4">
        {showTouchControls || settings.controlScheme === 'wheel' ? (
          <div className="flex items-center gap-3 pointer-events-auto">
            {settings.controlScheme === 'wheel' ? (
              <div
                ref={wheelRef}
                role="slider"
                aria-label="Volante Virtual Táctil"
                aria-valuemin={-120}
                aria-valuemax={120}
                aria-valuenow={Math.round(virtualWheelDeg)}
                onPointerDown={(e) => {
                  isDraggingWheelRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  handleWheelPointerMove(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (!isDraggingWheelRef.current) return;
                  handleWheelPointerMove(e.clientX, e.clientY);
                }}
                onPointerUp={() => {
                  isDraggingWheelRef.current = false;
                  setVirtualWheelDeg(0);
                  onTouchInputChange({ steer: 0 });
                }}
                className="w-28 h-28 rounded-full bg-[#0E1117]/90 border-2 border-white/20 flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-24 h-24 transition-transform duration-75"
                  style={{ transform: `rotate(${virtualWheelDeg}deg)` }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#262A36"
                    strokeWidth="10"
                  />
                  <rect x="46" y="3" width="8" height="10" fill="#E11D2A" rx="2" />
                  <path
                    d="M12 46 L88 46 L88 56 L58 56 L58 88 L42 88 L42 56 L12 56 Z"
                    fill="#181B22"
                  />
                  <circle cx="50" cy="50" r="10" fill="#E11D2A" />
                </svg>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Girar Izquierda"
                  onPointerDown={() => onTouchInputChange({ steer: -1 })}
                  onPointerUp={() => onTouchInputChange({ steer: 0 })}
                  onPointerLeave={() => onTouchInputChange({ steer: 0 })}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border border-white/20 bg-[#12151E] active:bg-[#E11D2A] text-white font-bold text-xl flex items-center justify-center shadow-lg cursor-pointer"
                >
                  ◀
                </button>
                <button
                  type="button"
                  aria-label="Girar Derecha"
                  onPointerDown={() => onTouchInputChange({ steer: 1 })}
                  onPointerUp={() => onTouchInputChange({ steer: 0 })}
                  onPointerLeave={() => onTouchInputChange({ steer: 0 })}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border border-white/20 bg-[#12151E] active:bg-[#E11D2A] text-white font-bold text-xl flex items-center justify-center shadow-lg cursor-pointer"
                >
                  ▶
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            className="hidden lg:block px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-slate-300"
            style={{ backgroundColor: 'rgba(10, 12, 16, 0.78)' }}
          >
            WASD: Conducir · Q/E: Levas · T: Ciclo Solar · P: Profiler · U: Unity C#
          </div>
        )}

        {/* Scuderia V12 Digital Telemetry Dash */}
        <div
          className="ml-auto p-3.5 sm:px-5 sm:py-4 rounded-2xl border border-white/15 shadow-2xl pointer-events-auto min-w-[285px] sm:min-w-[360px]"
          style={{ backgroundColor: 'rgba(10, 12, 16, 0.90)' }}
        >
          {/* F1 12-Segment LED Shift Light Bar */}
          <div className="grid grid-cols-12 gap-1 mb-3">
            {Array.from({ length: 12 }).map((_, i) => {
              const threshold = (i + 1) / 12;
              const lit = rpmRatio >= threshold - 0.04;
              const segColor =
                i < 4 ? '#22C55E' : i < 8 ? '#FACC15' : '#E11D2A';
              return (
                <div
                  key={i}
                  className="h-2 rounded-xs transition-opacity"
                  style={{
                    backgroundColor: lit ? segColor : '#1E2330',
                    opacity: lit ? 1 : 0.4,
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Hero Speed Readout */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  data-testid="hud-speed-kmh"
                  className="text-4xl sm:text-5xl font-bold font-display tabular-nums text-white leading-none"
                >
                  {roundedSpeed}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  KM/H
                </span>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                {roundedRpm} RPM · {carSpec.shortName.toUpperCase()}
              </div>
            </div>

            {/* Active Sequential Gear Box */}
            <div className="flex items-center gap-1.5">
              {settings.manualTransmission && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Bajar Marcha [Q]"
                  onClick={() => onManualShift(-1)}
                  className="w-7 h-12 rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white font-mono font-bold text-xs cursor-pointer"
                >
                  -
                </button>
              )}

              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#161922] border border-white/15">
                <span className="text-[9px] font-mono text-slate-400 leading-none">
                  {settings.manualTransmission ? 'MANUAL' : 'MARCHA'}
                </span>
                <span
                  data-testid="hud-gear"
                  className="text-2xl font-bold font-display text-[#E11D2A] leading-tight mt-0.5"
                >
                  {telemetry.vzLocal < -0.5 ? 'R' : telemetry.gear}
                </span>
              </div>

              {settings.manualTransmission && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Subir Marcha [E]"
                  onClick={() => onManualShift(1)}
                  className="w-7 h-12 rounded-lg bg-white/10 hover:bg-[#E11D2A] text-white font-mono font-bold text-xs cursor-pointer"
                >
                  +
                </button>
              )}
            </div>

            {/* Brake Disc Thermal Glow & G-Force Meter */}
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400">
                FRENOS · CHASIS {roundedIntegrity}%
              </div>
              <div
                className="text-sm font-mono font-bold tabular-nums mt-0.5"
                style={{
                  color:
                    roundedBrakeTemp > 650
                      ? '#EF4444'
                      : roundedBrakeTemp > 400
                      ? '#F59E0B'
                      : '#E2E8F0',
                }}
              >
                {roundedBrakeTemp} °C
              </div>
              <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-1">
                {telemetry.lateralG.toFixed(1)}G LAT · {telemetry.longitudinalG.toFixed(1)}G LON
              </div>
            </div>
          </div>
        </div>

        {/* Touch / Mobile Pedals */}
        {(showTouchControls || settings.controlScheme === 'wheel') && (
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              aria-label="Freno"
              onPointerDown={() => onTouchInputChange({ brake: 1 })}
              onPointerUp={() => onTouchInputChange({ brake: 0 })}
              onPointerLeave={() => onTouchInputChange({ brake: 0 })}
              className="w-15 h-20 rounded-2xl border border-white/20 bg-[#1B161A] active:bg-[#E11D2A] text-white font-mono font-bold text-xs flex flex-col items-center justify-center shadow-lg cursor-pointer"
            >
              <span>FRENO</span>
            </button>
            <button
              type="button"
              aria-label="Acelerador"
              onPointerDown={() => onTouchInputChange({ throttle: 1 })}
              onPointerUp={() => onTouchInputChange({ throttle: 0 })}
              onPointerLeave={() => onTouchInputChange({ throttle: 0 })}
              className="w-16 h-24 rounded-2xl border border-[#E11D2A]/50 bg-[#18221D] active:bg-[#16A34A] text-white font-mono font-bold text-xs flex flex-col items-center justify-center shadow-lg cursor-pointer"
            >
              <span>GAS</span>
            </button>
          </div>
        )}
      </div>

      {/* PAUSE MODAL */}
      {gameState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Simulación en Pausa"
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(6, 7, 10, 0.82)' }}
        >
          <div className="w-full max-w-md bg-[#0E1117] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <p className="text-xs font-mono text-[#E11D2A] tracking-wider uppercase">
              TELEMETRÍA CONGELADA · {circuitSpec.name}
            </p>
            <h2 className="text-2xl font-bold font-display text-white mt-1">
              Simulación en Pausa
            </h2>

            <div className="grid grid-cols-3 gap-2.5 my-5">
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">POSICIÓN</div>
                <div className="text-lg font-bold font-mono tabular-nums text-[#FACC15] mt-0.5">
                  {bots.length > 0 ? `P${racePosition}/${bots.length + 1}` : 'SOLO'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">MEJOR VUELTA</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[#FACC15] mt-1">
                  {formatLapTime(telemetry.bestLapTimeMs)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">VEL. MÁXIMA</div>
                <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                  {Math.round(telemetry.maxSpeedKmhReached)} km/h
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onPauseToggle}
                className="w-full py-3 bg-[#E11D2A] hover:bg-[#c81521] text-white font-display font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Reanudar Carrera [Esc]
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reiniciar desde Parrilla
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 bg-transparent hover:bg-white/5 text-slate-300 border border-white/10 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Volver al Menú Principal y Taller 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / SESSION COMPLETE MODAL */}
      {gameState === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sesión Completada"
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(6, 7, 10, 0.86)' }}
        >
          <div className="w-full max-w-md bg-[#0E1117] border border-[#E11D2A]/50 rounded-2xl p-6 shadow-2xl">
            <p className="text-xs font-mono text-[#FACC15] tracking-wider uppercase">
              BANDERA A CUADROS · {circuitSpec.shortName}
            </p>
            <h2 className="text-2xl font-bold font-display text-white mt-1">
              Sesión en Pista Finalizada
            </h2>

            <div className="grid grid-cols-3 gap-2.5 my-5">
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">POS. FINAL</div>
                <div className="text-lg font-bold font-mono tabular-nums text-[#FACC15] mt-0.5">
                  {bots.length > 0 ? `P${racePosition}/${bots.length + 1}` : 'SOLO'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">MEJOR VUELTA</div>
                <div className="text-sm font-bold font-mono tabular-nums text-[#FACC15] mt-1">
                  {formatLapTime(telemetry.bestLapTimeMs)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#151922] border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">VEL. PUNTA</div>
                <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                  {Math.round(telemetry.maxSpeedKmhReached)} km/h
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="w-full py-3 bg-[#E11D2A] hover:bg-[#c81521] text-white font-display font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Correr de Nuevo
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Volver al Menú Principal y Taller 3D
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
