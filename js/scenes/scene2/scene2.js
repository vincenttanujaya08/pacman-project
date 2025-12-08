// js/scenes/scene2/Scene2.js
// Scene 2 - Using particles config from config.js

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import CameraMode from "./CameraMode.js";
import LightParticles from "./LightParticles.js";

export default class Scene2 extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;
    this.forestModel = null;
    this.cameraMode = null;
    this.lightParticles = null;
    this.ambientLight = null;
    this.sunLight = null;
    this.fillLight = null;
    this.setupMode = true;
    this.currentScale = {
      forest: config.scale.forest.x,
    };
    this.infoElement = null;
    this.materialDarkness = 0.15;

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
    console.log("✅ Camera mode ready");

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
      this.darkenForestMaterials(this.materialDarkness);

      this.forestModel.visible = true;

      this.addObject(this.forestModel, "forest");
      console.log("✅ Forest loaded");
    } catch (error) {
      console.error("❌ Error loading forest:", error);
    }

    this.createInfoDisplay();
    console.log("✅ Scene 2 ready!");
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

  darkenForestMaterials() {
    if (!this.forestModel) return;

    this.forestModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Clone material only once
      if (!child.material.userData.originalColor) {
        child.material = child.material.clone();
        child.material.userData.originalColor = child.material.color.clone();
      }

      const mat = child.material;
      const originalColor = mat.userData.originalColor;

      mat.color.copy(originalColor).multiplyScalar(0.25); // 25% brightness

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

    console.log("🌙 Forest materials darkened safely");
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

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
        this.darkenForestMaterials(this.materialDarkness);
        this.updateInfo();
      }
      if (key === "4") {
        this.materialDarkness = Math.min(1, this.materialDarkness + 0.05);
        this.darkenForestMaterials(this.materialDarkness);
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

    this.infoElement.innerHTML = `
      <strong>🌲 SCENE 2 - MAGICAL FOREST</strong><br>
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
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 CURRENT CONFIG");
    console.log("========================================");
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
    this.darkenForestMaterials(this.materialDarkness);

    this.ambientLight.intensity = this.config.lighting.ambient.intensity;
    this.sunLight.intensity = this.config.lighting.sun.intensity;
    this.fillLight.intensity = this.config.lighting.fill.intensity;

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

    // Calculate camera position
    if (this.forestModel && this.cameraMode) {
      const box = new THREE.Box3().setFromObject(this.forestModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const startPos = new THREE.Vector3(
        center.x,
        center.y + size.y * 0.3,
        center.z + size.z * 0.6
      );

      this.cameraMode.playerPosition.copy(startPos);
      this.cameraMode.targetSphere.position.copy(startPos);
    }

    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();
    console.log("🌲 Scene 2 entered!");
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

    if (this.cameraMode) {
      this.cameraMode.dispose();
      this.cameraMode = null;
    }

    super.dispose();
  }
}
