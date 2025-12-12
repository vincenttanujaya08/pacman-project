// js/scenes/scene4/Scene4Cinematic.js

export default class Scene4Cinematic {
  constructor(scene, camera, mazeModel, config) {
    this.scene = scene;
    this.camera = camera;
    this.mazeModel = mazeModel;
    this.config = config;

    this.isPlaying = false;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // FPS state
    this.yaw = config.camera.rotation.yaw;
    this.pitch = config.camera.rotation.pitchDown;

    this.sequence = [
      {
        name: "fade_in_maze",
        duration: config.intro.fadeInDuration,
      },
      {
        name: "falling",
        duration: config.intro.fallingDuration,
      },
      {
        name: "complete",
        duration: 100,
      },
    ];
  }

  start() {
    if (this.isPlaying) return;

    console.log("🎬 Scene4 Intro Started!");
    this.isPlaying = true;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // Teleport camera to falling position
    this.camera.position.set(
      this.config.camera.falling.x,
      this.config.camera.falling.y,
      this.config.camera.falling.z
    );

    // Set initial rotation (looking down)
    this.yaw = this.config.camera.rotation.yaw;
    this.pitch = this.config.camera.rotation.pitchDown;
    this.applyCameraRotation(this.yaw, this.pitch);

    // Make maze invisible for fade in
    if (this.mazeModel) {
      this.mazeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });
      this.mazeModel.visible = true;
    }

    console.log("📹 Camera at falling position, looking down");
    console.log(
      `   Position: (${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z})`
    );
    console.log(
      `   Rotation: yaw=${this.yaw.toFixed(3)}, pitch=${this.pitch.toFixed(3)}`
    );
  }

  stop() {
    this.isPlaying = false;
    console.log("🎬 Scene4 Intro Stopped");
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    if (this.currentStep >= this.sequence.length) {
      console.log("✅ Scene4 Intro Complete!");
      this.isPlaying = false;
      return;
    }

    const step = this.sequence[this.currentStep];
    this.stepElapsed += deltaTime;

    const t = Math.min(this.stepElapsed / step.duration, 1);

    switch (step.name) {
      case "fade_in_maze":
        this.updateFadeInMaze(t);
        break;
      case "falling":
        this.updateFalling(t);
        break;
      case "complete":
        // Just wait
        break;
    }

    if (t >= 1) {
      console.log(`✅ Step complete: ${step.name}`);
      this.currentStep++;
      this.stepElapsed = 0;
    }
  }

  updateFadeInMaze(t) {
    if (!this.mazeModel) return;

    const opacity = this.easeInOutCubic(t);

    this.mazeModel.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = opacity;
      }
    });

    // Camera stays still, just update rotation to maintain FPS view
    this.applyCameraRotation(this.yaw, this.pitch);
  }

  updateFalling(t) {
    const easedT = this.easeInOutCubic(t);

    // Lerp Y position (falling)
    const startY = this.config.camera.falling.y;
    const endY = this.config.camera.normal.y;
    const currentY = this.lerp(startY, endY, easedT);

    this.camera.position.y = currentY;

    // Gradually rotate pitch from down to horizontal
    const startPitch = this.config.camera.rotation.pitchDown;
    const endPitch = this.config.camera.rotation.pitchNormal;
    this.pitch = this.lerp(startPitch, endPitch, easedT);

    // Apply rotation
    this.applyCameraRotation(this.yaw, this.pitch);
  }

  applyCameraRotation(yaw, pitch) {
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
    const mat = new THREE.Matrix4().makeBasis(x, y, z);

    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getYaw() {
    return this.yaw;
  }

  getPitch() {
    return this.pitch;
  }

  dispose() {
    console.log("🧹 Scene4 Cinematic disposed");
  }
}
