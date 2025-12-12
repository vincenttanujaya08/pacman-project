// js/scenes/scene2/Scene2Cinematic.js
// ✅ FULL FILE WITH FADE OUT TO SCENE3

export default class Scene2Cinematic {
  constructor(
    camera,
    cameraMode,
    ghostModel,
    ghostController,
    ghostSpotlight,
    ghostPointLight,
    ghostRings,
    scene2Instance
  ) {
    this.camera = camera;
    this.cameraMode = cameraMode;
    this.ghostModel = ghostModel;
    this.ghostController = ghostController;
    this.ghostSpotlight = ghostSpotlight;
    this.ghostPointLight = ghostPointLight;
    this.ghostRings = ghostRings;
    this.scene2 = scene2Instance;

    this.isPlaying = false;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // ✅ Ghost chase state
    this.ghostStarted = false;

    // LookBack fix
    this.hasLookedBack = false;
    this.lookBackHold = 0.25;

    // Camera Effects State
    this.shakeIntensity = 0;
    this.noiseIntensity = 0.002;
    this.breathAmp = 0.02;
    this.zoomAmount = 1;
    this.zoomTarget = 1;

    // ✅ Fade out to Scene3 state
    this.isFadingOut = false;
    this.fadeOutElapsed = 0;
    this.fadeOutDuration = 1500; // 1.5 seconds
    this.fadeOutComplete = false;

    // ✅ UPDATED KEYFRAMES with correct ending positions from images
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
        ghostFadeInAt: 1250, // Ghost fades in at 50% turn (middle of turn)
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
        toPos: { x: 5.94, y: 7549.33, z: 215.31 },
        fromYaw: 0.136,
        toYaw: 0.119,
        fromPitch: 0.058,
        toPitch: -0.316,
        lookBackAt: 3000,
        lookBackDuration: 3000,
        triggerApocalypse: true,
      },
      {
        type: "approach_arcade",
        duration: 2500,
        fromPos: { x: 5.94, y: 7549.33, z: 215.31 },
        toPos: { x: 6.57, y: 7548.43, z: 218.49 },
        fromYaw: 0.119,
        toYaw: 0.049,
        fromPitch: -0.316,
        toPitch: 0.082,
      },
      {
        type: "final_approach",
        duration: 2000,
        fromPos: { x: 6.57, y: 7548.43, z: 218.49 },
        toPos: { x: 6.38, y: 7550.5, z: 218.47 },
        fromYaw: 0.049,
        toYaw: 0.079,
        fromPitch: 0.082,
        toPitch: -0.612,
      },
      {
        type: "pass_through",
        duration: 1500,
        fromPos: { x: 6.38, y: 7550.5, z: 218.47 },
        toPos: { x: 6.53, y: 7545.5, z: 226 },
        fromYaw: 0.079,
        toYaw: 0.112,
        fromPitch: -0.612,
        toPitch: -0.4,
      },
    ];

    // Ghost fade settings
    this.ghostFadeOpacity = 0;
    this.ghostFading = false;
    this.ghostFadeElapsed = 0;
    this.ghostFadeDuration = 1500;
    this.ghostFadeStarted = false;

    // Apocalypse trigger
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
    this.ghostFadeStarted = false;
    this.apocalypseTriggered = false;
    this.isLookingBack = false;
    this.hasLookedBack = false;
    this.ghostStarted = false;

    // ✅ Reset fade out state
    this.isFadingOut = false;
    this.fadeOutElapsed = 0;
    this.fadeOutComplete = false;

    // Fade out ghost first
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

  fadeOutGhost() {
    if (!this.ghostModel) return;

    const fadeOutDuration = 500;
    let elapsed = 0;

    const fadeInterval = setInterval(() => {
      elapsed += 16;
      const progress = Math.min(elapsed / fadeOutDuration, 1);
      const opacity = 1 - progress;

      if (this.ghostModel) {
        this.ghostModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = opacity;
          }
        });
      }

      if (this.ghostSpotlight) {
        this.ghostSpotlight.intensity = 3.0 * opacity;
      }
      if (this.ghostPointLight) {
        this.ghostPointLight.intensity = 2.0 * opacity;
      }

      this.ghostRings.forEach((ring) => {
        ring.material.opacity = 0.45 * opacity;
      });

      if (progress >= 1) {
        clearInterval(fadeInterval);

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
    console.log("🎬 Cinematic stopped");
  }

  // ✅ NEW: Start fade out to Scene3
  startFadeOutToScene3() {
    if (this.isFadingOut || this.fadeOutComplete) return;

    console.log("🌑 Starting fade out to Scene3...");
    this.isFadingOut = true;
    this.fadeOutElapsed = 0;

    // Make objects transparent for fade
    if (this.scene2.forestModel) {
      this.scene2.forestModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
        }
      });
    }

    if (this.scene2.arcadeModel) {
      this.scene2.arcadeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
        }
      });
    }

    if (this.ghostModel) {
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
        }
      });
    }
  }

  // ✅ NEW: Update fade out
  updateFadeOut(deltaTime) {
    if (!this.isFadingOut) return;

    this.fadeOutElapsed += deltaTime;
    const progress = Math.min(this.fadeOutElapsed / this.fadeOutDuration, 1);
    const opacity = 1 - this.easeInOutCubic(progress);

    // Fade out forest
    if (this.scene2.forestModel) {
      this.scene2.forestModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = opacity;
        }
      });
    }

    // Fade out arcade
    if (this.scene2.arcadeModel) {
      this.scene2.arcadeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = opacity;
        }
      });
    }

    // Fade out ghost
    if (this.ghostModel) {
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = opacity;
        }
      });
    }

    // Fade out ghost lights
    if (this.ghostSpotlight) {
      this.ghostSpotlight.intensity = 3.0 * opacity;
    }
    if (this.ghostPointLight) {
      this.ghostPointLight.intensity = 2.0 * opacity;
    }

    // Fade out ghost rings
    this.ghostRings.forEach((ring) => {
      ring.material.opacity = 0.45 * opacity;
    });

    // Fade out scene lights
    if (this.scene2.ambientLight) {
      this.scene2.ambientLight.intensity =
        this.scene2.apocalypseColors.ambient.intensity * opacity;
    }
    if (this.scene2.sunLight) {
      this.scene2.sunLight.intensity =
        this.scene2.apocalypseColors.sun.intensity * opacity;
    }
    if (this.scene2.fillLight) {
      this.scene2.fillLight.intensity =
        this.scene2.apocalypseColors.fill.intensity * opacity;
    }

    // Fade out fireflies
    if (this.scene2.lightParticles) {
      this.scene2.lightParticles.fireflies.forEach((f) => {
        f.material.opacity = f.userData.twinkle.max * opacity;
      });
    }

    // Fade complete
    if (progress >= 1) {
      this.fadeOutComplete = true;
      this.isFadingOut = false;

      console.log("✅ Fade out complete! Transitioning to Scene3...");

      // Hide everything completely
      if (this.scene2.forestModel) this.scene2.forestModel.visible = false;
      if (this.scene2.arcadeModel) this.scene2.arcadeModel.visible = false;
      if (this.ghostModel) this.ghostModel.visible = false;
      if (this.ghostSpotlight) this.ghostSpotlight.visible = false;
      if (this.ghostPointLight) this.ghostPointLight.visible = false;
      this.ghostRings.forEach((r) => (r.visible = false));

      if (this.scene2.lightParticles) {
        this.scene2.lightParticles.fireflies.forEach(
          (f) => (f.visible = false)
        );
      }

      // Transition to Scene3
      setTimeout(() => {
        const app = window.app;
        if (app && app.sceneManager) {
          const scene3 = app.sceneManager.getScene("scene3");

          if (scene3) {
            console.log("🎬 Switching to Scene3...");
            app.sceneManager.switchTo("scene3", "instant");
          } else {
            console.warn("⚠️ Scene3 not found! Add it to main.js");
          }
        }
      }, 200); // Small delay for smooth transition
    }
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

    // Breathing sway + bounce (ONLY during run_forward for realism)
    if (step.type === "run_forward") {
      pos.y += Math.sin(performance.now() * 0.002) * this.breathAmp;
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

    // GHOST FADE IN (during turn_right step at 50%)
    if (step.ghostFadeInAt && !this.ghostFading && !this.ghostFadeStarted) {
      if (this.stepElapsed >= step.ghostFadeInAt) {
        this.ghostFading = true;
        this.ghostFadeStarted = true;
        this.ghostFadeElapsed = 0;

        if (this.ghostModel) this.ghostModel.visible = true;
        if (this.ghostSpotlight) this.ghostSpotlight.visible = true;
        if (this.ghostPointLight) this.ghostPointLight.visible = true;

        console.log("👻 Ghost fading in at 50% turn (creepy reveal)...");
      }
    }

    if (this.ghostFading) {
      this.updateGhostFadeIn(deltaTime);

      // ✅ START GHOST CHASE after fade in complete
      if (
        !this.ghostStarted &&
        this.ghostFadeOpacity >= 0.99 &&
        this.ghostController
      ) {
        this.ghostStarted = true;
        console.log("👻 Ghost starting chase sequence!");
        this.ghostController.startChaseSequence();
      }
    }

    // ✅ Update ghost movement
    if (this.ghostController && this.ghostController.isAnimating) {
      this.ghostController.update(deltaTime);
    }

    // AUTO TRIGGER APOCALYPSE MODE
    if (step.triggerApocalypse && !this.apocalypseTriggered && this.scene2) {
      this.apocalypseTriggered = true;
      console.log("✨ Auto-triggering GOLDEN APOCALYPSE MODE!");

      if (!this.scene2.isApocalypseMode) {
        this.scene2.toggleApocalypseMode();
      }
    }

    // ✅ NEW: Check if we need to start fade out (at end of pass_through step)
    if (
      step.type === "pass_through" &&
      t >= 1 &&
      !this.isFadingOut &&
      !this.fadeOutComplete
    ) {
      this.startFadeOutToScene3();
    }

    // ✅ NEW: Update fade out
    this.updateFadeOut(deltaTime);

    // NEXT step
    if (t >= 1 && !this.isFadingOut) {
      this.currentStep++;
      this.stepElapsed = 0;

      // ✅ Log progress
      console.log(
        `📹 Cinematic step ${this.currentStep}/${this.sequence.length} complete`
      );

      // ✅ Check if we finished pass_through step
      if (step.type === "pass_through") {
        console.log("✅ Passed through arcade screen!");
        console.log("🌑 Starting fade out to Scene3...");
      }
    }
  }

  applyCameraEffects(dt, yaw, pitch) {
    // Smooth interpolation zoom
    this.zoomAmount += (this.zoomTarget - this.zoomAmount) * 0.05;

    const step = this.sequence[this.currentStep];
    const isRunningStep = step && step.type === "run_forward";

    // Camera noise jitter (ONLY during run_forward)
    const jitterYaw = isRunningStep
      ? (Math.random() - 0.5) * this.noiseIntensity
      : 0;
    const jitterPitch = isRunningStep
      ? (Math.random() - 0.5) * this.noiseIntensity
      : 0;

    // Shake
    let shake = 0;
    if (isRunningStep) {
      shake = this.isLookingBack ? 0.03 : 0.003;
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

  updateGhostFadeIn(dt) {
    this.ghostFadeElapsed += dt;

    const fadeT = Math.min(this.ghostFadeElapsed / this.ghostFadeDuration, 1);
    const e = this.easeInOutCubic(fadeT);

    this.ghostFadeOpacity = e;

    if (this.ghostModel) {
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = e;
        }
      });
    }

    if (this.ghostSpotlight) this.ghostSpotlight.intensity = 3.0 * e;
    if (this.ghostPointLight) this.ghostPointLight.intensity = 2.0 * e;

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
