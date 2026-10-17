import React, { useState } from 'react';
import {
  BotDifficultyTier,
  CALIPER_COLOR_PRESETS,
  CarCustomizationState,
  CIRCUIT_CATALOG,
  CircuitTrackId,
  ControlSchemeType,
  FINISH_TYPE_SPECS,
  getCircuitSpec,
  getHypercarSpec,
  GRAPHICS_QUALITY_SPECS,
  GameSettingsState,
  GraphicsQualityTier,
  HYPERCAR_CATALOG,
  HypercarModelId,
  LightingCycleMode,
  PAINT_PRESETS,
  PaintFinishType,
  RIM_COLOR_PRESETS,
  RaceGameMode,
  SurfaceCondition,
  VINYL_LIVERY_PRESETS,
  VinylLiveryId,
} from '../game/physics';

interface TitleScreenOverlayProps {
  customization: CarCustomizationState;
  onUpdateCustomization: (patch: Partial<CarCustomizationState>) => void;
  settings: GameSettingsState;
  onUpdateSettings: (patch: Partial<GameSettingsState>) => void;
  surface: SurfaceCondition;
  onToggleSurface: (surface: SurfaceCondition) => void;
  onCalibrateGyro: () => void;
  onStartRace: () => void;
  onOpenUnityBlueprint: () => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  customization,
  onUpdateCustomization,
  settings,
  onUpdateSettings,
  surface,
  onToggleSurface,
  onCalibrateGyro,
  onStartRace,
  onOpenUnityBlueprint,
}) => {
  const [activeTab, setActiveTab] = useState<'race' | 'garage' | 'settings'>('race');
  const [gyroCalibratedMsg, setGyroCalibratedMsg] = useState(false);

  const activePaintObj =
    PAINT_PRESETS.find((p) => p.id === customization.paintId) || PAINT_PRESETS[0];
  const activeQualitySpec = GRAPHICS_QUALITY_SPECS[settings.quality];
  const activeCarSpec = getHypercarSpec(settings.selectedCarId);
  const activeCircuitSpec = getCircuitSpec(settings.selectedTrackId);

  const handleSelectCar = (carId: HypercarModelId) => {
    const spec = getHypercarSpec(carId);
    const defaultPaint =
      PAINT_PRESETS.find((p) => p.id === spec.defaultPaintId) || PAINT_PRESETS[0];
    onUpdateSettings({ selectedCarId: carId });
    onUpdateCustomization({
      paintId: defaultPaint.id,
      paintHex: defaultPaint.hex,
      flakeHex: defaultPaint.flakeHex,
      finishType: spec.defaultFinish,
      vinylLivery: spec.defaultLivery,
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-7 lg:p-10 pointer-events-none">
      {/* Left-Third Asymmetric Negative-Space Main Menu & Garage Panel */}
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col rounded-2xl border border-white/15 shadow-2xl pointer-events-auto overflow-hidden"
        style={{ backgroundColor: 'rgba(9, 11, 15, 0.90)' }}
      >
        {/* Custom Inline SVG Emblem & Title Lockup */}
        <div className="p-4 sm:p-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <svg
              viewBox="0 0 56 64"
              className="w-10 h-11 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M28 2 L52 10 L52 32 C52 47 41 57 28 62 C15 57 4 47 4 32 L4 10 Z"
                fill="#12141A"
                stroke="#E11D2A"
                strokeWidth="2.5"
              />
              <path d="M10 12 L22 12 L22 15 L10 15 Z" fill="#16A34A" />
              <path d="M22 12 L34 12 L34 15 L22 15 Z" fill="#F8FAFC" />
              <path d="M34 12 L46 12 L46 15 L34 15 Z" fill="#E11D2A" />
              <path
                d="M15 24 L28 46 L41 24 L35 24 L28 36 L21 24 Z"
                fill="#E11D2A"
              />
              <path
                d="M22 48 L28 54 L34 48"
                fill="none"
                stroke="#FACC15"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-white leading-none">
                ROSSO CORSA GT
              </h1>
              <p className="text-[11px] font-mono text-slate-300 mt-1">
                FASE 4 · 4 AUTOS · 4 PISTAS F1 · 60 FPS RTX
              </p>
            </div>
          </div>

          {/* 3-Tab Navigation (Carrera | Taller PBR | Ajustes RTX) */}
          <div className="grid grid-cols-3 gap-1.5 mt-3.5 p-1 bg-[#12151E] rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('race')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'race'
                  ? 'bg-[#E11D2A] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1. Carrera
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('garage')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'garage'
                  ? 'bg-[#E11D2A] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2. Taller 3D
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#E11D2A] text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3. Ajustes
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
          {/* TAB 1: RACE CONFIGURATION (4 Hypercars + 4 F1 Circuits + Sky + Bots) */}
          {activeTab === 'race' && (
            <>
              {/* 1. Phase 4 Hypercar Selector (4 Models) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    Hiperdeportivo (4 Modelos)
                  </span>
                  <span className="font-mono text-[#FACC15] text-[10px]">
                    {activeCarSpec.powerHp} CV · {activeCarSpec.massKg} kg ·{' '}
                    {activeCarSpec.topSpeedKmh} km/h
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {HYPERCAR_CATALOG.map((car) => {
                    const isSelected = settings.selectedCarId === car.id;
                    return (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => handleSelectCar(car.id)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1D2230] border-[#E11D2A] text-white'
                            : 'bg-[#12151C] border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white truncate">
                          {car.shortName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {car.powerHp} CV · {car.engineLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Phase 4 F1 Circuit Selector (Monza, Monaco, Spa, Suzuka) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    Circuito F1 (Streaming Aditivo)
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {activeCircuitSpec.lengthKm} · {activeCircuitSpec.cornersCount} curvas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CIRCUIT_CATALOG.map((track) => {
                    const isSelected = settings.selectedTrackId === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ selectedTrackId: track.id as CircuitTrackId })
                        }
                        className={`py-1.5 px-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                            : 'bg-[#12151C] border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">
                          {track.shortName}
                        </div>
                        <div className="text-[10px] font-mono opacity-80 truncate">
                          {track.lengthKm} · {track.cornersCount} curvas
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Game Mode & Bot Difficulty */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs text-slate-300 font-medium mb-1">
                    Modo de Partida
                  </span>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#12151C] rounded-lg border border-white/10">
                    {(
                      [
                        { id: 'quick_race', label: 'Carrera' },
                        { id: 'time_trial', label: 'Reloj' },
                        { id: 'championship', label: 'Copa' },
                      ] as { id: RaceGameMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onUpdateSettings({ raceMode: m.id })}
                        className={`py-1 px-1 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                          settings.raceMode === m.id
                            ? 'bg-[#E11D2A] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-300 font-medium mb-1">
                    Nivel Bots IA
                  </span>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#12151C] rounded-lg border border-white/10">
                    {(
                      [
                        { id: 'facil', label: 'Fácil' },
                        { id: 'medio', label: 'Med' },
                        { id: 'dificil', label: 'Dif' },
                        { id: 'pro', label: 'Pro' },
                      ] as { id: BotDifficultyTier; label: string }[]
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onUpdateSettings({ botDifficulty: b.id })}
                        className={`py-1 px-1 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                          settings.botDifficulty === b.id
                            ? 'bg-white/15 text-white border border-[#E11D2A]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Celestial Cycle & Asphalt Condition */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">
                  <span className="block text-xs text-slate-300 font-medium mb-1">
                    Ciclo Celeste y Nubes
                  </span>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-[#12151C] rounded-lg border border-white/10">
                    {(
                      [
                        { id: 'dynamic', label: 'Dinámico' },
                        { id: 'day', label: 'Día' },
                        { id: 'sunset', label: 'Tarde' },
                        { id: 'night', label: 'Noche' },
                      ] as { id: LightingCycleMode; label: string }[]
                    ).map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => onUpdateSettings({ lightingPreset: l.id })}
                        className={`py-1 px-1 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                          settings.lightingPreset === l.id
                            ? 'bg-[#E11D2A] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-5">
                  <span className="block text-xs text-slate-300 font-medium mb-1">
                    Asfalto (SSR)
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#12151C] rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => onToggleSurface('dry')}
                      className={`py-1 px-1.5 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                        surface === 'dry'
                          ? 'bg-[#E11D2A] text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Seco
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSurface('wet')}
                      className={`py-1 px-1.5 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                        surface === 'wet'
                          ? 'bg-[#E11D2A] text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Mojado
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TALLER DE PERSONALIZACIÓN (Paint, Finish, Rims, Calipers, Vinyls) */}
          {activeTab === 'garage' && (
            <>
              {/* Quick Car Switcher inside Garage */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">
                    Chasis en Taller 3D (LOD0)
                  </span>
                  <span className="font-mono text-[#FACC15] text-[11px]">
                    {activeCarSpec.name}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#12151C] rounded-lg border border-white/10">
                  {HYPERCAR_CATALOG.map((car) => (
                    <button
                      key={car.id}
                      type="button"
                      onClick={() => handleSelectCar(car.id)}
                      className={`py-1.5 px-1.5 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                        settings.selectedCarId === car.id
                          ? 'bg-[#E11D2A] text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {car.shortName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Paint Color */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">
                    Color de Carrocería Multicapa
                  </span>
                  <span className="font-mono text-white font-semibold">
                    {activePaintObj.name}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {PAINT_PRESETS.map((preset) => {
                    const isSelected = customization.paintId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.name}
                        aria-label={`Pintura ${preset.name}`}
                        onClick={() =>
                          onUpdateCustomization({
                            paintId: preset.id,
                            paintHex: preset.hex,
                            flakeHex: preset.flakeHex,
                          })
                        }
                        className={`h-8 rounded-lg border-2 transition-transform cursor-pointer ${
                          isSelected
                            ? 'border-white scale-105 shadow-md'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 2. Surface Finish (Brillante, Satinado, Mate, Platinado) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">
                    Acabado de Barniz (Clearcoat PBR)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'gloss', short: 'Brillante' },
                      { id: 'satin', short: 'Satinado' },
                      { id: 'matte', short: 'Mate' },
                      { id: 'platinum', short: 'Platinado' },
                    ] as { id: PaintFinishType; short: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdateCustomization({ finishType: f.id })}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-left ${
                        customization.finishType === f.id
                          ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                          : 'bg-[#12151C] border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      {f.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Rims & Brake Calipers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-300 font-medium mb-1.5">
                    Rines Forjados
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RIM_COLOR_PRESETS.map((rim) => (
                      <button
                        key={rim.id}
                        type="button"
                        onClick={() =>
                          onUpdateCustomization({
                            rimColorId: rim.id,
                            rimHex: rim.hex,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                          customization.rimColorId === rim.id
                            ? 'bg-white/15 border-white text-white'
                            : 'bg-[#12151C] border-white/10 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: rim.hex }}
                        />
                        <span className="truncate">{rim.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs text-slate-300 font-medium mb-1.5">
                    Calipers Brembo
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CALIPER_COLOR_PRESETS.map((cal) => (
                      <button
                        key={cal.id}
                        type="button"
                        onClick={() =>
                          onUpdateCustomization({
                            caliperColorId: cal.id,
                            caliperHex: cal.hex,
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                          customization.caliperColorId === cal.id
                            ? 'bg-white/15 border-white text-white'
                            : 'bg-[#12151C] border-white/10 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: cal.hex }}
                        />
                        <span className="truncate">{cal.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Racing Vinyl Liveries */}
              <div>
                <span className="block text-xs text-slate-300 font-medium mb-1.5">
                  Vinilos de Competición
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {VINYL_LIVERY_PRESETS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        onUpdateCustomization({
                          vinylLivery: v.id as VinylLiveryId,
                        })
                      }
                      className={`py-1.5 px-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        customization.vinylLivery === v.id
                          ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                          : 'bg-[#12151C] border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{v.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: AJUSTES GRÁFICOS RTX, OPTIMIZACIÓN MÓVIL Y CONTROLES */}
          {activeTab === 'settings' && (
            <>
              {/* 1. Graphics Quality Tier */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">
                    Calidad Gráfica URP
                  </span>
                  <span className="font-mono text-[#FACC15] text-[11px]">
                    {activeQualitySpec.targetFpsLabel}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['baja', 'media', 'alta', 'ultra'] as GraphicsQualityTier[]).map(
                    (q) => {
                      const isSelected = settings.quality === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => onUpdateSettings({ quality: q })}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg border uppercase transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                              : 'bg-[#12151C] border-white/10 text-slate-300 hover:text-white'
                          }`}
                        >
                          {q}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* 2. Phase 4 Mobile Optimization: Dynamic Resolution & Device Profiler */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      dynamicResolution: !settings.dynamicResolution,
                    })
                  }
                  className={`py-2 px-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    settings.dynamicResolution
                      ? 'bg-white/15 border-[#E11D2A] text-white'
                      : 'bg-[#12151C] border-white/10 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-semibold">
                    Escala Dinámica {settings.dynamicResolution ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-[10px] font-mono opacity-80">
                    Ajuste auto 60 FPS
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      showPerfOverlay: !settings.showPerfOverlay,
                    })
                  }
                  className={`py-2 px-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    settings.showPerfOverlay
                      ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                      : 'bg-[#12151C] border-white/10 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold">
                    Profiler FPS/LOD {settings.showPerfOverlay ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-[10px] font-mono opacity-80">
                    Telemetría GPU [P]
                  </div>
                </button>
              </div>

              {/* 3. Control Type & Gyroscope Calibration */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">
                    Esquema de Control Móvil / PC
                  </span>
                  {settings.controlScheme === 'gyroscope' && (
                    <button
                      type="button"
                      onClick={() => {
                        onCalibrateGyro();
                        setGyroCalibratedMsg(true);
                        setTimeout(() => setGyroCalibratedMsg(false), 1800);
                      }}
                      className="text-[11px] font-mono text-[#FACC15] hover:underline cursor-pointer"
                    >
                      {gyroCalibratedMsg ? '¡Giroscopio Calibrado!' : 'Calibrar Cero'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'buttons', label: 'Botones / Teclado' },
                      { id: 'wheel', label: 'Volante Virtual' },
                      { id: 'gyroscope', label: 'Giroscopio' },
                    ] as { id: ControlSchemeType; label: string }[]
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onUpdateSettings({ controlScheme: c.id })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer truncate ${
                        settings.controlScheme === c.id
                          ? 'bg-[#E11D2A] border-[#E11D2A] text-white'
                          : 'bg-[#12151C] border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Steering Sensitivity & Transmission Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="steer-sens-slider"
                    className="flex items-center justify-between text-xs text-slate-300 mb-1"
                  >
                    <span>Sensibilidad</span>
                    <span className="font-mono text-white">
                      {settings.steeringSensitivity.toFixed(2)}x
                    </span>
                  </label>
                  <input
                    id="steer-sens-slider"
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={settings.steeringSensitivity}
                    onChange={(e) =>
                      onUpdateSettings({
                        steeringSensitivity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-[#E11D2A] cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-xs text-slate-300 mb-1">
                    Caja Secuencial 7V
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#12151C] rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ manualTransmission: false })
                      }
                      className={`py-1 px-1.5 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                        !settings.manualTransmission
                          ? 'bg-[#E11D2A] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ manualTransmission: true })
                      }
                      className={`py-1 px-1.5 text-[11px] font-semibold rounded transition-colors cursor-pointer truncate ${
                        settings.manualTransmission
                          ? 'bg-[#E11D2A] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Manual [Q/E]
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Master Volume */}
              <div>
                <label
                  htmlFor="audio-vol-slider"
                  className="flex items-center justify-between text-xs text-slate-300 mb-1"
                >
                  <span>Volumen Maestro Motor V12</span>
                  <span className="font-mono text-white">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </label>
                <input
                  id="audio-vol-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={(e) =>
                    onUpdateSettings({
                      masterVolume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[#E11D2A] cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer CTA Actions inside Card */}
        <div className="p-4 sm:p-5 pt-3 border-t border-white/10 bg-[#0A0C10] flex flex-col gap-2">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartRace();
            }}
            className="w-full py-2.5 px-5 bg-[#E11D2A] hover:bg-[#c81521] text-white font-display font-bold text-base tracking-wide rounded-xl shadow-lg transition-transform active:scale-[0.99] cursor-pointer whitespace-nowrap"
          >
            SALIR A PISTA · FASE 4
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenUnityBlueprint();
            }}
            className="w-full py-2 px-4 bg-[#161922] hover:bg-[#1E222E] text-slate-200 border border-white/15 font-mono text-xs font-semibold rounded-xl transition-colors cursor-pointer truncate"
          >
            Arquitectura C# · Unity 6 URP [U]
          </button>
        </div>
      </div>

      {/* Bottom Safe-Margin Flat Inline Control Hint */}
      <div className="w-full flex items-center justify-between text-xs text-slate-300 font-mono hud-text-stroke">
        <span>
          WASD Conducir · Q/E Levas · T Ciclo Solar · P Profiler · C Cámara
        </span>
        <span className="hidden md:inline">
          {activeCarSpec.shortName.toUpperCase()} · {activeCircuitSpec.shortName.toUpperCase()} · 60 FPS RTX
        </span>
      </div>
    </div>
  );
};
