// js/scenes/opening/OpeningScene.js
// Opening Scene - Pacman walks in cityscape with cinematic lighting

import BaseScene from "../BaseScene.js";
import config from "./config.js";
import RainEffect from "./RainEffect.js";
import PacmanController from "./PacmanController.js";
import LogoEffect from "./LogoEffect.js";

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
    this.pacmanSpotlight = null;
    this.streetLights = [];

    // Effects
    this.rainEffect = null;
    this.logoEffect = null;

    // Setup mode
    this.setupMode = true;
    this.currentScale = {
      city: 0.5,
      pacman: 0.05,
    };

    // For displaying info
    this.infoElement = null;

    // ✅ Transition state
    this.hasTransitioned = false;

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

      this.pacmanModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.addObject(this.pacmanModel, "pacman");
      console.log("✅ Pacman loaded");

      if (pacmanGltf.animations && pacmanGltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.pacmanModel);
        const action = this.mixer.clipAction(pacmanGltf.animations[0]);
        action.play();
        console.log("✅ Pacman mouth animation playing");
      }

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

    // ✅ Setup Logo Effect with camera & cameraController
    if (this.config.logo) {
      const app = window.app;
      this.logoEffect = new LogoEffect(
        this.scene,
        this.config.logo,
        this.camera,
        app ? app.cameraController : null
      );
      await this.logoEffect.init();
      console.log("✅ Logo effect ready");
    }

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
    console.log("  [SPACE] Start animation sequence");
    console.log("  [X] Stop animation");
    console.log("  [C] Reset to start");
    console.log("");
    console.log("📋 OTHER:");
    console.log("  [P] Print current config");
    console.log("  [R] Reset to default");
    console.log("  [F] Toggle Free Mode");
    console.log("");
    console.log("💡 SEQUENCE:");
    console.log("  1. Pacman walks with spotlight");
    console.log("  2. Scene fades to black");
    console.log("  3. Logo appears and fades in");
    console.log("  4. Black hole appears behind logo");
    console.log("  5. Logo gets sucked into black hole");
    console.log("  6. Camera zooms into black hole");
    console.log("  7. Transition to next scene (smooth fade)");
    console.log("");
    console.log("💡 TIP: Press SPACE to start!");
    console.log("========================================");
    console.log("");
  }

  setupLighting() {
    this.scene.background = new THREE.Color(0x0a0015);

    this.scene.fog = new THREE.Fog(
      this.config.lighting.fog.color,
      this.config.lighting.fog.near,
      this.config.lighting.fog.far
    );

    this.ambientLight = new THREE.AmbientLight(
      this.config.lighting.ambient.color,
      0.1
    );
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);

    this.mainLight = new THREE.DirectionalLight(
      this.config.lighting.main.color,
      0.2
    );
    this.mainLight.position.set(
      this.config.lighting.main.position.x,
      this.config.lighting.main.position.y,
      this.config.lighting.main.position.z
    );
    this.mainLight.castShadow = true;

    this.mainLight.shadow.mapSize.width = 4096;
    this.mainLight.shadow.mapSize.height = 4096;
    this.mainLight.shadow.camera.left = -150;
    this.mainLight.shadow.camera.right = 150;
    this.mainLight.shadow.camera.top = 150;
    this.mainLight.shadow.camera.bottom = -150;
    this.mainLight.shadow.camera.near = 0.5;
    this.mainLight.shadow.camera.far = 500;
    this.mainLight.shadow.bias = -0.0001;

    this.scene.add(this.mainLight);
    this.lights.push(this.mainLight);

    this.fillLight = new THREE.DirectionalLight(
      this.config.lighting.fill.color,
      0.2
    );
    this.fillLight.position.set(
      this.config.lighting.fill.position.x,
      this.config.lighting.fill.position.y,
      this.config.lighting.fill.position.z
    );
    this.scene.add(this.fillLight);
    this.lights.push(this.fillLight);

    console.log("✅ Base lighting setup");
  }

  setupCinematicLights() {
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

    const streetLightPositions = [
      { x: 15, z: 6.5 },
      { x: 30, z: 6.5 },
      { x: 45, z: 6.5 },
      { x: 60, z: 6.5 },
      { x: 60, z: -20 },
      { x: 60, z: -50 },
      { x: 60, z: -80 },
    ];

    streetLightPositions.forEach((pos, index) => {
      const light = new THREE.PointLight(0xffaa00, 0, 20);
      light.position.set(pos.x, 10, pos.z);
      light.castShadow = true;

      this.streetLights.push({
        light: light,
        position: new THREE.Vector3(pos.x, 0, pos.z),
        triggerRadius: 15,
        isOn: false,
        targetIntensity: 0.8,
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

      if (key === "p" || key === "P") {
        this.printCurrentConfig();
      }
      if (key === "r" || key === "R") {
        this.resetToDefault();
      }
      if (key === "f" || key === "F") {
        this.toggleFreeMode();
      }

      if (key === "b" || key === "B") {
        if (this.pacmanController) {
          this.pacmanController.start();
          console.log("🎬 Animation sequence started!");
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

          this.scene.background = new THREE.Color(0x0a0015);

          this.scene.fog = new THREE.Fog(
            this.config.lighting.fog.color,
            this.config.lighting.fog.near,
            this.config.lighting.fog.far
          );

          if (this.cityModel) this.cityModel.visible = true;
          if (this.pacmanModel) this.pacmanModel.visible = true;

          if (this.rainEffect && this.rainEffect.particleSystem) {
            this.rainEffect.particleSystem.visible = true;
          }

          this.resetCinematicLights();

          if (this.logoEffect) {
            this.logoEffect.reset();
          }

          // ✅ Reset transition flag
          this.hasTransitioned = false;
        }
      }
    };

    document.addEventListener("keypress", this.onKeyPress);
  }

  resetCinematicLights() {
    this.ambientLight.intensity = 0.1;
    this.mainLight.intensity = 0.2;
    this.fillLight.intensity = 0.2;

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
    this.infoElement.style.display = "none";
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

  // ✅ NEW: Hide opening scene (called when transitioning to next scene)
  hideOpeningScene() {
    console.log("👁️ Hiding opening scene for transition...");

    // Keep scene visible but prepare for fade
    // Don't hide models yet - let SceneManager fade handle it

    if (this.logoEffect) {
      this.logoEffect.hide();
    }

    console.log("✅ Opening scene ready for fade transition");
  }

  // ✅ NEW: Show opening scene and reset state (called when entering scene)
  showOpeningScene() {
    console.log("👁️ Showing opening scene...");

    // Restore background and fog
    this.scene.background = new THREE.Color(0x0a0015);
    this.scene.fog = new THREE.Fog(
      this.config.lighting.fog.color,
      this.config.lighting.fog.near,
      this.config.lighting.fog.far
    );

    // Show models
    if (this.cityModel) this.cityModel.visible = true;
    if (this.pacmanModel) this.pacmanModel.visible = true;

    // Reset pacman position and animation
    if (this.pacmanController) {
      this.pacmanController.reset();
    }

    // Restore lighting
    this.resetCinematicLights();

    // Show rain
    if (this.rainEffect && this.rainEffect.particleSystem) {
      this.rainEffect.particleSystem.visible = true;
    }

    // Reset logo effect
    if (this.logoEffect) {
      this.logoEffect.reset();
    }

    // Reset transition flag
    this.hasTransitioned = false;

    console.log("✅ Opening scene shown and reset!");
  }

  enter() {
    super.enter();

    // ✅ Show and reset opening scene
    this.showOpeningScene();

    // ✅ Set camera position
    const app = window.app;
    if (app && app.cameraController && app.cameraController.freeControls) {
      const ctrl = app.cameraController.freeControls;

      console.log("📹 BEFORE reset:");
      console.log(
        "  Camera:",
        this.camera.position.x.toFixed(2),
        this.camera.position.y.toFixed(2),
        this.camera.position.z.toFixed(2)
      );
      console.log(
        "  Target:",
        ctrl.target.x.toFixed(2),
        ctrl.target.y.toFixed(2),
        ctrl.target.z.toFixed(2)
      );
      console.log("  Enabled:", ctrl.enabled);

      ctrl.enabled = true;
      ctrl.reset();

      app.cameraController.setExactPosition(
        this.config.camera.initial,
        this.config.camera.lookAt
      );

      console.log("📹 AFTER setExactPosition:");
      console.log(
        "  Camera:",
        this.camera.position.x.toFixed(2),
        this.camera.position.y.toFixed(2),
        this.camera.position.z.toFixed(2)
      );
      console.log(
        "  Target:",
        ctrl.target.x.toFixed(2),
        ctrl.target.y.toFixed(2),
        ctrl.target.z.toFixed(2)
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
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    if (this.mixer) {
      this.mixer.update(deltaTime / 1000);
    }

    if (this.pacmanController) {
      this.pacmanController.update(deltaTime);

      if (
        !this.pacmanController.isAnimating &&
        this.pacmanController.hasFinished &&
        this.logoEffect &&
        !this.logoEffect.isVisible
      ) {
        console.log("🎬 Pacman finished! Hiding scene...");

        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = null;

        if (this.cityModel) this.cityModel.visible = false;
        if (this.pacmanModel) this.pacmanModel.visible = false;

        if (this.ambientLight) this.ambientLight.intensity = 0;
        if (this.mainLight) this.mainLight.intensity = 0;
        if (this.fillLight) this.fillLight.intensity = 0;
        if (this.pacmanSpotlight) this.pacmanSpotlight.intensity = 0;
        this.streetLights.forEach((sl) => (sl.light.intensity = 0));

        if (this.rainEffect && this.rainEffect.particleSystem) {
          this.rainEffect.particleSystem.visible = false;
        }

        setTimeout(() => {
          console.log("✨ Showing logo!");

          // ✅ Switch to CINEMATIC mode for camera zoom to work
          const app = window.app;
          if (app && app.cameraController) {
            app.cameraController.setMode("cinematic");
            console.log("📹 Switched to CINEMATIC mode for zoom");
          }

          this.logoEffect.show();
        }, 500);
      }
    }

    if (this.rainEffect) {
      this.rainEffect.update(deltaTime);
    }

    if (this.logoEffect) {
      this.logoEffect.update(deltaTime);

      // ✅ Check if zoom complete - trigger transition to next scene
      if (this.logoEffect.zoomComplete && !this.hasTransitioned) {
        console.log("🎬 Zoom complete! Starting smooth transition...");
        this.hasTransitioned = true; // Prevent multiple triggers

        // ✅ SMOOTH: Don't hide scene, let fade transition handle it
        setTimeout(() => {
          this.transitionToNextScene();
        }, 500); // Short delay for effect
      }
    }

    if (
      this.pacmanModel &&
      this.pacmanController &&
      this.pacmanController.isAnimating
    ) {
      this.updateCinematicLighting();
    }
  }

  // ✅ FIXED: Smooth transition without glitches
  transitionToNextScene() {
    console.log("🎬 Transitioning to next scene...");

    const app = window.app;
    if (!app || !app.sceneManager) {
      console.error("❌ App or SceneManager not found!");
      return;
    }

    // Check if scene 2 exists
    const nextSceneName = "scene2";
    const scene2 = app.sceneManager.getScene(nextSceneName);

    if (!scene2) {
      console.warn(
        `⚠️ Scene "${nextSceneName}" not found. Add it to main.js first!`
      );
      console.log(
        "💡 Create scene 2 first, then uncomment the transition code."
      );
      return;
    }

    // ✅ Prepare opening scene for fade (but don't hide yet)
    this.hideOpeningScene();

    // ✅ Let SceneManager handle the smooth fade transition
    app.sceneManager.switchTo(nextSceneName, "fade");
  }

  updateCinematicLighting() {
    const pacmanPos = this.pacmanModel.position;

    if (this.pacmanSpotlight) {
      this.pacmanSpotlight.position.set(
        pacmanPos.x,
        pacmanPos.y + 20,
        pacmanPos.z
      );

      this.pacmanSpotlight.target.position.copy(pacmanPos);
      this.pacmanSpotlight.target.updateMatrixWorld();
    }

    this.streetLights.forEach((streetLight) => {
      const distance = pacmanPos.distanceTo(streetLight.position);

      if (distance < streetLight.triggerRadius) {
        if (!streetLight.isOn) {
          streetLight.isOn = true;
          console.log(`💡 Street light ${streetLight.index} ON`);
          this.updateInfo();
        }

        if (streetLight.light.intensity < streetLight.targetIntensity) {
          streetLight.light.intensity += 0.1;
        }
      }
    });
  }

  exit() {
    super.exit();

    // ✅ Hide info display when exiting
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

    if (this.rainEffect) {
      this.rainEffect.dispose();
      this.rainEffect = null;
    }

    if (this.logoEffect) {
      this.logoEffect.dispose();
      this.logoEffect = null;
    }

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
