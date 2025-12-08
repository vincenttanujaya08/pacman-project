// js/scenes/scene2/Scene2Cinematic.js
// Cinematic camera sequence for Scene2

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
        lookBackAt: 4000,
        lookBackDuration: 800,
      },
    ];

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

    // Hide ghost completely initially
    if (this.ghostModel) {
      this.ghostModel.visible = false;
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
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

    // Disable camera mode input
    if (this.cameraMode) {
      for (const key in this.cameraMode.keys) {
        this.cameraMode.keys[key] = false;
      }
    }

    // Set initial position
    const firstStep = this.sequence[0];
    this.camera.position.set(
      firstStep.fromPos.x,
      firstStep.fromPos.y,
      firstStep.fromPos.z
    );
    if (this.cameraMode && this.cameraMode.mode === "fps") {
      this.cameraMode.fps.yaw = firstStep.fromYaw;
      this.cameraMode.fps.pitch = firstStep.fromPitch;
      this.cameraMode.playerPosition.copy(this.camera.position);
    }
  }

  stop() {
    this.isPlaying = false;
    console.log("🎬 Cinematic Stopped");
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    if (this.currentStep >= this.sequence.length) {
      this.isPlaying = false;
      console.log("✅ Cinematic Complete!");
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

    // Add Y variation for natural ground movement
    if (step.type === "run_forward") {
      const variation = Math.sin(easedT * Math.PI * 4) * 0.3;
      pos.y += variation;
    }

    this.camera.position.set(pos.x, pos.y, pos.z);

    // Handle look back during run
    if (
      step.type === "run_forward" &&
      step.lookBackAt &&
      this.stepElapsed >= step.lookBackAt &&
      !this.isLookingBack
    ) {
      this.isLookingBack = true;
      this.lookBackElapsed = 0;
      this.lookBackStartYaw = this.lerp(step.fromYaw, step.toYaw, easedT);
      this.lookBackStartPitch = this.lerp(step.fromPitch, step.toPitch, easedT);
      console.log("👀 Looking back at ghost!");
    }

    // Interpolate rotation
    let yaw, pitch;

    if (this.isLookingBack && step.type === "run_forward") {
      this.lookBackElapsed += deltaTime;
      const lookBackT = Math.min(
        this.lookBackElapsed / step.lookBackDuration,
        1
      );

      if (lookBackT < 0.5) {
        // Turn back (first half)
        const turnT = lookBackT * 2;
        yaw = this.lerp(
          this.lookBackStartYaw,
          this.lookBackStartYaw + Math.PI,
          this.easeInOutCubic(turnT)
        );
        pitch = this.lerp(
          this.lookBackStartPitch,
          0,
          this.easeInOutCubic(turnT)
        );
      } else {
        // Turn forward again (second half)
        const turnT = (lookBackT - 0.5) * 2;
        yaw = this.lerp(
          this.lookBackStartYaw + Math.PI,
          this.lookBackStartYaw,
          this.easeInOutCubic(turnT)
        );
        pitch = this.lerp(
          0,
          this.lookBackStartPitch,
          this.easeInOutCubic(turnT)
        );
      }

      if (lookBackT >= 1) {
        this.isLookingBack = false;
        console.log("✅ Look back complete, continuing forward");
      }
    } else {
      yaw = this.lerp(step.fromYaw, step.toYaw, easedT);
      pitch = this.lerp(step.fromPitch, step.toPitch, easedT);
    }

    // Apply rotation to camera (FPS mode style)
    if (this.cameraMode && this.cameraMode.mode === "fps") {
      this.cameraMode.fps.yaw = yaw;
      this.cameraMode.fps.pitch = pitch;
      this.cameraMode.playerPosition.copy(this.camera.position);

      const lookX = Math.cos(pitch) * Math.sin(yaw);
      const lookY = Math.sin(pitch);
      const lookZ = Math.cos(pitch) * Math.cos(yaw);

      const lookAt = new THREE.Vector3(
        this.camera.position.x + lookX,
        this.camera.position.y + lookY,
        this.camera.position.z + lookZ
      );

      const worldUp = new THREE.Vector3(0, 1, 0);
      const z = new THREE.Vector3()
        .subVectors(this.camera.position, lookAt)
        .normalize();
      const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();
      const mat = new THREE.Matrix4();
      mat.makeBasis(x, y, z);
      this.camera.quaternion.setFromRotationMatrix(mat);
    }

    // Ghost fade in
    if (step.ghostFadeIn && !this.ghostFading) {
      this.ghostFading = true;
      this.ghostFadeElapsed = 0;
      console.log("👻 Ghost fading in...");

      if (this.ghostModel) {
        this.ghostModel.visible = true;
      }
      if (this.ghostSpotlight) {
        this.ghostSpotlight.visible = true;
      }
      if (this.ghostPointLight) {
        this.ghostPointLight.visible = true;
      }
      this.ghostRings.forEach((ring) => {
        ring.visible = true;
      });
    }

    if (this.ghostFading) {
      this.ghostFadeElapsed += deltaTime;
      const fadeT = Math.min(this.ghostFadeElapsed / this.ghostFadeDuration, 1);
      const easedFadeT = this.easeInOutCubic(fadeT);
      this.ghostFadeOpacity = easedFadeT;

      // Apply fade to ghost model materials
      if (this.ghostModel) {
        this.ghostModel.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = easedFadeT;
          }
        });
      }

      // Apply fade to ghost lights
      if (this.ghostSpotlight) {
        this.ghostSpotlight.intensity = 3.0 * easedFadeT;
      }
      if (this.ghostPointLight) {
        this.ghostPointLight.intensity = 2.0 * easedFadeT;
      }

      // Apply fade to rings
      this.ghostRings.forEach((ring) => {
        ring.material.opacity = 0.45 * easedFadeT;
      });

      if (fadeT >= 1) {
        this.ghostFading = false;
        console.log("✅ Ghost fully visible!");
      }
    }

    // Move to next step
    if (t >= 1) {
      this.currentStep++;
      this.stepElapsed = 0;

      if (this.currentStep < this.sequence.length) {
        console.log(
          `🎬 Step ${this.currentStep + 1}/${this.sequence.length}: ${
            this.sequence[this.currentStep].type
          }`
        );
      }
    }
  }

  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
