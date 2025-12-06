// js/scenes/opening/OpeningScene.js
// Opening Scene - Pacman walks in cityscape with cinematic lighting

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import RainEffect from "./RainEffect.js";
import PacmanController from "./PacmanController.js";

export default class OpeningScene extends BaseScene {
  constructor(name, renderer, camera) {
    super(name, renderer, camera);

    this.config = config;

    // Models
    this.cityModel = null;
    this.pacmanModel = null;
    this.mixer = null;
    this.pacmanController = null;

    // Lights
    this.ambientLight = null;
    this.mainLight = null;
    this.fillLight = null;
    this.neonLight = null;

    // ✅ Cinematic Lighting System
    this.pacmanSpotlight = null; // Follow Pacman
    this.streetLights = []; // Area-based lights (collision zones)

    // Effects
    this.rainEffect = null;

    // Setup mode (for adjusting)
    this.setupMode = true;
    this.currentScale = {
      city: 0.5,
      pacman: 0.05,
    };

    // For displaying info
    this.infoElement = null;

    this.setupKeyboardControls();
  }

  async init() {
    await super.init();

    console.log(`[${this.name}] Loading models...`);

    // Remove default lights
    this.lights.forEach((light) => this.scene.remove(light));
    this.lights = [];

    // Load City
    try {
      const cityGltf = await this.loadModel(this.config.models.city);
      this.cityModel = cityGltf.scene;
      this.cityModel.position.set(
        this.config.positions.city.x,
        this.config.positions.city.y,
        this.config.positions.city.z
      );
      this.cityModel.scale.set(
        this.config.scale.city.x,
        this.config.scale.city.y,
        this.config.scale.city.z
      );

      // Enable shadows
      this.cityModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.addObject(this.cityModel, "city");
      console.log("✅ City loaded");
    } catch (error) {
      console.error("❌ Error loading city:", error);
    }

    // Load Pacman
    try {
      const pacmanGltf = await this.loadModel(this.config.models.pacman);
      this.pacmanModel = pacmanGltf.scene;
      this.pacmanModel.position.set(
        this.config.positions.pacman.x,
        this.config.positions.pacman.y,
        this.config.positions.pacman.z
      );
      this.pacmanModel.scale.set(
        this.config.scale.pacman.x,
        this.config.scale.pacman.y,
        this.config.scale.pacman.z
      );

      // Enable shadows
      this.pacmanModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.addObject(this.pacmanModel, "pacman");
      console.log("✅ Pacman loaded");

      // Setup animation (mouth open/close)
      if (pacmanGltf.animations && pacmanGltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.pacmanModel);
        const action = this.mixer.clipAction(pacmanGltf.animations[0]);
        action.play();
        console.log("✅ Pacman mouth animation playing");
      }

      // ✅ Setup Pacman movement controller
      this.pacmanController = new PacmanController(this.pacmanModel);
      console.log("✅ Pacman movement controller ready");
    } catch (error) {
      console.error("❌ Error loading pacman:", error);
    }

    // Setup Lighting
    this.setupLighting();

    // ✅ Setup Cinematic Lighting System
    this.setupCinematicLights();

    // ✅ Setup Rain Effect
    if (this.config.rain.enabled) {
      this.rainEffect = new RainEffect(this.scene, this.config.rain);
      this.rainEffect.init();
    }

    // Setup camera
    this.camera.position.set(
      this.config.camera.initial.x,
      this.config.camera.initial.y,
      this.config.camera.initial.z
    );

    // Create info display
    this.createInfoDisplay();

