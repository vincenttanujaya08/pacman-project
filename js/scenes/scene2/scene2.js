// js/scenes/scene2/Scene2.js
// Scene 2 - Using particles config from config.js
// ✅ WITH APOCALYPSE MODE (Toggle with K key)
// ✅ WITH CINEMATIC SEQUENCE (Trigger with SPACE key)

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import CameraMode from "./CameraMode.js";
import LightParticles from "./LightParticles.js";
import GhostController from "./GhostController.js";
import Scene2Cinematic from "./Scene2Cinematic.js";

export default class Scene2 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;
    this.forestModel = null;
    this.cameraMode = null;
    this.lightParticles = null;
    this.ghostModel = null;
    this.ghostController = null;
    this.ghostMixer = null;
    this.ghostSpotlight = null;
    this.ghostPointLight = null;
    this.ghostRings = [];
    this.ambientLight = null;
    this.sunLight = null;
    this.fillLight = null;
    this.setupMode = true;
    this.currentScale = {
      forest: config.scale.forest.x,
    };
    this.infoElement = null;
    this.materialDarkness = 0.15;

    this.isApocalypseMode = false;

    // ✅ Cinematic controller
    this.cinematic = null;

    // ✅ Setup keyboard controls (but don't attach yet)
    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Init started...`);

    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    this.scene.background = new THREE.Color(this.config.background.color);

    if (this.config.lighting.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.lighting.fog.color,
        this.config.lighting.fog.near,
        this.config.lighting.fog.far
      );
    }

    this.setupLighting();

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

    this.cameraMode = new CameraMode(this.scene, this.camera, this.renderer);
    this.cameraMode.setMode("fps");
    console.log("✅ Camera mode ready (FPS)");

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

    try {
      console.log("Loading ghost model...");
      const ghostGltf = await this.loadModel(this.config.models.ghost);
      this.ghostModel = ghostGltf.scene;

      this.ghostModel.scale.set(
        this.config.scale.ghost.x,
        this.config.scale.ghost.y,
        this.config.scale.ghost.z
      );

      this.ghostModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.ghostModel.visible = true;

      this.addObject(this.ghostModel, "ghost");
      console.log("✅ Ghost loaded");

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

      this.ghostController = new GhostController(this.ghostModel);
      console.log("✅ Ghost controller ready");
      console.log("💡 Press [G] to start ghost animation");

      this.setupGhostLighting();
      this.setupGhostAura();

      // ✅ Setup cinematic controller
      this.cinematic = new Scene2Cinematic(
        this.camera,
        this.cameraMode,
        this.ghostModel,
        this.ghostController,
        this.ghostSpotlight,
        this.ghostPointLight,
        this.ghostRings
      );
      console.log("✅ Cinematic controller ready");
      console.log("💡 Press [SPACE] to start cinematic sequence");
    } catch (error) {
      console.error("❌ Error loading ghost:", error);
    }

    this.createInfoDisplay();
    console.log("✅ Scene 2 ready!");
    console.log("💡 Press [K] to toggle APOCALYPSE MODE");
    console.log("💡 Press [SPACE] to start CINEMATIC");
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

  setupGhostLighting() {
    if (!this.ghostModel) return;

    this.ghostSpotlight = new THREE.SpotLight(
      0xff0000,
      3.0,
      30,
      Math.PI / 4,
      0.5,
      1
    );

    this.ghostSpotlight.position.set(
      this.ghostModel.position.x,
      this.ghostModel.position.y + 15,
      this.ghostModel.position.z
    );

    this.ghostSpotlight.target = this.ghostModel;
    this.ghostSpotlight.castShadow = true;
    this.ghostSpotlight.shadow.mapSize.width = 1024;
    this.ghostSpotlight.shadow.mapSize.height = 1024;

    this.scene.add(this.ghostSpotlight);
    this.scene.add(this.ghostSpotlight.target);

    this.ghostPointLight = new THREE.PointLight(0xff0000, 2.0, 25, 2);

    this.ghostPointLight.position.copy(this.ghostModel.position);

    this.scene.add(this.ghostPointLight);

    console.log("🔴 Ghost dramatic red lighting setup complete");
    console.log("   - Red spotlight from above");
    console.log("   - Red point light aura");
  }

  setupGhostAura() {
    if (!this.ghostModel) return;

    const ghostPos = this.ghostModel.position;

    const ringConfigs = [
      { radius: 4.5, thickness: 0.4, tilt: Math.PI / 4, speed: 0.6 },
      { radius: 4.5, thickness: 0.4, tilt: -Math.PI / 4, speed: -0.6 },
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
      ring.rotation.x = config.tilt;

      ring.userData.rotationSpeed = config.speed;

      this.ghostRings.push(ring);
      this.scene.add(ring);
    });

    console.log("✨ Ghost aura effects setup complete");
    console.log(`   - 2 atom-style crossing rings (diagonal orbits)`);
  }

  darkenForestMaterials() {
    if (!this.forestModel) return;

    const brightness = this.materialDarkness;

    this.forestModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      if (!child.material.userData.originalColor) {
        child.material = child.material.clone();
        child.material.userData.originalColor = child.material.color.clone();
      }

      const mat = child.material;
      const originalColor = mat.userData.originalColor;

      mat.color.copy(originalColor).multiplyScalar(brightness);

      if ("emissive" in mat) {
        mat.emissive.setRGB(0, 0, 0);
      }

      if ("metalness" in mat) mat.metalness = 0.0;
      if ("roughness" in mat) mat.roughness = 1.0;

      mat.transparent = false;
      mat.opacity = 1.0;
    });

    console.log(
      `🌙 Forest brightness: ${(brightness * 100).toFixed(
        0
      )}% (same for both modes)`
    );
  }

  toggleApocalypseMode() {
    this.isApocalypseMode = !this.isApocalypseMode;

    if (this.isApocalypseMode) {
      console.log("🔥 APOCALYPSE MODE ACTIVATED");

      this.scene.background = new THREE.Color(0x000000);

      this.scene.fog = new THREE.Fog(0x0d0808, 10, 200);

      this.ambientLight.color.setHex(0x221a1a);
      this.ambientLight.intensity = 0.3;

      this.sunLight.color.setHex(0x5a4a50);
      this.sunLight.intensity = 0.5;

      this.fillLight.color.setHex(0x2a2428);
      this.fillLight.intensity = 0.2;

      if (this.lightParticles) {
        this.lightParticles.setColor(0x421212);
      }

      this.darkenForestMaterials();
    } else {
      console.log("🌲 NORMAL MODE ACTIVATED");

      this.scene.background = new THREE.Color(this.config.background.color);

      this.scene.fog = new THREE.Fog(
        this.config.lighting.fog.color,
        this.config.lighting.fog.near,
        this.config.lighting.fog.far
      );

      this.ambientLight.color.setHex(this.config.lighting.ambient.color);
      this.ambientLight.intensity = this.config.lighting.ambient.intensity;

      this.sunLight.color.setHex(this.config.lighting.sun.color);
      this.sunLight.intensity = this.config.lighting.sun.intensity;

      this.fillLight.color.setHex(this.config.lighting.fill.color);
      this.fillLight.intensity = this.config.lighting.fill.intensity;

      if (this.lightParticles) {
        this.lightParticles.setColor(0xffffb4);
      }

      this.darkenForestMaterials();
    }

    this.updateInfo();
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // ✅ SPACE for cinematic
      if (key === " ") {
        if (this.cinematic) {
          this.cinematic.start();
        }
        return;
      }

      if (key === "k" || key === "K") {
        this.toggleApocalypseMode();
        return;
      }

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

      if (key === "x") {
        if (this.ghostController) {
          this.ghostController.stop();
        }
        // ✅ Stop cinematic
        if (this.cinematic) {
          this.cinematic.stop();
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
      <strong>🎬 CINEMATIC</strong><br>
      Status: ${
        this.cinematic && this.cinematic.isPlaying ? "Playing" : "Idle"
      }<br>
      <br>
      <strong>[SPACE] Cinematic | [K] Apocalypse | [G] Ghost | [x] Stop</strong>
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

    // ✅ Add keyboard event listener when entering scene
    document.addEventListener("keypress", this.onKeyPress);

    const app = window.app;
    if (app && app.cameraController) {
      app.cameraController.freeControls.enabled = false;
    }

    if (this.cameraMode) {
      const startPos = new THREE.Vector3(
        this.config.camera.initial.x,
        this.config.camera.initial.y,
        this.config.camera.initial.z
      );

      this.cameraMode.playerPosition.copy(startPos);

      if (this.cameraMode.targetSphere) {
        this.cameraMode.targetSphere.position.copy(startPos);
      }

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

    if (this.ghostModel && this.ghostController) {
      const ghostPos = new THREE.Vector3(
        this.config.ghost.position.x,
        this.config.ghost.position.y,
        this.config.ghost.position.z
      );

      this.ghostController.setSpawnPosition(ghostPos);

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
    console.log("💡 Press [SPACE] to start CINEMATIC");
    console.log("💡 Press [K] to toggle APOCALYPSE MODE");
    console.log("💡 Press [G] to start ghost animation");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    if (this.lightParticles) {
      this.lightParticles.update(deltaTime);
    }

    // ✅ Update cinematic first (takes priority over manual camera)
    if (this.cinematic) {
      this.cinematic.update(deltaTime);
    }

    // Only update manual camera if cinematic not playing
    if (this.cameraMode && (!this.cinematic || !this.cinematic.isPlaying)) {
      this.cameraMode.update(deltaTime / 1000);
    }

    if (this.ghostMixer) {
      this.ghostMixer.update(deltaTime / 1000);
    }

    if (this.ghostController) {
      this.ghostController.update(deltaTime);
    }

    if (this.ghostModel && this.ghostSpotlight && this.ghostPointLight) {
      const ghostPos = this.ghostModel.position;

      this.ghostSpotlight.position.set(ghostPos.x, ghostPos.y + 15, ghostPos.z);

      this.ghostPointLight.position.copy(ghostPos);
    }

    if (this.ghostModel) {
      const ghostPos = this.ghostModel.position;

      this.ghostRings.forEach((ring) => {
        ring.position.copy(ghostPos);

        ring.rotation.y +=
          ring.userData.rotationSpeed * 0.01 * (deltaTime / 16);
      });
    }

    // ✅ Update info to show cinematic status
    if (this.cinematic) {
      this.updateInfo();
    }
  }

  exit() {
    super.exit();

    // ✅ Remove keyboard event listener when exiting scene
    document.removeEventListener("keypress", this.onKeyPress);

    const app = window.app;
    if (app && app.cameraController) {
      app.cameraController.freeControls.enabled = true;
    }

    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }
  }

  dispose() {
    // ✅ Remove event listener (backup, should already be removed in exit)
    document.removeEventListener("keypress", this.onKeyPress);

    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    if (this.lightParticles) {
      this.lightParticles.dispose();
      this.lightParticles = null;
    }

    if (this.ghostMixer) {
      this.ghostMixer.stopAllAction();
      this.ghostMixer = null;
    }

    if (this.ghostSpotlight) {
      this.scene.remove(this.ghostSpotlight);
      this.scene.remove(this.ghostSpotlight.target);
      this.ghostSpotlight = null;
    }

    if (this.ghostPointLight) {
      this.scene.remove(this.ghostPointLight);
      this.ghostPointLight = null;
    }

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
