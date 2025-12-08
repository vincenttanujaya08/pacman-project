// js/scenes/scene2/Scene2.js
// Scene 2 - Forest Environment

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
    this.mainLight = null;
    this.fillLight = null;

    // Setup mode
    this.currentScale = {
      forest: 1.0,
    };

    // For displaying info
    this.infoElement = null;

    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Loading forest model...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // ✅ BLACK BACKGROUND - HITAM PEKAT
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = null; // No fog

    // Load Forest Model
    try {
      console.log("📦 Loading forest.glb...");
      const forestGltf = await this.loadModel(this.config.models.forest);
      this.forestModel = forestGltf.scene;

      this.forestModel.position.set(
        this.config.positions.forest.x,
        this.config.positions.forest.y,
        this.config.positions.forest.z
      );

      this.forestModel.scale.set(
        this.config.scale.forest.x,
        this.config.scale.forest.y,
        this.config.scale.forest.z
      );

      this.forestModel.rotation.set(
        this.config.rotations.forest.x,
        this.config.rotations.forest.y,
        this.config.rotations.forest.z
      );

      this.forestModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.addObject(this.forestModel, "forest");
      console.log("✅ Forest model loaded successfully!");
    } catch (error) {
      console.error("❌ Error loading forest:", error);
    }

    // Setup Lighting
    this.setupLighting();

    // Setup camera
    const app = window.app;
    if (app && app.cameraController) {
      // ✅ Switch to FREE mode for Scene 2
      app.cameraController.setMode("free");

      app.cameraController.setExactPosition(
        this.config.camera.initial,
        this.config.camera.lookAt
      );

      console.log("✅ Camera in FREE mode for Scene 2");
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

    // Create info display
    this.createInfoDisplay();

    console.log("");
    console.log("========================================");
    console.log("🌲 SCENE 2 - FOREST ENVIRONMENT");
    console.log("========================================");
    console.log("");
    console.log("📦 MODEL CONTROLS:");
    console.log("  [1] Forest scale -  [2] Forest scale +");
    console.log("  [3] Rotate Y -      [4] Rotate Y +");
    console.log("");
    console.log("💡 LIGHTING CONTROLS:");
    console.log("  [5] Ambient -       [6] Ambient +");
    console.log("  [7] Main -          [8] Main +");
    console.log("");
    console.log("📋 OTHER:");
    console.log("  [P] Print current config");
    console.log("  [R] Reset to default");
    console.log("");
    console.log("🎮 CAMERA (FREE MODE):");
    console.log("  WASD - Move");
    console.log("  Mouse Drag - Rotate");
    console.log("  Scroll - Zoom");
    console.log("  Q - Down | E - Up");
    console.log("  Shift - Sprint");
    console.log("");
    console.log("========================================");
    console.log("");
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      this.config.lighting.ambient.intensity
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    this.mainLight = new THREE.DirectionalLight(
      this.config.lighting.main.color,
      this.config.lighting.main.intensity
    );
    this.mainLight.position.set(
      this.config.lighting.main.position.x,
      this.config.lighting.main.position.y,
      this.config.lighting.main.position.z
    );
    this.mainLight.castShadow = true;

    this.mainLight.shadow.mapSize.width = 2048;
    this.mainLight.shadow.mapSize.height = 2048;
    this.mainLight.shadow.camera.left = -100;
    this.mainLight.shadow.camera.right = 100;
    this.mainLight.shadow.camera.top = 100;
    this.mainLight.shadow.camera.bottom = -100;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 500;

    this.scene.add(this.mainLight);
    this.lights.push(this.mainLight);

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

    console.log("✅ Lighting setup complete");
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // Model scale
      if (key === "1") {
        this.currentScale.forest -= 0.1;
        this.currentScale.forest = Math.max(0.1, this.currentScale.forest);
        this.updateForestScale();
      }
      if (key === "2") {
        this.currentScale.forest += 0.1;
        this.updateForestScale();
      }

      // Model rotation
      if (key === "3") {
        if (this.forestModel) {
          this.forestModel.rotation.y -= 0.1;
          this.updateInfo();
        }
      }
      if (key === "4") {
        if (this.forestModel) {
          this.forestModel.rotation.y += 0.1;
          this.updateInfo();
        }
      }

      // Lighting
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
        this.mainLight.intensity = Math.max(0, this.mainLight.intensity - 0.1);
        this.updateInfo();
      }
      if (key === "8") {
        this.mainLight.intensity = Math.min(3, this.mainLight.intensity + 0.1);
        this.updateInfo();
      }

      // Utilities
      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }
      if (key === "r" || key === "R") {
        this.resetToDefault();
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
    this.infoElement.style.color = "#00FF00";
    this.infoElement.style.padding = "15px";
    this.infoElement.style.fontFamily = "monospace";
    this.infoElement.style.fontSize = "14px";
    this.infoElement.style.borderRadius = "5px";
    this.infoElement.style.border = "2px solid #00FF00";
    this.infoElement.style.zIndex = "999";
    this.infoElement.style.lineHeight = "1.5";
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    const rotationDeg = this.forestModel
      ? ((this.forestModel.rotation.y * 180) / Math.PI).toFixed(1)
      : "0.0";

    this.infoElement.innerHTML = `
            <strong>🌲 SCENE 2 - FOREST</strong><br>
            <br>
            <strong>📦 MODEL</strong><br>
            Scale: ${this.currentScale.forest.toFixed(2)}<br>
            Rotation Y: ${rotationDeg}°<br>
            <br>
            <strong>💡 LIGHTING</strong><br>
            Ambient: ${this.ambientLight.intensity.toFixed(2)}<br>
            Main: ${this.mainLight.intensity.toFixed(2)}<br>
        `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 SCENE 2 - CURRENT CONFIGURATION");
    console.log("========================================");
    console.log("");
    console.log("// Copy this to config.js");
    console.log("");
    console.log("scale: {");
    console.log(
      `    forest: { x: ${this.currentScale.forest}, y: ${this.currentScale.forest}, z: ${this.currentScale.forest} }`
    );
    console.log("},");
    console.log("");
    if (this.forestModel) {
      console.log("rotations: {");
      console.log(
        `    forest: { x: ${this.forestModel.rotation.x}, y: ${this.forestModel.rotation.y}, z: ${this.forestModel.rotation.z} }`
      );
      console.log("},");
      console.log("");
    }
    console.log("lighting: {");
    console.log("    ambient: {");
    console.log(`        intensity: ${this.ambientLight.intensity},`);
    console.log("    },");
    console.log("    main: {");
    console.log(`        intensity: ${this.mainLight.intensity},`);
    console.log("    },");
    console.log("},");
    console.log("");
    console.log("========================================");
    console.log("");
  }

  resetToDefault() {
    this.currentScale.forest = 1.0;
    this.updateForestScale();

    if (this.forestModel) {
      this.forestModel.rotation.y = 0;
    }

    this.ambientLight.intensity = this.config.lighting.ambient.intensity;
    this.mainLight.intensity = this.config.lighting.main.intensity;
    this.fillLight.intensity = this.config.lighting.fill.intensity;

    this.updateInfo();
    console.log("✅ Reset to default values");
  }

  enter() {
    super.enter();
    this.updateInfo();

    // ✅ Remove white fade overlay dari Opening Scene
    const whiteFade = document.getElementById("white-fade");
    if (whiteFade) {
      console.log("🎨 Fading out white overlay...");
      whiteFade.style.transition = "opacity 1500ms ease"; // 1.5 detik fade out
      whiteFade.style.opacity = "0";
      setTimeout(() => {
        whiteFade.remove();
        console.log("✅ White fade removed");
      }, 1500);
    }

    console.log("🌲 Welcome to Scene 2 - Forest Environment!");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    // Add any Scene 2 specific updates here
    // For example: animate forest elements, wind effects, etc.
  }

  exit() {
    super.exit();

    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }
  }

  dispose() {
    document.removeEventListener("keypress", this.onKeyPress);

    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    // Dispose forest model
    if (this.forestModel) {
      this.forestModel.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.map) mat.map.dispose();
                mat.dispose();
              });
            } else {
              if (child.material.map) child.material.map.dispose();
              child.material.dispose();
            }
          }
        }
      });
      this.scene.remove(this.forestModel);
      this.forestModel = null;
      console.log("✅ Forest model disposed");
    }

    super.dispose();
  }
}
