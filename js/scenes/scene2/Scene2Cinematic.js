// Scene2Cinematic.js
// ✅ WITH SMOOTH GHOST TRANSITIONS:
// - Ghost fades OUT when cinematic starts
// - Ghost fades IN during turn_right step (creepy reveal!)

export default class Scene2Cinematic {
  constructor(
    camera,
    cameraMode,
    ghostModel,
    ghostController,
    ghostSpotlight,
    ghostPointLight,
    ghostRings,
    scene2Instance // ✅ NEW: Reference to Scene2 for apocalypse trigger
  ) {
    this.camera = camera;
    this.cameraMode = cameraMode;
    this.ghostModel = ghostModel;
    this.ghostController = ghostController;
    this.ghostSpotlight = ghostSpotlight;
    this.ghostPointLight = ghostPointLight;
    this.ghostRings = ghostRings;
    this.scene2 = scene2Instance; // ✅ Store reference

    this.isPlaying = false;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // LookBack fix
    this.hasLookedBack = false;
    this.lookBackHold = 0.25;

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
        ghostFadeInAt: 1250, // ✅ Ghost fades in at 50% turn (middle of turn)
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
        lookBackAt: 4000,
        lookBackDuration: 1200,
        triggerApocalypse: true, // ✅ Auto trigger apocalypse mode when this step starts!
      },
    ];

    // Ghost fade settings
    this.ghostFadeOpacity = 0;
    this.ghostFading = false;
    this.ghostFadeElapsed = 0;
    this.ghostFadeDuration = 1500; // ✅ 1.5 seconds for smooth reveal
    this.ghostFadeStarted = false; // ✅ NEW: Prevent double fade-in

    // ✅ Apocalypse trigger
    this.apocalypseTriggered = false;

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
    this.ghostFadeStarted = false; // ✅ Reset fade flag
    this.apocalypseTriggered = false; // ✅ Reset apocalypse flag
    this.isLookingBack = false;
    this.hasLookedBack = false;

    // ✅ FADE OUT GHOST FIRST (smooth disappear)
    console.log("👻 Fading out ghost...");
    this.fadeOutGhost();

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

  // ✅ NEW: Fade out ghost smoothly at cinematic start
  fadeOutGhost() {
    if (!this.ghostModel) return;

    const fadeOutDuration = 500; // 0.5 second
    let elapsed = 0;

    const fadeInterval = setInterval(() => {
      elapsed += 16; // ~60fps
      const progress = Math.min(elapsed / fadeOutDuration, 1);
      const opacity = 1 - progress;

      // Apply to ghost
      if (this.ghostModel) {
        this.ghostModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = opacity;
          }
        });
      }

      // Apply to lights
      if (this.ghostSpotlight) {
        this.ghostSpotlight.intensity = 3.0 * opacity;
      }
      if (this.ghostPointLight) {
        this.ghostPointLight.intensity = 2.0 * opacity;
      }

      // Apply to rings
      this.ghostRings.forEach((ring) => {
        ring.material.opacity = 0.45 * opacity;
      });

      // Complete
      if (progress >= 1) {
        clearInterval(fadeInterval);

        // Hide completely
        if (this.ghostModel) this.ghostModel.visible = false;
        if (this.ghostSpotlight) this.ghostSpotlight.visible = false;
        if (this.ghostPointLight) this.ghostPointLight.visible = false;
        this.ghostRings.forEach((ring) => (ring.visible = false));

        console.log("👻 Ghost hidden!");
      }
    }, 16);
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

    // ✅ Breathing sway + bounce (ONLY during run_forward for realism)
    if (step.type === "run_forward") {
      // Breathing sway
      pos.y += Math.sin(performance.now() * 0.002) * this.breathAmp;

      // Running step bounce
      const variation = Math.sin(easedT * Math.PI * 4) * 0.3;
      pos.y += variation;
    }

    this.camera.position.set(pos.x, pos.y, pos.z);

    // LOOK BACK FIX
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
        const k = this.easeInOutCubic(lbT / half);
        yaw = this.lerp(
          this.lookBackStartYaw,
          this.lookBackStartYaw + Math.PI,
          k
        );
        pitch = this.lerp(this.lookBackStartPitch, 0, k);
      } else if (lbT < half + hold) {
        yaw = this.lookBackStartYaw + Math.PI;
        pitch = 0;
      } else {
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
        this.zoomTarget = 1;
        console.log("➡️ LookBack end");
      }
    } else {
      yaw = this.lerp(step.fromYaw, step.toYaw, easedT);
      pitch = this.lerp(step.fromPitch, step.toPitch, easedT);
    }

    // CAMERA EFFECTS
    this.applyCameraEffects(deltaTime, yaw, pitch);

    // ✅ GHOST FADE IN (during turn_right step at 50% - middle of turn)
    if (step.ghostFadeInAt && !this.ghostFading && !this.ghostFadeStarted) {
      if (this.stepElapsed >= step.ghostFadeInAt) {
        this.ghostFading = true;
        this.ghostFadeStarted = true; // ✅ Mark as started
        this.ghostFadeElapsed = 0;

        // Make visible but transparent
        if (this.ghostModel) this.ghostModel.visible = true;
        if (this.ghostSpotlight) this.ghostSpotlight.visible = true;
        if (this.ghostPointLight) this.ghostPointLight.visible = true;
        this.ghostRings.forEach((r) => (r.visible = true));

        console.log("👻 Ghost fading in at 50% turn (creepy reveal)...");
      }
    }

    if (this.ghostFading) {
      this.updateGhostFadeIn(deltaTime);
    }

    // ✅ AUTO TRIGGER APOCALYPSE MODE (at start of run_forward step)
    if (step.triggerApocalypse && !this.apocalypseTriggered && this.scene2) {
      this.apocalypseTriggered = true;
      console.log("🔥 Auto-triggering APOCALYPSE MODE!");

      // Only trigger if not already in apocalypse mode
      if (!this.scene2.isApocalypseMode) {
        this.scene2.toggleApocalypseMode();
      }
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

    // ✅ NO SHAKE/JITTER for early steps - only during run_forward!
    const step = this.sequence[this.currentStep];
    const isRunningStep = step && step.type === "run_forward";

    // Camera noise jitter (ONLY during run_forward)
    const jitterYaw = isRunningStep
      ? (Math.random() - 0.5) * this.noiseIntensity
      : 0;
    const jitterPitch = isRunningStep
      ? (Math.random() - 0.5) * this.noiseIntensity
      : 0;

    // Shake (extra during lookBack, subtle during run)
    let shake = 0;
    if (isRunningStep) {
      shake = this.isLookingBack ? 0.03 : 0.003; // ✅ Reduced from 0.005 to 0.003
    }

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

      // manual matrix
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

  // ✅ UPDATE: Ghost fade IN (smooth reveal)
  updateGhostFadeIn(dt) {
    this.ghostFadeElapsed += dt;

    const fadeT = Math.min(this.ghostFadeElapsed / this.ghostFadeDuration, 1);
    const e = this.easeInOutCubic(fadeT);

    this.ghostFadeOpacity = e;

    // Apply to ghost
    if (this.ghostModel) {
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = e;
        }
      });
    }

    // Apply to lights
    if (this.ghostSpotlight) this.ghostSpotlight.intensity = 3.0 * e;
    if (this.ghostPointLight) this.ghostPointLight.intensity = 2.0 * e;

    // Apply to rings
    this.ghostRings.forEach((r) => (r.material.opacity = 0.45 * e));

    if (fadeT >= 1) {
      this.ghostFading = false;
      console.log("👻 Ghost fully visible!");
    }
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
