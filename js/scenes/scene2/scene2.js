// js/scenes/scene2/Scene2.js
// Scene 2 - Using particles config from config.js
// ✅ WITH APOCALYPSE MODE (Toggle with K key)

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import CameraMode from "./CameraMode.js";
import LightParticles from "./LightParticles.js";
import GhostController from "./GhostController.js"; // ✅ Ghost controller

export default class Scene2 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;
    this.forestModel = null;
    this.cameraMode = null;
    this.lightParticles = null;
    this.ghostModel = null; // ✅ Ghost model
    this.ghostController = null; // ✅ Ghost controller
    this.ghostMixer = null; // ✅ Ghost animation mixer
    this.ghostSpotlight = null; // ✅ Ghost dramatic red spotlight
    this.ghostPointLight = null; // ✅ Ghost red aura point light
    this.ghostRings = []; // ✅ Ghost rotating energy rings (Saturn style - smaller)
    this.ambientLight = null;
    this.sunLight = null;
    this.fillLight = null;
    this.setupMode = true;
    this.currentScale = {
      forest: config.scale.forest.x,
    };
    this.infoElement = null;
    this.materialDarkness = 0.15;

    // ✅ APOCALYPSE MODE
    this.isApocalypseMode = false;

    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Init started...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // Setup background
    this.scene.background = new THREE.Color(this.config.background.color);

    // Setup fog
    if (this.config.lighting.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.lighting.fog.color,
        this.config.lighting.fog.near,
        this.config.lighting.fog.far
      );
    }

    // Setup lighting
    this.setupLighting();

    // ✅ Setup light particles FROM CONFIG
    if (this.config.lightParticles && this.config.lightParticles.enabled) {
      this.lightParticles = new LightParticles(
        this.scene,
        this.camera,
        this.config.lightParticles
      );

      this.lightParticles.init();
      console.log(
        `✨ Light particles: ${this.config.lightParticles.particleCount} particles, size ${this.config.lightParticles.size}`
      );
    }

    // Setup camera mode
    this.cameraMode = new CameraMode(this.scene, this.camera, this.renderer);

    // ✅ START IN FPS MODE (not third person)
    this.cameraMode.setMode("fps");

    console.log("✅ Camera mode ready (FPS)");

    // Load Forest model
    try {
      console.log("Loading forest model...");
      const forestGltf = await this.loadModel(this.config.models.forest);
      this.forestModel = forestGltf.scene;

      this.forestModel.position.set(
        this.config.positions.forest.x,
        this.config.positions.forest.y,
        this.config.positions.forest.z
      );

      this.forestModel.rotation.set(
        this.config.rotations.forest.x,
        this.config.rotations.forest.y,
        this.config.rotations.forest.z
      );

      this.forestModel.scale.set(
        this.config.scale.forest.x,
        this.config.scale.forest.y,
        this.config.scale.forest.z
      );

      // Enable shadows
      this.forestModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      console.log("Darkening materials...");
      this.darkenForestMaterials();

      this.forestModel.visible = true;

      this.addObject(this.forestModel, "forest");
      console.log("✅ Forest loaded");
    } catch (error) {
      console.error("❌ Error loading forest:", error);
    }

    // ✅ Load Ghost model
    try {
      console.log("Loading ghost model...");
      const ghostGltf = await this.loadModel(this.config.models.ghost);
      this.ghostModel = ghostGltf.scene;

      // Set scale
      this.ghostModel.scale.set(
        this.config.scale.ghost.x,
        this.config.scale.ghost.y,
        this.config.scale.ghost.z
      );

      // Enable shadows
      this.ghostModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Position will be set relative to camera when entering scene
      this.ghostModel.visible = true;

      this.addObject(this.ghostModel, "ghost");
      console.log("✅ Ghost loaded");

      // ✅ Setup ghost animation mixer (play built-in animations)
      if (ghostGltf.animations && ghostGltf.animations.length > 0) {
        this.ghostMixer = new THREE.AnimationMixer(this.ghostModel);
        const action = this.ghostMixer.clipAction(ghostGltf.animations[0]);
        action.play();
        console.log(
          `✅ Ghost animation playing (${ghostGltf.animations.length} animations found)`
        );
      } else {
        console.log("⚠️ No animations found in ghost model");
      }

      // Setup ghost controller
      this.ghostController = new GhostController(this.ghostModel);
      console.log("✅ Ghost controller ready");
      console.log("💡 Press [G] to start ghost animation");

      // ✅ Setup DRAMATIC RED lighting for ghost
      this.setupGhostLighting();

      // ✅ Setup ghost aura effects (fog + rings)
      this.setupGhostAura();
    } catch (error) {
      console.error("❌ Error loading ghost:", error);
    }

    this.createInfoDisplay();
    console.log("✅ Scene 2 ready!");
    console.log("💡 Press [K] to toggle APOCALYPSE MODE");
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(
      this.config.lighting.sun.color,
      this.config.lighting.sun.intensity
    );
    this.sunLight.position.set(
      this.config.lighting.sun.position.x,
      this.config.lighting.sun.position.y,
      this.config.lighting.sun.position.z
    );
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;

    this.scene.add(this.sunLight);
    this.lights.push(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(
      this.config.lighting.fill.color,
      this.config.lighting.fill.intensity
    );
    this.fillLight.position.set(
      this.config.lighting.fill.position.x,
      this.config.lighting.fill.position.y,
      this.config.lighting.fill.position.z
    );
    this.scene.add(this.fillLight);
    this.lights.push(this.fillLight);
  }

  // ✅ Setup DRAMATIC RED lighting for ghost (Option A: Horror/Sangar style)
  setupGhostLighting() {
    if (!this.ghostModel) return;

    // 1. RED SPOTLIGHT from above (dramatic horror lighting)
    this.ghostSpotlight = new THREE.SpotLight(
      0xff0000, // Red color
      3.0, // Strong intensity
      30, // Distance
      Math.PI / 4, // Wide angle
      0.5, // Penumbra (soft edges)
      1 // Decay
    );

    this.ghostSpotlight.position.set(
      this.ghostModel.position.x,
      this.ghostModel.position.y + 15, // 15 units above ghost
      this.ghostModel.position.z
    );

    this.ghostSpotlight.target = this.ghostModel;
    this.ghostSpotlight.castShadow = true;
    this.ghostSpotlight.shadow.mapSize.width = 1024;
    this.ghostSpotlight.shadow.mapSize.height = 1024;

    this.scene.add(this.ghostSpotlight);
    this.scene.add(this.ghostSpotlight.target);

    // 2. RED POINT LIGHT (evil aura/glow around ghost)
    this.ghostPointLight = new THREE.PointLight(
      0xff0000, // Red color
      2.0, // Medium intensity
      25, // Radius
      2 // Decay (how fast light fades)
    );

    this.ghostPointLight.position.copy(this.ghostModel.position);

    this.scene.add(this.ghostPointLight);

    console.log("🔴 Ghost dramatic red lighting setup complete");
    console.log("   - Red spotlight from above");
    console.log("   - Red point light aura");
  }

  // ✅ Setup ghost aura effects: Atom-style crossing rings (2 diagonal orbits)
  setupGhostAura() {
    if (!this.ghostModel) return;

    const ghostPos = this.ghostModel.position;

    // 2 ATOM-STYLE RINGS (crossing diagonally like electron orbits)
    const ringConfigs = [
      { radius: 4.5, thickness: 0.4, tilt: Math.PI / 4, speed: 0.6 }, // Tilted +45°
      { radius: 4.5, thickness: 0.4, tilt: -Math.PI / 4, speed: -0.6 }, // Tilted -45° (opposite rotation)
    ];

    ringConfigs.forEach((config, index) => {
      const ringGeometry = new THREE.TorusGeometry(
        config.radius,
        config.thickness,
        16,
        64
      );

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(ghostPos);
      ring.rotation.x = config.tilt; // Diagonal tilt

      // Store rotation speed
      ring.userData.rotationSpeed = config.speed;

      this.ghostRings.push(ring);
      this.scene.add(ring);
    });

    console.log("✨ Ghost aura effects setup complete");
    console.log(`   - 2 atom-style crossing rings (diagonal orbits)`);
  }

  darkenForestMaterials() {
    if (!this.forestModel) return;

    // ✅ ALWAYS use same brightness - don't change darkness in apocalypse mode!
    const brightness = this.materialDarkness;

    this.forestModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Clone material only once
      if (!child.material.userData.originalColor) {
        child.material = child.material.clone();
        child.material.userData.originalColor = child.material.color.clone();
      }

      const mat = child.material;
      const originalColor = mat.userData.originalColor;

      mat.color.copy(originalColor).multiplyScalar(brightness);

      // Remove emissive glow completely (forest should not glow)
      if ("emissive" in mat) {
        mat.emissive.setRGB(0, 0, 0);
      }

      // Make shadows stronger
      if ("metalness" in mat) mat.metalness = 0.0;
      if ("roughness" in mat) mat.roughness = 1.0;

      // No translucency (forest should look deep and dense)
      mat.transparent = false;
      mat.opacity = 1.0;
    });

    console.log(
      `🌙 Forest brightness: ${(brightness * 100).toFixed(
        0
      )}% (same for both modes)`
    );
  }

  // ✅ TOGGLE APOCALYPSE MODE
  toggleApocalypseMode() {
    this.isApocalypseMode = !this.isApocalypseMode;

    if (this.isApocalypseMode) {
      console.log("🔥 APOCALYPSE MODE ACTIVATED");

      // Background: keep black
      this.scene.background = new THREE.Color(0x000000);

      // Fog: very subtle red tint (almost black)
      this.scene.fog = new THREE.Fog(0x0d0808, 10, 200);

      // Lighting: SUPER SUBTLE red tint - masih keliatan jelas!
      this.ambientLight.color.setHex(0x221a1a); // Very subtle red tint
      this.ambientLight.intensity = 0.3; // Keep intensity same

      this.sunLight.color.setHex(0x5a4a50); // Slight purple-red moonlight
      this.sunLight.intensity = 0.5; // Keep intensity same

      this.fillLight.color.setHex(0x2a2428); // Very subtle red fill
      this.fillLight.intensity = 0.2; // Keep intensity same

      // Fireflies: red blood
      if (this.lightParticles) {
        this.lightParticles.setColor(0x421212);
      }

      // Forest: DON'T change darkness - keep visible!
      this.darkenForestMaterials();
    } else {
      console.log("🌲 NORMAL MODE ACTIVATED");

      // Background: normal black
      this.scene.background = new THREE.Color(this.config.background.color);

      // Fog: normal dark blue
      this.scene.fog = new THREE.Fog(
        this.config.lighting.fog.color,
        this.config.lighting.fog.near,
        this.config.lighting.fog.far
      );

      // Lighting: normal moonlight
      this.ambientLight.color.setHex(this.config.lighting.ambient.color);
      this.ambientLight.intensity = this.config.lighting.ambient.intensity;

      this.sunLight.color.setHex(this.config.lighting.sun.color);
      this.sunLight.intensity = this.config.lighting.sun.intensity;

      this.fillLight.color.setHex(this.config.lighting.fill.color);
      this.fillLight.intensity = this.config.lighting.fill.intensity;

      // Fireflies: normal white/yellow
      if (this.lightParticles) {
        this.lightParticles.setColor(0xffffb4);
      }

      // Forest: same brightness
      this.darkenForestMaterials();
    }

    this.updateInfo();
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // ✅ APOCALYPSE MODE TOGGLE
      if (key === "k" || key === "K") {
        this.toggleApocalypseMode();
        return;
      }

      // ✅ GHOST CONTROLS
      if (key === "g" || key === "G") {
        if (this.ghostController) {
          this.ghostController.start();
        }
        return;
      }

      if (key === "1") {
        this.currentScale.forest -= 1;
        this.updateForestScale();
      }
      if (key === "2") {
        this.currentScale.forest += 1;
        this.updateForestScale();
      }

      if (key === "3") {
        this.materialDarkness = Math.max(0, this.materialDarkness - 0.05);
        this.darkenForestMaterials();
        this.updateInfo();
      }
      if (key === "4") {
        this.materialDarkness = Math.min(1, this.materialDarkness + 0.05);
        this.darkenForestMaterials();
        this.updateInfo();
      }

      if (key === "5") {
        this.ambientLight.intensity = Math.max(
          0,
          this.ambientLight.intensity - 0.05
        );
        this.updateInfo();
      }
      if (key === "6") {
        this.ambientLight.intensity = Math.min(
          1,
          this.ambientLight.intensity + 0.05
        );
        this.updateInfo();
      }
      if (key === "7") {
        this.sunLight.intensity = Math.max(0, this.sunLight.intensity - 0.05);
        this.updateInfo();
      }
      if (key === "8") {
        this.sunLight.intensity = Math.min(1, this.sunLight.intensity + 0.05);
        this.updateInfo();
      }
      if (key === "9") {
        this.fillLight.intensity = Math.max(0, this.fillLight.intensity - 0.05);
        this.updateInfo();
      }
      if (key === "0") {
        this.fillLight.intensity = Math.min(1, this.fillLight.intensity + 0.05);
        this.updateInfo();
      }

      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }
      if (key === "f" || key === "F") {
        this.toggleFreeMode();
      }

      // ✅ GHOST STOP/RESET (lowercase to avoid conflict)
      if (key === "x") {
        if (this.ghostController) {
          this.ghostController.stop();
        }
      }
      if (key === "c") {
        if (this.ghostController) {
          this.ghostController.reset();
        }
      }
    };

    document.addEventListener("keypress", this.onKeyPress);
  }

  updateForestScale() {
    if (this.forestModel) {
      this.forestModel.scale.set(
        this.currentScale.forest,
        this.currentScale.forest,
        this.currentScale.forest
      );
      this.updateInfo();
    }
  }

  createInfoDisplay() {
    this.infoElement = document.createElement("div");
    this.infoElement.id = "scene2-info";
    this.infoElement.style.position = "fixed";
    this.infoElement.style.top = "100px";
    this.infoElement.style.left = "20px";
    this.infoElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.infoElement.style.color = "#00ff00";
    this.infoElement.style.padding = "15px";
    this.infoElement.style.fontFamily = "monospace";
    this.infoElement.style.fontSize = "14px";
    this.infoElement.style.borderRadius = "5px";
    this.infoElement.style.border = "2px solid #00ff00";
    this.infoElement.style.zIndex = "999";
    this.infoElement.style.lineHeight = "1.5";
    this.infoElement.style.display = "none";
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    // ✅ Update border color based on mode
    if (this.isApocalypseMode) {
      this.infoElement.style.borderColor = "#ff0000";
      this.infoElement.style.color = "#ff4444";
    } else {
      this.infoElement.style.borderColor = "#00ff00";
      this.infoElement.style.color = "#00ff00";
    }

    this.infoElement.innerHTML = `
      <strong>🌲 SCENE 2 - ${
        this.isApocalypseMode ? "🔥 APOCALYPSE MODE" : "MAGICAL FOREST"
      }</strong><br>
      <br>
      <strong>📦 MODEL</strong><br>
      Forest Scale: ${this.currentScale.forest.toFixed(2)}<br>
      <br>
      <strong>🎨 MATERIAL</strong><br>
      Darkness: ${(this.materialDarkness * 100).toFixed(0)}%<br>
      <br>
      <strong>💡 LIGHTING</strong><br>
      Ambient: ${this.ambientLight.intensity.toFixed(2)}<br>
      Moonlight: ${this.sunLight.intensity.toFixed(2)}<br>
      Fill: ${this.fillLight.intensity.toFixed(2)}<br>
      <br>
      <strong>✨ EFFECTS</strong><br>
      Light Particles: ${this.lightParticles ? "Active" : "Disabled"}<br>
      <br>
      <strong>👻 GHOST</strong><br>
      Animation: ${
        this.ghostController && this.ghostController.isAnimating
          ? "Running"
          : "Idle"
      }<br>
      <br>
      <strong>[K] Apocalypse | [G] Ghost Start | [x] Stop | [c] Reset</strong>
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 CURRENT CONFIG");
    console.log("========================================");
    console.log("Mode:", this.isApocalypseMode ? "APOCALYPSE" : "NORMAL");
    console.log("Material darkness:", this.materialDarkness.toFixed(2));
    console.log("Ambient:", this.ambientLight.intensity.toFixed(2));
    console.log("Moonlight:", this.sunLight.intensity.toFixed(2));
    console.log("Fill:", this.fillLight.intensity.toFixed(2));
    if (this.lightParticles) {
      console.log("Particles: enabled");
    }
    console.log("========================================");
  }

  resetToDefault() {
    this.currentScale.forest = this.config.scale.forest.x;
    this.updateForestScale();

    this.materialDarkness = 0.15;
    this.darkenForestMaterials();

    this.ambientLight.intensity = this.config.lighting.ambient.intensity;
    this.sunLight.intensity = this.config.lighting.sun.intensity;
    this.fillLight.intensity = this.config.lighting.fill.intensity;

    // Reset to normal mode
    if (this.isApocalypseMode) {
      this.toggleApocalypseMode();
    }

    this.updateInfo();
    console.log("✅ Reset to defaults");
  }

  toggleFreeMode() {
    const app = window.app;
    if (app && app.cameraController) {
      app.toggleMode();
    }
  }

  enter() {
    super.enter();

    const app = window.app;
    if (app && app.cameraController) {
      app.cameraController.freeControls.enabled = false;
    }

    // ✅ Set camera to ABSOLUTE position from config (not calculated)
    if (this.cameraMode) {
      const startPos = new THREE.Vector3(
        this.config.camera.initial.x,
        this.config.camera.initial.y,
        this.config.camera.initial.z
      );

      this.cameraMode.playerPosition.copy(startPos);

      // Set target sphere for third person (if user switches to it)
      if (this.cameraMode.targetSphere) {
        this.cameraMode.targetSphere.position.copy(startPos);
      }

      // ✅ Set initial rotation from config (for FPS mode)
      if (this.config.camera.rotation && this.cameraMode.mode === "fps") {
        this.cameraMode.fps.yaw = this.config.camera.rotation.yaw;
        this.cameraMode.fps.pitch = this.config.camera.rotation.pitch;
        console.log(
          `📹 Camera rotation set: yaw=${this.config.camera.rotation.yaw.toFixed(
            3
          )}, pitch=${this.config.camera.rotation.pitch.toFixed(3)}`
        );
      }

      console.log(
        `📹 Camera set to: (${startPos.x.toFixed(2)}, ${startPos.y.toFixed(
          2
        )}, ${startPos.z.toFixed(2)})`
      );
    }

    // ✅ Spawn ghost at ABSOLUTE position from config
    if (this.ghostModel && this.ghostController) {
      const ghostPos = new THREE.Vector3(
        this.config.ghost.position.x,
        this.config.ghost.position.y,
        this.config.ghost.position.z
      );

      this.ghostController.setSpawnPosition(ghostPos);

      // Set rotation
      this.ghostModel.rotation.set(
        this.config.ghost.rotation.x,
        this.config.ghost.rotation.y,
        this.config.ghost.rotation.z
      );

      console.log("👻 Ghost spawned at absolute position");
    }

    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();
    console.log("🌲 Scene 2 entered!");
    console.log("💡 Press [K] to toggle APOCALYPSE MODE");
    console.log("💡 Press [G] to start ghost animation");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    if (this.lightParticles) {
      this.lightParticles.update(deltaTime);
    }

    if (this.cameraMode) {
      this.cameraMode.update(deltaTime / 1000);
    }

    // ✅ Update ghost built-in animation
    if (this.ghostMixer) {
      this.ghostMixer.update(deltaTime / 1000);
    }

    // ✅ Update ghost movement animation
    if (this.ghostController) {
      this.ghostController.update(deltaTime);
    }

    // ✅ Update ghost lighting to follow ghost position
    if (this.ghostModel && this.ghostSpotlight && this.ghostPointLight) {
      const ghostPos = this.ghostModel.position;

      // Spotlight follows from above
      this.ghostSpotlight.position.set(ghostPos.x, ghostPos.y + 15, ghostPos.z);

      // Point light follows ghost exactly
      this.ghostPointLight.position.copy(ghostPos);
    }

    // ✅ Update ghost aura effects (rings only)
    if (this.ghostModel) {
      const ghostPos = this.ghostModel.position;

      // Update rings position and rotation (Saturn effect)
      this.ghostRings.forEach((ring) => {
        ring.position.copy(ghostPos);

        // Rotate around Y axis (spinning)
        ring.rotation.y +=
          ring.userData.rotationSpeed * 0.01 * (deltaTime / 16);
      });
    }
  }

  exit() {
    super.exit();

    const app = window.app;
    if (app && app.cameraController) {
      app.cameraController.freeControls.enabled = true;
    }

    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }
  }

  dispose() {
    document.removeEventListener("keypress", this.onKeyPress);

    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    if (this.lightParticles) {
      this.lightParticles.dispose();
      this.lightParticles = null;
    }

    // ✅ Stop ghost animation mixer
    if (this.ghostMixer) {
      this.ghostMixer.stopAllAction();
      this.ghostMixer = null;
    }

    // ✅ Remove ghost lights
    if (this.ghostSpotlight) {
      this.scene.remove(this.ghostSpotlight);
      this.scene.remove(this.ghostSpotlight.target);
      this.ghostSpotlight = null;
    }

    if (this.ghostPointLight) {
      this.scene.remove(this.ghostPointLight);
      this.ghostPointLight = null;
    }

    // ✅ Remove ghost aura effects (rings only)
    this.ghostRings.forEach((ring) => {
      this.scene.remove(ring);
      ring.geometry.dispose();
      ring.material.dispose();
    });
    this.ghostRings = [];

    if (this.cameraMode) {
      this.cameraMode.dispose();
      this.cameraMode = null;
    }

    super.dispose();
  }
}
