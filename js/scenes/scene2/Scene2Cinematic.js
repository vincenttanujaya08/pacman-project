// Scene2Cinematic Patched Version
// Dengan LookBack Fix + Hold + Camera Effects (shake, breathing, zoom, noise)

export default class Scene2Cinematic {
  constructor(
    camera,
    cameraMode,
    ghostModel,
    ghostController,
    ghostSpotlight,
    ghostPointLight,
    ghostRings
  ) {
    this.camera = camera;
    this.cameraMode = cameraMode;
    this.ghostModel = ghostModel;
    this.ghostController = ghostController;
    this.ghostSpotlight = ghostSpotlight;
    this.ghostPointLight = ghostPointLight;
    this.ghostRings = ghostRings;

    this.isPlaying = false;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // LookBack fix
    this.hasLookedBack = false;
    this.lookBackHold = 0.25; // tahan 25% durasi

    // Camera Effects State
    this.shakeIntensity = 0;
    this.noiseIntensity = 0.002;
    this.breathAmp = 0.02;
    this.zoomAmount = 1;
    this.zoomTarget = 1;

    // Keyframes
    this.sequence = [
      {
        type: "move_forward",
        duration: 3000,
        fromPos: { x: -7.29, y: 7542.8, z: 108.6 },
        toPos: { x: -7.29, y: 7542.8, z: 115 },
        fromYaw: 0.136,
        toYaw: 0.136,
        fromPitch: 0.058,
        toPitch: 0.058,
      },
      {
        type: "turn_left",
        duration: 1500,
        fromPos: { x: -7.29, y: 7542.8, z: 115 },
        toPos: { x: -7.29, y: 7542.8, z: 115 },
        fromYaw: 0.136,
        toYaw: -0.758,
        fromPitch: 0.058,
        toPitch: 0.004,
      },
      {
        type: "turn_right",
        duration: 2500,
        fromPos: { x: -7.29, y: 7542.8, z: 115 },
        toPos: { x: -7.29, y: 7542.8, z: 115 },
        fromYaw: -0.758,
        toYaw: 1.28,
        fromPitch: 0.004,
        toPitch: -0.008,
        ghostFadeIn: true,
      },
      {
        type: "snap_back",
        duration: 400,
        fromPos: { x: -7.29, y: 7542.8, z: 115 },
        toPos: { x: -7.29, y: 7542.8, z: 115 },
        fromYaw: 1.28,
        toYaw: 0.136,
        fromPitch: -0.008,
        toPitch: 0.058,
      },
      {
        type: "run_forward",
        duration: 8000,
        fromPos: { x: -7.29, y: 7542.8, z: 115 },
        toPos: { x: 6.81, y: 7543.89, z: 218.99 },
        fromYaw: 0.136,
        toYaw: 0.104,
        fromPitch: 0.058,
        toPitch: 0.276,

        // look back once
        lookBackAt: 4000,
        lookBackDuration: 1200,
      },
    ];

    // Ghost fade settings
    this.ghostFadeOpacity = 0;
    this.ghostFading = false;
    this.ghostFadeElapsed = 0;
    this.ghostFadeDuration = 1500;

    this.isLookingBack = false;
    this.lookBackElapsed = 0;
    this.lookBackStartYaw = 0;
    this.lookBackStartPitch = 0;
  }

