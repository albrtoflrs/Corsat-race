import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTrackSamples,
  CIRCUIT_CATALOG,
  computeRacePosition,
  createInitialBots,
  createInitialVehicleState,
  DRY_PACEJKA,
  WET_PACEJKA,
  evaluateCombinedPacejkaGrip,
  evaluatePacejkaNormalized,
  evaluateSkyState,
  evaluateWindState,
  formatLapTime,
  HYPERCAR_CATALOG,
  stepBotVehicles,
  stepVehiclePhysics,
} from './physics.ts';

test('Pacejka tire model yields higher peak grip on dry asphalt than wet asphalt', () => {
  const dryPeak = evaluatePacejkaNormalized(0.14, DRY_PACEJKA);
  const wetPeak = evaluatePacejkaNormalized(0.14, WET_PACEJKA);

  assert.ok(dryPeak > wetPeak, `Expected dryPeak (${dryPeak}) > wetPeak (${wetPeak})`);
  assert.ok(dryPeak > 1.5, 'Dry slick tire should exceed 1.5G normalized friction');
});

test('Combined Pacejka friction ellipse caps total force vector to physical tire limit', () => {
  const normalLoadN = 8000;
  const { fx, fy } = evaluateCombinedPacejkaGrip(0.25, 0.25, normalLoadN, DRY_PACEJKA);
  const totalForce = Math.hypot(fx, fy);
  const maxTheoretical = normalLoadN * DRY_PACEJKA.D * 1.001;

  assert.ok(
    totalForce <= maxTheoretical,
    `Combined tire force (${totalForce}) must not exceed friction circle (${maxTheoretical})`
  );
});

test('Vehicle accelerates, activates DRS above 145 km/h on straight, and shifts gears up', () => {
  const samples = buildTrackSamples(16, 'monza');
  let state = createInitialVehicleState('monza', 'ferrari_f80');

  for (let i = 0; i < 360; i++) {
    state = stepVehiclePhysics(
      state,
      {
        throttle: 1.0,
        brake: 0,
        steer: 0,
        handbrake: false,
        absEnabled: true,
        tcsEnabled: true,
        surface: 'dry',
        carModelId: 'ferrari_f80',
      },
      1 / 60,
      samples
    );
  }

  assert.ok(state.speedKmh > 155, `Expected speed > 155 km/h after 6s, got ${state.speedKmh}`);
  assert.ok(state.gear >= 3, `Expected automatic upshift to >= 3rd gear, got ${state.gear}`);
  assert.ok(state.drsActive, 'Expected DRS to activate on high-speed full-throttle straight');
});

test('Manual transmission honors shiftUp and shiftDown paddle inputs', () => {
  const samples = buildTrackSamples(12, 'monza');
  let state = createInitialVehicleState('monza', 'ferrari_f80');

  state = stepVehiclePhysics(
    state,
    {
      throttle: 0.8,
      brake: 0,
      steer: 0,
      handbrake: false,
      absEnabled: true,
      tcsEnabled: true,
      surface: 'dry',
      manualTransmission: true,
      shiftUpRequested: true,
    },
    1 / 60,
    samples
  );
  assert.equal(state.gear, 2, 'Manual shiftUpRequested should shift from 1st to 2nd');

  state = stepVehiclePhysics(
    state,
    {
      throttle: 0.5,
      brake: 0,
      steer: 0,
      handbrake: false,
      absEnabled: true,
      tcsEnabled: true,
      surface: 'dry',
      manualTransmission: true,
      shiftDownRequested: true,
    },
    1 / 60,
    samples
  );
  assert.equal(state.gear, 1, 'Manual shiftDownRequested should shift from 2nd back to 1st');
});

test('Collision with barrier triggers chassis integrity loss and visual deformation state', () => {
  const samples = buildTrackSamples(12, 'monza');
  let state = createInitialVehicleState('monza', 'ferrari_f80');
  state.vzLocal = 48;
  state.x = 25;

  state = stepVehiclePhysics(
    state,
    {
      throttle: 1.0,
      brake: 0,
      steer: -1.0,
      handbrake: false,
      absEnabled: true,
      tcsEnabled: true,
      surface: 'dry',
    },
    1 / 30,
    samples
  );

  assert.ok(state.chassisIntegrity < 100, 'Expected barrier impact to reduce chassisIntegrity below 100%');
});

test('Phase 3 Sky & Day/Night cycle computes high sun at noon and starfield at midnight', () => {
  const noonSky = evaluateSkyState(12.0);
  const midnightSky = evaluateSkyState(0.0);
  const wind = evaluateWindState(10.5);

  assert.ok(noonSky.sunElevation > 0.9, 'Sun should be near zenith at 12:00');
  assert.equal(noonSky.starfieldOpacity, 0, 'Stars should be invisible at noon');
  assert.equal(noonSky.phaseLabel, 'DÍA SOLAR');

  assert.ok(midnightSky.sunElevation < -0.9, 'Sun should be below nadir at 00:00');
  assert.ok(midnightSky.starfieldOpacity > 0.9, 'Starfield should be visible at midnight');
  assert.equal(midnightSky.phaseLabel, 'NOCHE ESTELAR');

  assert.ok(wind.speedKmh >= 18 && wind.speedKmh <= 35, 'Wind speed should stay within realistic range');
});

test('Phase 3 AI Bots advance along spline and Pro bots outpace Facil bots', () => {
  const samples = buildTrackSamples(16, 'monza');
  const player = createInitialVehicleState('monza', 'ferrari_f80');
  let botsFacil = createInitialBots(samples);
  let botsPro = createInitialBots(samples);

  for (let i = 0; i < 60; i++) {
    botsFacil = stepBotVehicles(botsFacil, player, 1 / 30, samples, 'facil', 'dry');
    botsPro = stepBotVehicles(botsPro, player, 1 / 30, samples, 'pro', 'dry');
  }

  assert.ok(
    botsPro[0].trackProgress > botsFacil[0].trackProgress,
    'Pro difficulty bots should cover more track distance than Facil bots'
  );
  const pos = computeRacePosition(player, botsPro);
  assert.equal(pos, 4, 'Stationary player at start should be in P4 behind the 3 advancing bots');
});

test('Phase 4 Catalogs provide 4 hypercars and 4 valid closed F1 circuit splines', () => {
  assert.equal(HYPERCAR_CATALOG.length, 4, 'Should include 4 selectable hypercars');
  assert.equal(CIRCUIT_CATALOG.length, 4, 'Should include 4 selectable F1 circuits');

  for (const circuit of CIRCUIT_CATALOG) {
    const samples = buildTrackSamples(16, circuit.id);
    assert.ok(samples.length > 100, `Circuit ${circuit.id} should generate >100 spline samples`);
    const totalLength = samples[samples.length - 1].lengthAccum;
    assert.ok(totalLength > 800, `Circuit ${circuit.id} should have realistic track length`);
  }
});

test('Lap time formatter formats milliseconds cleanly', () => {
  assert.equal(formatLapTime(null), '--:--.---');
  assert.equal(formatLapTime(83456), '1:23.456');
});
