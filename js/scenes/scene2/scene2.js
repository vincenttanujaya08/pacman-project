// js/scenes/scene2/Scene2.js
// Scene 2 - Forest (Complete version with config)

import BaseScene from "../BaseScene.js";
import config from "./config.js";

export default class Scene2 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;

    // Models
    this.forestModel = null;

    // Lights
    this.ambientLight = null;
    this.sunLight = null;
    this.fillLight = null;

    // Setup mode
    this.setupMode = true;
    this.currentScale = {
      forest: 1.0,
    };

    // Info display
    this.infoElement = null;

    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Loading models...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // Setup background
    this.scene.background = new THREE.Color(this.config.background.color);

    // Setup fog if enabled
    if (this.config.lighting.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.config.lighting.fog.color,
        this.config.lighting.fog.near,
        this.config.lighting.fog.far
      );
    }

    // Setup lighting
    this.setupLighting();

    // Load Forest model
    try {
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

      this.addObject(this.forestModel, "forest");
      console.log("✅ Forest model loaded");
    } catch (error) {
      console.error("❌ Error loading forest model:", error);
    }

    // ✅ JANGAN set camera di init() - biarkan opening scene yang control
    // Camera akan di-set di enter()

    // Create info display
    this.createInfoDisplay();

    console.log("");
    console.log("========================================");
    console.log("🌲 SCENE 2 - FOREST");
    console.log("========================================");
    console.log("");
    console.log("📦 MODELS:");
    console.log("  [1] Forest scale -  [2] Forest scale +");
    console.log("");
    console.log("💡 LIGHTING:");
    console.log("  [5] Ambient -       [6] Ambient +");
    console.log("  [7] Sun -           [8] Sun +");
    console.log("  [9] Fill -          [0] Fill +");
    console.log("");
    console.log("📋 OTHER:");
    console.log("  [P] Print current config");
    console.log("  [R] Reset to default");
    console.log("  [F] Toggle Free Mode");
    console.log("");
    console.log("========================================");
    console.log("");
  }

  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    // Sun light (directional)
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

    // Shadow settings
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

    // Fill light
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

    console.log("✅ Forest lighting setup");
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // Scale controls
      if (key === "1") {
        this.currentScale.forest -= 0.1;
        this.updateForestScale();
      }
      if (key === "2") {
        this.currentScale.forest += 0.1;
        this.updateForestScale();
      }

      // Lighting controls
      if (key === "5") {
        this.ambientLight.intensity = Math.max(
          0,
          this.ambientLight.intensity - 0.1
        );
        this.updateInfo();
      }
      if (key === "6") {
        this.ambientLight.intensity = Math.min(
          2,
          this.ambientLight.intensity + 0.1
        );
        this.updateInfo();
      }
      if (key === "7") {
        this.sunLight.intensity = Math.max(0, this.sunLight.intensity - 0.1);
        this.updateInfo();
      }
      if (key === "8") {
        this.sunLight.intensity = Math.min(3, this.sunLight.intensity + 0.1);
        this.updateInfo();
      }
      if (key === "9") {
        this.fillLight.intensity = Math.max(0, this.fillLight.intensity - 0.1);
        this.updateInfo();
      }
      if (key === "0") {
        this.fillLight.intensity = Math.min(3, this.fillLight.intensity + 0.1);
        this.updateInfo();
      }

      // Utilities
      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }
      if (key === "f" || key === "F") {
        this.toggleFreeMode();
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
      console.log(`🌲 Forest scale: ${this.currentScale.forest.toFixed(2)}`);
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
    this.infoElement.style.display = "none"; // Hidden until scene is active
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    this.infoElement.innerHTML = `
      <strong>🌲 SCENE 2 - FOREST</strong><br>
      <br>
      <strong>📦 MODEL</strong><br>
      Forest Scale: ${this.currentScale.forest.toFixed(2)}<br>
      <br>
      <strong>💡 LIGHTING</strong><br>
      Ambient: ${this.ambientLight.intensity.toFixed(2)}<br>
      Sun: ${this.sunLight.intensity.toFixed(2)}<br>
      Fill: ${this.fillLight.intensity.toFixed(2)}<br>
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 CURRENT CONFIGURATION - SCENE 2");
    console.log("========================================");
    console.log("");
    console.log("// Copy this to config.js");
    console.log("");
    console.log("scale: {");
    console.log(
      `  forest: { x: ${this.currentScale.forest}, y: ${this.currentScale.forest}, z: ${this.currentScale.forest} }`
    );
    console.log("},");
    console.log("");
    console.log("lighting: {");
    console.log("  ambient: {");
    console.log(`    intensity: ${this.ambientLight.intensity.toFixed(2)}`);
    console.log("  },");
    console.log("  sun: {");
    console.log(`    intensity: ${this.sunLight.intensity.toFixed(2)}`);
    console.log("  },");
    console.log("  fill: {");
    console.log(`    intensity: ${this.fillLight.intensity.toFixed(2)}`);
    console.log("  }");
    console.log("},");
    console.log("");
    console.log("========================================");
    console.log("");
  }

  resetToDefault() {
    this.currentScale.forest = this.config.scale.forest.x;
    this.updateForestScale();

    this.ambientLight.intensity = this.config.lighting.ambient.intensity;
    this.sunLight.intensity = this.config.lighting.sun.intensity;
    this.fillLight.intensity = this.config.lighting.fill.intensity;

    this.updateInfo();
    console.log("✅ Reset to default values");
  }

  toggleFreeMode() {
    const app = window.app;
    if (app && app.cameraController) {
      app.toggleMode();
    }
  }

  enter() {
    super.enter();

    // ✅ SET CAMERA DI SINI (saat scene aktif)
    const app = window.app;
    if (app && app.cameraController) {
      app.cameraController.setExactPosition(
        this.config.camera.initial,
        this.config.camera.lookAt
      );
    } else {
      this.camera.position.set(
        this.config.camera.initial.x,
        this.config.camera.initial.y,
        this.config.camera.initial.z
      );
      this.camera.lookAt(
        this.config.camera.lookAt.x,
        this.config.camera.lookAt.y,
        this.config.camera.lookAt.z
      );
    }

    // Show info display
    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();
    console.log("🌲 Scene 2 (Forest) entered!");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    // Add any animations here if needed
    // Example: rotate forest slowly
    // if (this.forestModel) {
    //   this.forestModel.rotation.y += 0.0001 * deltaTime;
    // }
  }

  exit() {
    super.exit();

    // Hide info display
    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }

    console.log("🌲 Scene 2 (Forest) exited");
  }

  dispose() {
    document.removeEventListener("keypress", this.onKeyPress);

    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    super.dispose();
  }
}