  start() {
    if (this.isPlaying) return;

    console.log("🎬 Scene2 Cinematic Started!");
    this.isPlaying = true;
    this.currentStep = 0;
    this.stepElapsed = 0;
    this.ghostFadeOpacity = 0;
    this.ghostFading = false;
    this.isLookingBack = false;
    this.hasLookedBack = false;

    // Hide ghost initially
    if (this.ghostModel) {
      this.ghostModel.visible = false;
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.visible = true;
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });
    }
    if (this.ghostSpotlight) {
      this.ghostSpotlight.visible = false;
      this.ghostSpotlight.intensity = 0;
    }
    if (this.ghostPointLight) {
      this.ghostPointLight.visible = false;
      this.ghostPointLight.intensity = 0;
    }
    this.ghostRings.forEach((ring) => {
      ring.visible = false;
      ring.material.opacity = 0;
    });

    // Disable camera input
    if (this.cameraMode) {
      for (const key in this.cameraMode.keys) this.cameraMode.keys[key] = false;
    }

    // Init camera pos
    const first = this.sequence[0];
    this.camera.position.set(first.fromPos.x, first.fromPos.y, first.fromPos.z);

    if (this.cameraMode && this.cameraMode.mode === "fps") {
      this.cameraMode.fps.yaw = first.fromYaw;
      this.cameraMode.fps.pitch = first.fromPitch;
      this.cameraMode.playerPosition.copy(this.camera.position);
    }
  }

  stop() {
    this.isPlaying = false;
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    if (this.currentStep >= this.sequence.length) {
      console.log("🎬 Cinematic Complete!");
      this.isPlaying = false;
      return;
    }

    const step = this.sequence[this.currentStep];
    this.stepElapsed += deltaTime;

    const t = Math.min(this.stepElapsed / step.duration, 1);
    const easedT = this.easeInOutCubic(t);

    // Interpolate position
    const pos = {
      x: this.lerp(step.fromPos.x, step.toPos.x, easedT),
      y: this.lerp(step.fromPos.y, step.toPos.y, easedT),
      z: this.lerp(step.fromPos.z, step.toPos.z, easedT),
    };

    // Breathing sway (halus)
    pos.y += Math.sin(performance.now() * 0.002) * this.breathAmp;

    // Running step bounce
    if (step.type === "run_forward") {
      const variation = Math.sin(easedT * Math.PI * 4) * 0.3;
      pos.y += variation;
    }

    this.camera.position.set(pos.x, pos.y, pos.z);

    // LOOK BACK FIX — Only once
    if (
      step.type === "run_forward" &&
      !this.hasLookedBack &&
      this.stepElapsed >= step.lookBackAt &&
      !this.isLookingBack
    ) {
      this.isLookingBack = true;
      this.hasLookedBack = true;

      this.lookBackElapsed = 0;
      this.lookBackStartYaw = this.lerp(step.fromYaw, step.toYaw, easedT);
      this.lookBackStartPitch = this.lerp(step.fromPitch, step.toPitch, easedT);

      // Zoom in saat lihat hantu
      this.zoomTarget = 0.85;

      console.log("👀 Looking back at ghost!");
    }

    // ROTATION
    let yaw, pitch;

    if (this.isLookingBack && step.type === "run_forward") {
      this.lookBackElapsed += deltaTime;
      const lbT = Math.min(this.lookBackElapsed / step.lookBackDuration, 1);

      const half = 0.5;
      const hold = this.lookBackHold;

      if (lbT < half) {
        // rotate 180°
        const k = this.easeInOutCubic(lbT / half);
        yaw = this.lerp(
          this.lookBackStartYaw,
          this.lookBackStartYaw + Math.PI,
          k
        );
        pitch = this.lerp(this.lookBackStartPitch, 0, k);
      } else if (lbT < half + hold) {
        // HOLD menghadap belakang
        yaw = this.lookBackStartYaw + Math.PI;
        pitch = 0;
      } else {
        // kembali menghadap depan
        const k = (lbT - (half + hold)) / (1 - (half + hold));
        const e = this.easeInOutCubic(k);

        yaw = this.lerp(
          this.lookBackStartYaw + Math.PI,
          this.lookBackStartYaw,
          e
        );
        pitch = this.lerp(0, this.lookBackStartPitch, e);
      }

      if (lbT >= 1) {
        this.isLookingBack = false;
        this.zoomTarget = 1; // zoom kembali normal
        console.log("➡️ LookBack end");
      }
    } else {
      yaw = this.lerp(step.fromYaw, step.toYaw, easedT);
      pitch = this.lerp(step.fromPitch, step.toPitch, easedT);
    }

    // CAMERA EFFECTS — Shake + Noise + Zoom
    this.applyCameraEffects(deltaTime, yaw, pitch);

    // Ghost fade
    if (step.ghostFadeIn && !this.ghostFading) {
      this.ghostFading = true;
      this.ghostFadeElapsed = 0;

      if (this.ghostModel) this.ghostModel.visible = true;
      if (this.ghostSpotlight) this.ghostSpotlight.visible = true;
      if (this.ghostPointLight) this.ghostPointLight.visible = true;
      this.ghostRings.forEach((r) => (r.visible = true));
    }

    if (this.ghostFading) {
      this.updateGhostFade(deltaTime);
    }

    // NEXT step
    if (t >= 1) {
      this.currentStep++;
      this.stepElapsed = 0;
    }
  }

  applyCameraEffects(dt, yaw, pitch) {
    // Smooth interpolation zoom
    this.zoomAmount += (this.zoomTarget - this.zoomAmount) * 0.05;

    // Camera noise jitter
    const jitterYaw = (Math.random() - 0.5) * this.noiseIntensity;
    const jitterPitch = (Math.random() - 0.5) * this.noiseIntensity;

    // Shake (dipakai saat lookBack mulai)
    const shake = this.isLookingBack ? 0.03 : 0.005;
    const shakeYaw = (Math.random() - 0.5) * shake;
    const shakePitch = (Math.random() - 0.5) * shake * 0.5;

    const finalYaw = yaw + jitterYaw + shakeYaw;
    const finalPitch = pitch + jitterPitch + shakePitch;

    // apply to FPS camera
    if (this.cameraMode && this.cameraMode.mode === "fps") {
      this.cameraMode.fps.yaw = finalYaw;
      this.cameraMode.fps.pitch = finalPitch;
      this.cameraMode.playerPosition.copy(this.camera.position);

      // Create look vector
      const zx = Math.cos(finalPitch) * Math.sin(finalYaw);
      const zy = Math.sin(finalPitch);
      const zz = Math.cos(finalPitch) * Math.cos(finalYaw);

      const lookAt = new THREE.Vector3(
        this.camera.position.x + zx,
        this.camera.position.y + zy,
        this.camera.position.z + zz
      );

      // apply zoom (FOV scale)
      this.camera.fov = 75 * this.zoomAmount;
      this.camera.updateProjectionMatrix();

      // manual matrix like original
      const worldUp = new THREE.Vector3(0, 1, 0);
      const z = new THREE.Vector3()
        .subVectors(this.camera.position, lookAt)
        .normalize();
      const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();
      const mat = new THREE.Matrix4().makeBasis(x, y, z);

      this.camera.quaternion.setFromRotationMatrix(mat);
    }
  }

  updateGhostFade(dt) {
    this.ghostFadeElapsed += dt;

    const fadeT = Math.min(this.ghostFadeElapsed / this.ghostFadeDuration, 1);
    const e = this.easeInOutCubic(fadeT);

    this.ghostFadeOpacity = e;

    if (this.ghostModel) {
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) child.material.opacity = e;
      });
    }
    if (this.ghostSpotlight) this.ghostSpotlight.intensity = 3.0 * e;
    if (this.ghostPointLight) this.ghostPointLight.intensity = 2.0 * e;

    this.ghostRings.forEach((r) => (r.material.opacity = 0.45 * e));

    if (fadeT >= 1) {
      this.ghostFading = false;
    }
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