    console.log("");
    console.log("========================================");
    console.log("🎬 OPENING SCENE - CINEMATIC MODE");
    console.log("========================================");
    console.log("");
    console.log("📦 MODELS:");
    console.log("  [1] City scale -    [2] City scale +");
    console.log("  [3] Pacman scale -  [4] Pacman scale +");
    console.log("");
    console.log("💡 LIGHTING:");
    console.log("  [5] Ambient -       [6] Ambient +");
    console.log("  [7] Main -          [8] Main +");
    console.log("  [9] Neon -          [0] Neon +");
    console.log("");
    console.log("🎮 PACMAN ANIMATION:");
    console.log("  [SPACE] Start Pacman walk");
    console.log("  [X] Stop animation");
    console.log("  [C] Reset to start");
    console.log("");
    console.log("📋 OTHER:");
    console.log("  [P] Print current config");
    console.log("  [R] Reset to default");
    console.log("  [F] Toggle Free Mode");
    console.log("");
    console.log("💡 CINEMATIC FEATURES:");
    console.log("  - Spotlight follows Pacman");
    console.log("  - Progressive brightness");
    console.log("  - Street lights auto-on (collision)");
    console.log("  - Continuous shadow coverage");
    console.log("");
    console.log("💡 TIP: Press SPACE to start!");
    console.log("========================================");
    console.log("");
  }

  setupLighting() {
    // ✅ Night atmosphere background
    this.scene.background = new THREE.Color(0x0a0015); // Very dark purple

    // ✅ Fog for depth and atmosphere
    this.scene.fog = new THREE.Fog(
      this.config.lighting.fog.color,
      this.config.lighting.fog.near,
      this.config.lighting.fog.far
    );

    // Ambient Light (dark purple) - START VERY LOW
    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      0.1 // ✅ Very low at start, will increase
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    // Main Directional Light (purple-ish) - START LOW
    this.mainLight = new THREE.DirectionalLight(
      this.config.lighting.main.color,
      0.2 // ✅ Low at start
    );
    this.mainLight.position.set(
      this.config.lighting.main.position.x,
      this.config.lighting.main.position.y,
      this.config.lighting.main.position.z
    );
    this.mainLight.castShadow = true;

    // ✅ FIX SHADOW CLIPPING: Enlarge shadow camera frustum
    this.mainLight.shadow.mapSize.width = 4096; // Higher quality
    this.mainLight.shadow.mapSize.height = 4096;
    this.mainLight.shadow.camera.left = -150; // ✅ Much wider coverage
    this.mainLight.shadow.camera.right = 150;
    this.mainLight.shadow.camera.top = 150;
    this.mainLight.shadow.camera.bottom = -150;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 500;
    this.mainLight.shadow.bias = -0.0001; // ✅ Prevent shadow acne

    this.scene.add(this.mainLight);
    this.lights.push(this.mainLight);

    // Fill Light (Dark yellow/gold)
    this.fillLight = new THREE.DirectionalLight(
      this.config.lighting.fill.color,
      0.2 // ✅ Low at start
    );
    this.fillLight.position.set(
      this.config.lighting.fill.position.x,
      this.config.lighting.fill.position.y,
      this.config.lighting.fill.position.z
    );
    this.scene.add(this.fillLight);
    this.lights.push(this.fillLight);

    console.log("✅ Base lighting setup (continuous shadows)");
  }

  setupCinematicLights() {
    // ============================================
    // A) SPOTLIGHT FOLLOW PACMAN (Main actor light)
    // ============================================
    this.pacmanSpotlight = new THREE.SpotLight(
      0xffdd00,
      3,
      50,
      Math.PI / 6,
      0.3
    );
    this.pacmanSpotlight.position.set(0, 20, 0);
    this.pacmanSpotlight.castShadow = true;
    this.pacmanSpotlight.shadow.mapSize.width = 2048;
    this.pacmanSpotlight.shadow.mapSize.height = 2048;
    this.scene.add(this.pacmanSpotlight);
    this.scene.add(this.pacmanSpotlight.target);

    // ============================================
    // C) STREET LIGHTS (Area-based, collision detection)
    // ============================================
    // Place lights along Pacman's path
    const streetLightPositions = [
      { x: 15, z: 6.5 }, // Along first path
      { x: 30, z: 6.5 },
      { x: 45, z: 6.5 },
      { x: 60, z: 6.5 }, // At turn point
      { x: 60, z: -20 }, // Along second path
      { x: 60, z: -50 },
      { x: 60, z: -80 }, // At end
    ];

    streetLightPositions.forEach((pos, index) => {
      const light = new THREE.PointLight(0xffaa00, 0, 20); // Start OFF (intensity = 0)
      light.position.set(pos.x, 10, pos.z);
      light.castShadow = true;

      // Store light with collision data
      this.streetLights.push({
        light: light,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        triggerRadius: 15, // ✅ Collision detection radius
        isOn: false,
        targetIntensity: 2.5,
        index: index,
      });

      this.scene.add(light);
    });

    console.log(
      `✅ Cinematic lights: 1 spotlight + ${this.streetLights.length} street lights`
    );
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // Scale controls
      if (key === "1") {
        this.currentScale.city -= 0.1;
        this.updateCityScale();
      }
      if (key === "2") {
        this.currentScale.city += 0.1;
        this.updateCityScale();
      }
      if (key === "3") {
        this.currentScale.pacman -= 0.01;
        this.updatePacmanScale();
      }
      if (key === "4") {
        this.currentScale.pacman += 0.01;
        this.updatePacmanScale();
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
        this.mainLight.intensity = Math.max(0, this.mainLight.intensity - 0.1);
        this.updateInfo();
      }
      if (key === "8") {
        this.mainLight.intensity = Math.min(3, this.mainLight.intensity + 0.1);
        this.updateInfo();
      }
      if (key === "9") {
        if (this.neonLight) {
          this.neonLight.intensity = Math.max(
            0,
            this.neonLight.intensity - 0.1
          );
        }
        this.updateInfo();
      }
      if (key === "0") {
        if (this.neonLight) {
          this.neonLight.intensity = Math.min(
            3,
            this.neonLight.intensity + 0.1
          );
        }
        this.updateInfo();
      }

      // Utility
      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }
      if (key === "f" || key === "F") {
        this.toggleFreeMode();
      }

      // ✅ Pacman animation controls
      if (key === " ") {
        if (this.pacmanController) {
          this.pacmanController.start();
        }
      }
      if (key === "x" || key === "X") {
        if (this.pacmanController) {
          this.pacmanController.stop();
        }
      }
      if (key === "c" || key === "C") {
        if (this.pacmanController) {
          this.pacmanController.reset();
          // Reset lights too
          this.resetCinematicLights();
        }
      }
    };

    document.addEventListener("keypress", this.onKeyPress);
  }

  resetCinematicLights() {
    // Reset ambient and main lights
    this.ambientLight.intensity = 0.1;
    this.mainLight.intensity = 0.2;
    this.fillLight.intensity = 0.2;

    // Turn off all street lights
    this.streetLights.forEach((sl) => {
      sl.light.intensity = 0;
      sl.isOn = false;
    });
  }

  updateCityScale() {
    if (this.cityModel) {
      this.cityModel.scale.set(
        this.currentScale.city,
        this.currentScale.city,
        this.currentScale.city
      );
      this.updateInfo();
    }
  }

  updatePacmanScale() {
    if (this.pacmanModel) {
      this.pacmanModel.scale.set(
        this.currentScale.pacman,
        this.currentScale.pacman,
        this.currentScale.pacman
      );
      this.updateInfo();
    }
  }

  createInfoDisplay() {
    this.infoElement = document.createElement("div");
    this.infoElement.id = "opening-info";
    this.infoElement.style.position = "fixed";
    this.infoElement.style.top = "100px";
    this.infoElement.style.left = "20px";
    this.infoElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.infoElement.style.color = "#FFD700";
    this.infoElement.style.padding = "15px";
    this.infoElement.style.fontFamily = "monospace";
    this.infoElement.style.fontSize = "14px";
    this.infoElement.style.borderRadius = "5px";
    this.infoElement.style.border = "2px solid #FFD700";
    this.infoElement.style.zIndex = "999";
    this.infoElement.style.lineHeight = "1.5";
    document.body.appendChild(this.infoElement);

    this.updateInfo();
  }

  updateInfo() {
    if (!this.infoElement) return;

    const lightsOn = this.streetLights.filter((sl) => sl.isOn).length;

    this.infoElement.innerHTML = `
            <strong>📦 MODELS</strong><br>
            City Scale: ${this.currentScale.city.toFixed(2)}<br>
            Pacman Scale: ${this.currentScale.pacman.toFixed(3)}<br>
            <br>
            <strong>💡 LIGHTING</strong><br>
            Ambient: ${this.ambientLight.intensity.toFixed(2)}<br>
            Main: ${this.mainLight.intensity.toFixed(2)}<br>
            <br>
            <strong>🎬 CINEMATIC</strong><br>
            Street Lights: ${lightsOn}/${this.streetLights.length}<br>
        `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 CURRENT CONFIGURATION");
    console.log("========================================");
    console.log("");
    console.log("// Copy this to config.js");
    console.log("");
    console.log("scale: {");
    console.log(
      `    city: { x: ${this.currentScale.city}, y: ${this.currentScale.city}, z: ${this.currentScale.city} },`
    );
    console.log(
      `    pacman: { x: ${this.currentScale.pacman}, y: ${this.currentScale.pacman}, z: ${this.currentScale.pacman} }`
    );
    console.log("},");
    console.log("");
    console.log("========================================");
    console.log("");
  }

  resetToDefault() {
    this.currentScale.city = 0.5;
    this.currentScale.pacman = 0.05;
    this.updateCityScale();
    this.updatePacmanScale();

    this.resetCinematicLights();

    this.updateInfo();
    console.log("✅ Reset to default values");
  }

  toggleFreeMode() {
    const app = window.app;
    if (app && app.cameraController) {
      if (app.currentMode === "free") {
        app.toggleMode();
      } else {
        app.toggleMode();
      }
    }
  }

  enter() {
    super.enter();
    this.updateInfo();
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    // Update mixer for pacman animation (mouth)
    if (this.mixer) {
      this.mixer.update(deltaTime / 1000);
    }

    // ✅ Update Pacman movement
    if (this.pacmanController) {
      this.pacmanController.update(deltaTime);
    }

    // ✅ Update rain effect
    if (this.rainEffect) {
      this.rainEffect.update(deltaTime);
    }

    // ✅ Update Cinematic Lighting System
    if (
      this.pacmanModel &&
      this.pacmanController &&
      this.pacmanController.isAnimating
    ) {
      this.updateCinematicLighting();
    }
  }

  updateCinematicLighting() {
    const pacmanPos = this.pacmanModel.position;

    // ============================================
    // A) SPOTLIGHT FOLLOW PACMAN
    // ============================================
    if (this.pacmanSpotlight) {
      // Spotlight position above Pacman
      this.pacmanSpotlight.position.set(
        pacmanPos.x,
        pacmanPos.y + 20,
        pacmanPos.z
      );

      // Target Pacman
      this.pacmanSpotlight.target.position.copy(pacmanPos);
      this.pacmanSpotlight.target.updateMatrixWorld();
    }

    // ============================================
    // B) PROGRESSIVE BRIGHTNESS (based on progress)
    // ============================================
    const progress = this.pacmanController.getProgress();

    // Gradually increase ambient and main lights
    const targetAmbient = 0.1 + progress * 0.3; // 0.1 → 0.4
    const targetMain = 0.2 + progress * 0.8; // 0.2 → 1.0
    const targetFill = 0.2 + progress * 0.4; // 0.2 → 0.6

    // Smooth lerp
    this.ambientLight.intensity +=
      (targetAmbient - this.ambientLight.intensity) * 0.05;
    this.mainLight.intensity += (targetMain - this.mainLight.intensity) * 0.05;
    this.fillLight.intensity += (targetFill - this.fillLight.intensity) * 0.05;

    // ============================================
    // C) STREET LIGHTS AUTO-ON (Collision Detection)
    // ============================================
    this.streetLights.forEach((streetLight) => {
      // Calculate distance from Pacman to light
      const distance = pacmanPos.distanceTo(streetLight.position);

      // ✅ COLLISION DETECTION
      if (distance < streetLight.triggerRadius) {
        // Pacman entered trigger zone! Turn light ON
        if (!streetLight.isOn) {
          streetLight.isOn = true;
          console.log(
            `💡 Street light ${streetLight.index} ON (collision detected)`
          );
          this.updateInfo();
        }

        // Smoothly increase intensity
        if (streetLight.light.intensity < streetLight.targetIntensity) {
          streetLight.light.intensity += 0.1;
        }
      }

      // Keep lights on once activated (don't turn off)
    });
  }

  exit() {
    super.exit();

    // Remove info display
    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }
  }

  dispose() {
    // Remove keyboard listener
    document.removeEventListener("keypress", this.onKeyPress);

    // Remove info display
    if (this.infoElement) {
      this.infoElement.remove();
      this.infoElement = null;
    }

    // ✅ Dispose rain effect
    if (this.rainEffect) {
      this.rainEffect.dispose();
      this.rainEffect = null;
    }

    // ✅ Dispose cinematic lights
    if (this.pacmanSpotlight) {
      this.scene.remove(this.pacmanSpotlight);
      this.scene.remove(this.pacmanSpotlight.target);
    }

    this.streetLights.forEach((sl) => {
      this.scene.remove(sl.light);
    });
    this.streetLights = [];

    super.dispose();
  }
}
