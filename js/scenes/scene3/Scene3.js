// js/scenes/scene3/Scene3.js
// ✅ FULL FIX: No glitches, proper camera initialization, = key debug

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import Scene3Cinematic from "./Scene3Cinematic.js";

export default class Scene3 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;
    this.mazeModel = null;
    this.ambientLight = null;
    this.directionalLight = null;

    // ✅ Cinematic controller
    this.cinematic = null;

    // ✅ Debug FPS mode
    this.debugFPSMode = false;
    this.keys = {};
    this.yaw = 0;
    this.pitch = 0;
    this.playerPosition = new THREE.Vector3();
    this.isPointerLocked = false;
    this.mouseSensitivity = 0.002;
    this.moveSpeed = 25;
    this.sprintSpeed = 50;
    this.verticalSpeed = 25;

    // Setup mode (for adjustments)
    this.setupMode = true;
    this.currentScale = config.scale.maze.x;
    this.infoElement = null;

    // ✅ Setup keyboard controls
    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Init started...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // Pure black background
    this.scene.background = new THREE.Color(this.config.background.color);

    // ✅ NO FOG - full visibility
    this.scene.fog = null;
    console.log("✅ Fog disabled - full visibility");

    // Setup lighting
    this.setupLighting();

    // Load Maze
    try {
      console.log("Loading maze model...");
      const mazeGltf = await this.loadModel(this.config.models.maze);
      this.mazeModel = mazeGltf.scene;

      this.mazeModel.position.set(
        this.config.positions.maze.x,
        this.config.positions.maze.y,
        this.config.positions.maze.z
      );

      this.mazeModel.rotation.set(
        this.config.rotations.maze.x,
        this.config.rotations.maze.y,
        this.config.rotations.maze.z
      );

      this.mazeModel.scale.set(
        this.config.scale.maze.x,
        this.config.scale.maze.y,
        this.config.scale.maze.z
      );

      this.mazeModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.mazeModel.visible = true;

      this.addObject(this.mazeModel, "maze");
      console.log("✅ Maze loaded");
    } catch (error) {
      console.error("❌ Error loading maze:", error);
    }

    // ✅ Create cinematic controller
    this.cinematic = new Scene3Cinematic(
      this.scene,
      this.camera,
      this.mazeModel
    );
    console.log("✅ Cinematic controller ready");

    // ✅ Setup mouse controls for debug FPS
    this.setupMouseControls();

    // Create info display
    this.createInfoDisplay();

    console.log("✅ Scene 3 ready!");
    console.log("💡 Cinematic will auto-start on scene enter");
    console.log("💡 Press [=] to toggle DEBUG FPS MODE");
    console.log("💡 Press [SPACE] to manually restart cinematic");
  }

  setupLighting() {
    // ✅ BRIGHT ambient light (0.8 intensity)
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    // ✅ Directional light from above
    const dirConfig = this.config.lighting.directional;
    this.directionalLight = new THREE.DirectionalLight(
      dirConfig.color,
      dirConfig.intensity
    );

    this.directionalLight.position.set(
      dirConfig.position.x,
      dirConfig.position.y,
      dirConfig.position.z
    );

    this.directionalLight.target.position.set(
      dirConfig.target.x,
      dirConfig.target.y,
      dirConfig.target.z
    );

    this.directionalLight.castShadow = true;

    // Shadow settings for wide coverage
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
    this.lights.push(this.directionalLight);

    console.log(
      "✅ Bright wide lighting setup (Ambient 0.8 + Directional from top)"
    );
  }

  setupKeyboardControls() {
    // ✅ Key down/up for WASD (FPS mode)
    this.onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
    };

    this.onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    };

    this.onKeyPress = (e) => {
      const key = e.key;

      // ✅ = key - Toggle debug FPS mode
      if (key === "=") {
        this.toggleDebugFPS();
        return;
      }

      // Maze scale controls (testing only)
      if (key === "1") {
        this.currentScale -= 0.1;
        this.updateMazeScale();
      }
      if (key === "2") {
        this.currentScale += 0.1;
        this.updateMazeScale();
      }

      // Lighting controls (testing only)
      if (key === "3") {
        this.ambientLight.intensity = Math.max(
          0,
          this.ambientLight.intensity - 0.05
        );
        this.updateInfo();
      }
      if (key === "4") {
        this.ambientLight.intensity = Math.min(
          2,
          this.ambientLight.intensity + 0.05
        );
        this.updateInfo();
      }
      if (key === "5") {
        this.directionalLight.intensity = Math.max(
          0,
          this.directionalLight.intensity - 0.05
        );
        this.updateInfo();
      }
      if (key === "6") {
        this.directionalLight.intensity = Math.min(
          2,
          this.directionalLight.intensity + 0.05
        );
        this.updateInfo();
      }

      // Print config
      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }

      // Reset
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }

      // ✅ Manual restart cinematic (for testing)
      if (key === " ") {
        if (this.cinematic) {
          console.log("🔄 Manually restarting cinematic...");
          this.resetCinematic();
          this.cinematic.start();
        }
      }
    };

    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("keypress", this.onKeyPress);
  }

  setupMouseControls() {
    // ✅ Request pointer lock on canvas click (when debug FPS active)
    this.onMouseDown = () => {
      if (this.debugFPSMode && !this.isPointerLocked) {
        this.renderer.domElement.requestPointerLock();
      }
    };

    // ✅ Mouse movement handler
    this.onPointerMove = (e) => {
      if (!this.isPointerLocked || !this.debugFPSMode) return;

      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;

      // Clamp pitch
      this.pitch = Math.max(
        -Math.PI / 2.5,
        Math.min(Math.PI / 2.5, this.pitch)
      );
    };

    // ✅ Pointer lock change handler
    this.onPointerLockChange = () => {
      this.isPointerLocked =
        document.pointerLockElement === this.renderer.domElement;

      if (this.isPointerLocked) {
        console.log("🖱️ Mouse locked - Debug FPS active");
      } else {
        console.log("🖱️ Mouse unlocked");
      }
    };

    // ✅ Add event listeners
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onPointerMove);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);

    console.log("✅ Mouse controls setup for debug mode");
  }

  // ✅ Toggle debug FPS mode
  toggleDebugFPS() {
    this.debugFPSMode = !this.debugFPSMode;

    if (this.debugFPSMode) {
      console.log("🎮 DEBUG FPS MODE ENABLED");
      console.log("   Cinematic paused");
      console.log("   WASD - Move | Q/E - Up/Down | Shift - Sprint");
      console.log("   Click canvas to lock mouse");
      console.log("   Press = again to resume cinematic");

      // Pause cinematic
      if (this.cinematic && this.cinematic.isPlaying) {
        this.cinematic.isPlaying = false;
      }

      // Set FPS position to current camera position
      this.playerPosition.copy(this.camera.position);

      // Calculate yaw/pitch from current camera rotation
      const euler = new THREE.Euler().setFromQuaternion(
        this.camera.quaternion,
        "YXZ"
      );
      this.yaw = euler.y;
      this.pitch = euler.x;

      // Request pointer lock
      setTimeout(() => {
        this.renderer.domElement.requestPointerLock();
      }, 100);
    } else {
      console.log("🎬 CINEMATIC MODE RESUMED");
      console.log("   Debug FPS disabled");

      // Resume cinematic
      if (this.cinematic && !this.cinematic.isPlaying) {
        this.cinematic.isPlaying = true;
      }

      // Exit pointer lock
      document.exitPointerLock();

      // Clear keys
      for (const key in this.keys) {
        this.keys[key] = false;
      }
    }

    this.updateInfo();
  }

  updateMazeScale() {
    if (this.mazeModel) {
      this.mazeModel.scale.set(
        this.currentScale,
        this.currentScale,
        this.currentScale
      );
      console.log(`🏰 Maze scale: ${this.currentScale.toFixed(2)}`);
      this.updateInfo();
    }
  }

  createInfoDisplay() {
    this.infoElement = document.createElement("div");
    this.infoElement.id = "scene3-info";
    this.infoElement.style.position = "fixed";
    this.infoElement.style.top = "100px";
    this.infoElement.style.left = "20px";
    this.infoElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.infoElement.style.color = "#ffffff";
    this.infoElement.style.padding = "15px";
    this.infoElement.style.fontFamily = "monospace";
    this.infoElement.style.fontSize = "14px";
    this.infoElement.style.borderRadius = "5px";
    this.infoElement.style.border = "2px solid #ffffff";
    this.infoElement.style.zIndex = "999";
    this.infoElement.style.lineHeight = "1.5";
    this.infoElement.style.display = "none";
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    const cinematicStatus =
      this.cinematic && this.cinematic.isPlaying ? "Playing" : "Paused";

    const mode = this.debugFPSMode ? "🎮 DEBUG FPS" : "🎬 CINEMATIC";

    this.infoElement.innerHTML = `
      <strong>🏰 SCENE 3 - ${mode}</strong><br>
      <br>
      <strong>🎬 STATUS</strong><br>
      Cinematic: ${cinematicStatus}<br>
      Step: ${this.cinematic ? this.cinematic.currentStep + 1 : 0}/${
      this.cinematic ? this.cinematic.sequence.length : 0
    }<br>
      <br>
      <strong>📦 MODEL</strong><br>
      Maze Scale: ${this.currentScale.toFixed(2)}<br>
      <br>
      <strong>💡 LIGHTING</strong><br>
      Ambient: ${this.ambientLight.intensity.toFixed(2)}<br>
      Directional: ${this.directionalLight.intensity.toFixed(2)}<br>
      <br>
      <strong>[=] Toggle FPS | [SPACE] Restart | [P] Print</strong>
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 SCENE 3 CONFIG");
    console.log("========================================");
    console.log("Mode:", this.debugFPSMode ? "DEBUG FPS" : "CINEMATIC");
    console.log("Maze scale:", this.currentScale.toFixed(2));
    console.log("Camera pos:", {
      x: this.camera.position.x.toFixed(2),
      y: this.camera.position.y.toFixed(2),
      z: this.camera.position.z.toFixed(2),
    });
    if (this.debugFPSMode) {
      console.log("Camera rot:", {
        yaw: this.yaw.toFixed(3),
        pitch: this.pitch.toFixed(3),
      });
    }
    console.log("Ambient:", this.ambientLight.intensity.toFixed(2));
    console.log("Directional:", this.directionalLight.intensity.toFixed(2));
    console.log("========================================");
  }

  resetToDefault() {
    this.currentScale = this.config.scale.maze.x;
    this.updateMazeScale();

    this.ambientLight.intensity = this.config.lighting.ambient.intensity;
    this.directionalLight.intensity =
      this.config.lighting.directional.intensity;

    this.updateInfo();
    console.log("✅ Reset to defaults");
  }

  // ✅ Reset cinematic state (for manual restart)
  resetCinematic() {
    if (!this.cinematic) return;

    // Disable debug FPS if active
    if (this.debugFPSMode) {
      this.toggleDebugFPS();
    }

    // Reset maze visibility and opacity
    if (this.mazeModel) {
      this.mazeModel.visible = true;
      this.mazeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      });
    }

    // Reset camera position
    this.camera.position.set(
      this.config.camera.initial.x,
      this.config.camera.initial.y,
      this.config.camera.initial.z
    );

    // ✅ Reset camera rotation
    this.setCameraRotation(
      this.config.camera.rotation.yaw,
      this.config.camera.rotation.pitch
    );

    // Dispose old cinematic (cleanup text sprites)
    this.cinematic.dispose();

    // Create new cinematic
    this.cinematic = new Scene3Cinematic(
      this.scene,
      this.camera,
      this.mazeModel
    );

    console.log("🔄 Cinematic reset complete");
  }

  // ✅ Helper: Set camera rotation from yaw/pitch
  setCameraRotation(yaw, pitch) {
    // Calculate look direction
    const lookX = Math.cos(pitch) * Math.sin(yaw);
    const lookY = Math.sin(pitch);
    const lookZ = Math.cos(pitch) * Math.cos(yaw);

    const lookAt = new THREE.Vector3(
      this.camera.position.x + lookX,
      this.camera.position.y + lookY,
      this.camera.position.z + lookZ
    );

    // Set camera rotation matrix
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(this.camera.position, lookAt)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4().makeBasis(x, y, z);
    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  enter() {
    super.enter();

    console.log("🏰 Scene 3 entered!");

    // ✅ Set camera to starting position
    this.camera.position.set(
      this.config.camera.initial.x,
      this.config.camera.initial.y,
      this.config.camera.initial.z
    );

    // ✅ FIX: Set initial camera rotation IMMEDIATELY (no glitch)
    const startYaw = this.config.camera.rotation.yaw;
    const startPitch = this.config.camera.rotation.pitch;

    this.setCameraRotation(startYaw, startPitch);

    console.log(
      `📹 Camera set to: (${this.camera.position.x.toFixed(
        2
      )}, ${this.camera.position.y.toFixed(
        2
      )}, ${this.camera.position.z.toFixed(2)})`
    );
    console.log(
      `📹 Rotation: yaw=${startYaw.toFixed(3)}, pitch=${startPitch.toFixed(3)}`
    );

    // Show info display
    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();

    // ✅ Auto-start cinematic after short delay
    setTimeout(() => {
      if (this.cinematic) {
        console.log("🎬 Auto-starting cinematic...");
        this.cinematic.start();
      }
    }, 500);

    console.log("💡 Cinematic starting in 0.5s...");
    console.log("💡 Press [=] to toggle DEBUG FPS MODE");
    console.log("💡 Press [SPACE] to restart cinematic");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    // ✅ Update based on mode
    if (this.debugFPSMode) {
      // Debug FPS mode - manual control
      this.updateFPSMovement(deltaTime / 1000);
      this.updateFPSCamera();
    } else {
      // Cinematic mode
      if (this.cinematic) {
        this.cinematic.update(deltaTime);
      }
    }

    // Update info display
    this.updateInfo();
  }

  // ✅ FPS Movement
  updateFPSMovement(deltaTime) {
    const speed = this.keys["shift"] ? this.sprintSpeed : this.moveSpeed;
    const vSpeed = this.verticalSpeed;

    // Forward/backward/strafe based on yaw
    const forward = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    ).normalize();

    const right = new THREE.Vector3(
      -Math.cos(this.yaw),
      0,
      Math.sin(this.yaw)
    ).normalize();

    if (this.keys["w"])
      this.playerPosition.add(
        forward.clone().multiplyScalar(speed * deltaTime)
      );
    if (this.keys["s"])
      this.playerPosition.add(
        forward.clone().multiplyScalar(-speed * deltaTime)
      );
    if (this.keys["a"])
      this.playerPosition.add(right.clone().multiplyScalar(-speed * deltaTime));
    if (this.keys["d"])
      this.playerPosition.add(right.clone().multiplyScalar(speed * deltaTime));
    if (this.keys["q"]) this.playerPosition.y -= vSpeed * deltaTime;
    if (this.keys["e"]) this.playerPosition.y += vSpeed * deltaTime;

    // Update camera position
    this.camera.position.copy(this.playerPosition);
  }

  // ✅ FPS Camera
  updateFPSCamera() {
    // Calculate look direction
    const lookX = Math.cos(this.pitch) * Math.sin(this.yaw);
    const lookY = Math.sin(this.pitch);
    const lookZ = Math.cos(this.pitch) * Math.cos(this.yaw);

    const lookAt = new THREE.Vector3(
      this.camera.position.x + lookX,
      this.camera.position.y + lookY,
      this.camera.position.z + lookZ
    );

    // Create camera matrix
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(this.camera.position, lookAt)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4().makeBasis(x, y, z);

    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  exit() {
    super.exit();

    // Exit pointer lock
    document.exitPointerLock();

    // Hide info display
    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }

    // Stop cinematic
    if (this.cinematic) {
      this.cinematic.stop();
    }

    // Disable debug FPS
    this.debugFPSMode = false;

    // Clear keys
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }

  dispose() {
    // Remove event listeners
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("keypress", this.onKeyPress);
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);

    // Remove info element
    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    // Dispose cinematic
    if (this.cinematic) {
      this.cinematic.dispose();
      this.cinematic = null;
    }

    super.dispose();
  }
}
