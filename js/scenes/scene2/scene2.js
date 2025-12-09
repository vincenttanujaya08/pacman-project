// js/scenes/scene2/Scene2.js
// Scene 2 - Using particles config from config.js
// ✅ WITH APOCALYPSE MODE (Toggle with K key) + SMOOTH TRANSITION
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
    this.arcadeModel = null; // ✅ NEW: Arcade machine
    this.arcadeMixer = null; // ✅ NEW: Arcade animation mixer
    this.arcadeOriginalMaterials = []; // ✅ NEW: Store original materials for glow effect
    this.ambientLight = null;
    this.sunLight = null;
    this.fillLight = null;
    this.setupMode = true;
    this.currentScale = {
      forest: config.scale.forest.x,
      arcade: config.scale.arcade.x, // ✅ NEW: Arcade scale
    };
    this.infoElement = null;
    this.materialDarkness = 0.6; // ✅ BRIGHTER (was 0.15)
    this.infoPanelVisible = true; // ✅ NEW: Info panel visibility toggle

    this.isApocalypseMode = false;

    // ✅ SMOOTH TRANSITION STATE
    this.isTransitioning = false;
    this.transitionDuration = 1500; // 1.5 seconds
    this.transitionElapsed = 0;

    // Store original colors for smooth lerp
    this.normalColors = {
      background: null,
      fog: null,
      ambient: { color: null, intensity: null },
      sun: { color: null, intensity: null },
      fill: { color: null, intensity: null },
      fireflies: null,
      materialDarkness: 0.6,
    };

    this.apocalypseColors = {
      background: null,
      fog: null,
      ambient: { color: null, intensity: null },
      sun: { color: null, intensity: null },
      fill: { color: null, intensity: null },
      fireflies: null,
      materialDarkness: 0.45,
    };

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

    // ✅ Store normal mode colors
    this.storeNormalColors();

    // ✅ Store apocalypse mode colors from config
    this.storeApocalypseColors();

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

      console.log("Setting up forest materials...");
      this.setupForestMaterials(); // ✅ Store originals

      this.forestModel.visible = true;

      this.addObject(this.forestModel, "forest");
      console.log("✅ Forest loaded (BRIGHTER!)");
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
        this.ghostRings,
        this // ✅ Pass scene2 instance for apocalypse trigger
      );
      console.log("✅ Cinematic controller ready");
      console.log("💡 Press [SPACE] to start cinematic sequence");
    } catch (error) {
      console.error("❌ Error loading ghost:", error);
    }

    // ✅ Load Arcade Machine
    try {
      console.log("Loading arcade machine...");
      const arcadeGltf = await this.loadModel(this.config.models.arcade);
      this.arcadeModel = arcadeGltf.scene;

      this.arcadeModel.position.set(
        this.config.positions.arcade.x,
        this.config.positions.arcade.y,
        this.config.positions.arcade.z
      );

      this.arcadeModel.rotation.set(
        this.config.rotations.arcade.x,
        this.config.rotations.arcade.y,
        this.config.rotations.arcade.z
      );

      this.arcadeModel.scale.set(
        this.config.scale.arcade.x,
        this.config.scale.arcade.y,
        this.config.scale.arcade.z
      );

      this.arcadeModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // ✅ Store original materials for glow effect
          if (child.material) {
            // Clone material to avoid affecting original
            child.material = child.material.clone();

            // ✅ Make arcade emissive (unlit - consistent brightness from any angle!)
            if (child.material.map || child.material.emissiveMap) {
              // If has texture, make it glow (screen + artwork)
              child.material.emissive = new THREE.Color(0xffffff);
              child.material.emissiveMap =
                child.material.map || child.material.emissiveMap;
              child.material.emissiveIntensity = 0.25; // ✅ LOWERED - not too bright in normal
            } else {
              // For non-textured parts, use material color as emissive
              child.material.emissive = child.material.color.clone();
              child.material.emissiveIntensity = 0.25; // ✅ LOWERED - subtle
            }

            // Store original emissive values
            this.arcadeOriginalMaterials.push({
              material: child.material,
              originalEmissive: child.material.emissive.clone(),
              originalEmissiveIntensity: child.material.emissiveIntensity,
            });
          }
        }
      });

      this.arcadeModel.visible = true;

      // ✅ Setup arcade animation
      if (arcadeGltf.animations && arcadeGltf.animations.length > 0) {
        this.arcadeMixer = new THREE.AnimationMixer(this.arcadeModel);
        arcadeGltf.animations.forEach((clip) => {
          const action = this.arcadeMixer.clipAction(clip);
          action.play();
        });
        console.log(
          `✅ Arcade animations playing (${arcadeGltf.animations.length} found)`
        );
      } else {
        console.log("⚠️ No animations found in arcade model");
      }

      this.addObject(this.arcadeModel, "arcade");

      console.log("✅ Arcade machine loaded (no spotlight - emissive only)");
      console.log("💡 Press [ ] to scale arcade");
      console.log("💡 Press ; ' to rotate arcade");
    } catch (error) {
      console.error("❌ Error loading arcade:", error);
    }

    this.createInfoDisplay();
    console.log("✅ Scene 2 ready!");
    console.log("💡 Press [K] to toggle APOCALYPSE MODE (smooth transition)");
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

  // ✅ NEW: Setup spotlight for arcade machine (wide cone with strong circular ground light!)
  // ✅ Store original colors for materials (no darkening by default)
  setupForestMaterials() {
    if (!this.forestModel) return;

    this.forestModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      // Clone and store original color
      if (!child.material.userData.originalColor) {
        child.material = child.material.clone();
        child.material.userData.originalColor = child.material.color.clone();
      }
    });

    // Apply current brightness
    this.applyForestBrightness(this.materialDarkness);
  }

  // ✅ Apply brightness to forest materials
  applyForestBrightness(brightness) {
    if (!this.forestModel) return;

    this.forestModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const mat = child.material;
      const originalColor = mat.userData.originalColor;

      if (!originalColor) return;

      mat.color.copy(originalColor).multiplyScalar(brightness);

      if ("emissive" in mat) {
        mat.emissive.setRGB(0, 0, 0);
      }

      if ("metalness" in mat) mat.metalness = 0.0;
      if ("roughness" in mat) mat.roughness = 1.0;

      mat.transparent = false;
      mat.opacity = 1.0;
    });
  }

  // ✅ Store normal mode colors
  storeNormalColors() {
    this.normalColors.background = new THREE.Color(
      this.config.background.color
    );
    this.normalColors.fog = new THREE.Color(this.config.lighting.fog.color);
    this.normalColors.ambient.color = new THREE.Color(
      this.config.lighting.ambient.color
    );
    this.normalColors.ambient.intensity =
      this.config.lighting.ambient.intensity;
    this.normalColors.sun.color = new THREE.Color(
      this.config.lighting.sun.color
    );
    this.normalColors.sun.intensity = this.config.lighting.sun.intensity;
    this.normalColors.fill.color = new THREE.Color(
      this.config.lighting.fill.color
    );
    this.normalColors.fill.intensity = this.config.lighting.fill.intensity;
    this.normalColors.fireflies = 0xffffb4; // Warm yellow
    this.normalColors.materialDarkness = 0.6;
  }

  // ✅ Store apocalypse mode colors from config
  storeApocalypseColors() {
    const apoc = this.config.apocalypse;

    this.apocalypseColors.background = new THREE.Color(apoc.background.color);
    this.apocalypseColors.fog = new THREE.Color(apoc.fog.color);
    this.apocalypseColors.ambient.color = new THREE.Color(
      apoc.lighting.ambient.color
    );
    this.apocalypseColors.ambient.intensity = 0.15; // ✅ DARKER for spotlight effect (was 0.4)
    this.apocalypseColors.sun.color = new THREE.Color(apoc.lighting.sun.color);
    this.apocalypseColors.sun.intensity = 0.3; // ✅ DARKER for spotlight effect (was 0.8)
    this.apocalypseColors.fill.color = new THREE.Color(
      apoc.lighting.fill.color
    );
    this.apocalypseColors.fill.intensity = 0.1; // ✅ DARKER for spotlight effect (was 0.3)
    this.apocalypseColors.fireflies = apoc.fireflies.color;
    this.apocalypseColors.materialDarkness = 0.25; // ✅ DARKER forest for spotlight effect (was 0.45)
  }

  // ✅ START SMOOTH TRANSITION
  toggleApocalypseMode() {
    // Prevent spam during transition
    if (this.isTransitioning) {
      console.log("⚠️ Transition already in progress...");
      return;
    }

    this.isApocalypseMode = !this.isApocalypseMode;
    this.isTransitioning = true;
    this.transitionElapsed = 0;

    console.log(
      `🎬 Starting smooth transition to ${
        this.isApocalypseMode ? "✨ GOLDEN APOCALYPSE" : "🌲 NORMAL"
      } mode...`
    );
  }

  // ✅ UPDATE SMOOTH TRANSITION
  updateModeTransition(deltaTime) {
    if (!this.isTransitioning) return;

    this.transitionElapsed += deltaTime;
    const progress = Math.min(
      this.transitionElapsed / this.transitionDuration,
      1
    );

    // Ease in-out for smooth feel
    const easedProgress = this.easeInOutCubic(progress);

    // Determine source and target colors
    const from = this.isApocalypseMode
      ? this.normalColors
      : this.apocalypseColors;
    const to = this.isApocalypseMode
      ? this.apocalypseColors
      : this.normalColors;

    // Lerp background color
    this.scene.background.lerpColors(
      from.background,
      to.background,
      easedProgress
    );

    // Lerp fog color
    if (this.scene.fog) {
      this.scene.fog.color.lerpColors(from.fog, to.fog, easedProgress);
    }

    // Lerp ambient light
    this.ambientLight.color.lerpColors(
      from.ambient.color,
      to.ambient.color,
      easedProgress
    );
    this.ambientLight.intensity = this.lerp(
      from.ambient.intensity,
      to.ambient.intensity,
      easedProgress
    );

    // Lerp sun light
    this.sunLight.color.lerpColors(from.sun.color, to.sun.color, easedProgress);
    this.sunLight.intensity = this.lerp(
      from.sun.intensity,
      to.sun.intensity,
      easedProgress
    );

    // Lerp fill light
    this.fillLight.color.lerpColors(
      from.fill.color,
      to.fill.color,
      easedProgress
    );
    this.fillLight.intensity = this.lerp(
      from.fill.intensity,
      to.fill.intensity,
      easedProgress
    );

    // Lerp fireflies color
    if (this.lightParticles) {
      const fromFirefly = new THREE.Color(from.fireflies);
      const toFirefly = new THREE.Color(to.fireflies);
      const currentFirefly = new THREE.Color().lerpColors(
        fromFirefly,
        toFirefly,
        easedProgress
      );

      // Apply to each firefly
      for (const f of this.lightParticles.fireflies) {
        f.material.color.copy(currentFirefly);
      }
    }

    // Lerp forest brightness
    const currentDarkness = this.lerp(
      from.materialDarkness,
      to.materialDarkness,
      easedProgress
    );
    this.materialDarkness = currentDarkness;
    this.applyForestBrightness(currentDarkness);

    // Transition complete
    if (progress >= 1) {
      this.isTransitioning = false;
      console.log(
        `✅ Transition complete! ${
          this.isApocalypseMode ? "✨ GOLDEN APOCALYPSE" : "🌲 NORMAL"
        } MODE`
      );
      this.updateInfo();
    }
  }

  // ✅ Linear interpolation helper
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ✅ Easing function
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  setupKeyboardControls() {
    this.onKeyPress = (e) => {
      const key = e.key;

      // ✅ SPACE for cinematic
      if (key === " ") {
        if (this.cinematic) {
          this.cinematic.start();
          // Auto-hide info panel during cinematic
          this.hideInfoPanel();
        }
        return;
      }

      // ✅ I key to toggle info panel
      if (key === "i" || key === "I") {
        this.toggleInfoPanel();
        return;
      }

      if (key === "k" || key === "K") {
        this.toggleApocalypseMode(); // ✅ Now with smooth transition
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

      // ✅ Arcade scale controls
      if (key === "[") {
        this.currentScale.arcade -= 0.1;
        this.updateArcadeScale();
      }
      if (key === "]") {
        this.currentScale.arcade += 0.1;
        this.updateArcadeScale();
      }

      // ✅ Arcade rotation controls
      if (key === ";") {
        this.config.rotations.arcade.y -= 0.1;
        this.updateArcadeRotation();
      }
      if (key === "'") {
        this.config.rotations.arcade.y += 0.1;
        this.updateArcadeRotation();
      }

      if (key === "3") {
        this.materialDarkness = Math.max(0, this.materialDarkness - 0.05);
        this.applyForestBrightness(this.materialDarkness);
        this.updateInfo();
      }
      if (key === "4") {
        this.materialDarkness = Math.min(1, this.materialDarkness + 0.05);
        this.applyForestBrightness(this.materialDarkness);
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

  // ✅ NEW: Update arcade scale
  updateArcadeScale() {
    if (this.arcadeModel) {
      this.arcadeModel.scale.set(
        this.currentScale.arcade,
        this.currentScale.arcade,
        this.currentScale.arcade
      );
      console.log(`🎮 Arcade scale: ${this.currentScale.arcade.toFixed(2)}`);
      this.updateInfo();
    }
  }

  // ✅ NEW: Update arcade rotation
  updateArcadeRotation() {
    if (this.arcadeModel) {
      this.arcadeModel.rotation.y = this.config.rotations.arcade.y;
      console.log(
        `🎮 Arcade rotation Y: ${this.config.rotations.arcade.y.toFixed(2)}`
      );
      this.updateInfo();
    }
  }

  // ✅ NEW: Toggle info panel visibility
  toggleInfoPanel() {
    this.infoPanelVisible = !this.infoPanelVisible;

    if (this.infoElement) {
      this.infoElement.style.display = this.infoPanelVisible ? "block" : "none";
    }

    console.log(
      `ℹ️ Info panel: ${this.infoPanelVisible ? "VISIBLE" : "HIDDEN"}`
    );
  }

  // ✅ NEW: Hide info panel (for cinematic)
  hideInfoPanel() {
    this.infoPanelVisible = false;

    if (this.infoElement) {
      this.infoElement.style.display = "none";
    }

    console.log("ℹ️ Info panel auto-hidden (cinematic mode)");
  }

  // ✅ NEW: Show info panel
  showInfoPanel() {
    this.infoPanelVisible = true;

    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    console.log("ℹ️ Info panel shown");
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

    // Change color based on mode
    if (this.isApocalypseMode) {
      this.infoElement.style.borderColor = "#ff0000";
      this.infoElement.style.color = "#ff4444";
    } else {
      this.infoElement.style.borderColor = "#00ff00";
      this.infoElement.style.color = "#00ff00";
    }

    const transitionStatus = this.isTransitioning
      ? `<span style="color: #ffaa00;">⚡ TRANSITIONING...</span>`
      : this.isApocalypseMode
      ? "✨ GOLDEN APOCALYPSE MODE"
      : "🌲 NORMAL MODE";

    this.infoElement.innerHTML = `
      <strong>🌲 SCENE 2 - ${transitionStatus}</strong><br>
      <br>
      <strong>📦 MODEL</strong><br>
      Forest Scale: ${this.currentScale.forest.toFixed(2)}<br>
      Arcade Scale: ${this.currentScale.arcade.toFixed(2)}<br>
      <br>
      <strong>🎨 MATERIAL</strong><br>
      Brightness: ${(this.materialDarkness * 100).toFixed(0)}%<br>
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
      <strong>[SPACE] Cinematic | [I] Toggle Info | [K] Apocalypse | [ ] Arcade Scale</strong>
    `;
  }

  printCurrentConfig() {
    console.log("");
    console.log("========================================");
    console.log("📋 CURRENT CONFIG");
    console.log("========================================");
    console.log("Mode:", this.isApocalypseMode ? "APOCALYPSE" : "NORMAL");
    console.log("Transitioning:", this.isTransitioning);
    console.log("Material brightness:", this.materialDarkness.toFixed(2));
    console.log("Ambient:", this.ambientLight.intensity.toFixed(2));
    console.log("Moonlight:", this.sunLight.intensity.toFixed(2));
    console.log("Fill:", this.fillLight.intensity.toFixed(2));
    if (this.lightParticles) {
      console.log("Particles: enabled");
    }
    console.log("");
    console.log("🎮 ARCADE:");
    console.log("  Position:", this.config.positions.arcade);
    console.log("  Scale:", this.currentScale.arcade.toFixed(2));
    console.log("  Rotation Y:", this.config.rotations.arcade.y.toFixed(2));
    console.log("========================================");
  }

  resetToDefault() {
    this.currentScale.forest = this.config.scale.forest.x;
    this.updateForestScale();

    // Reset to normal mode if in apocalypse
    if (this.isApocalypseMode) {
      this.toggleApocalypseMode();
    }

    // Reset brightness
    this.materialDarkness = 0.6;
    this.applyForestBrightness(this.materialDarkness);

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

    // ✅ ENSURE GHOST IS FULLY VISIBLE when entering scene normally
    if (this.ghostModel) {
      const ghostPos = new THREE.Vector3(
        this.config.ghost.position.x,
        this.config.ghost.position.y,
        this.config.ghost.position.z
      );

      if (this.ghostController) {
        this.ghostController.setSpawnPosition(ghostPos);
      }

      this.ghostModel.rotation.set(
        this.config.ghost.rotation.x,
        this.config.ghost.rotation.y,
        this.config.ghost.rotation.z
      );

      // Make ghost fully visible
      this.ghostModel.visible = true;
      this.ghostModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 1.0; // Fully visible
        }
      });

      // Make lights fully visible
      if (this.ghostSpotlight) {
        this.ghostSpotlight.visible = true;
        this.ghostSpotlight.intensity = 3.0;
      }
      if (this.ghostPointLight) {
        this.ghostPointLight.visible = true;
        this.ghostPointLight.intensity = 2.0;
      }

      // Make rings fully visible
      this.ghostRings.forEach((ring) => {
        ring.visible = true;
        ring.material.opacity = 0.45;
      });

      console.log("👻 Ghost spawned and fully visible!");
    }

    if (this.infoElement) {
      this.infoElement.style.display = "block";
    }

    this.updateInfo();
    console.log("🌲 Scene 2 entered! (BRIGHTER MODE)");
    console.log("💡 Ghost is visible - press [SPACE] to start CINEMATIC");
    console.log(
      "   ⚡ Cinematic will auto-trigger GOLDEN APOCALYPSE mode during run!"
    );
    console.log("💡 Press [I] to toggle info panel (hide/show)");
    console.log(
      "💡 Press [K] to manually toggle GOLDEN APOCALYPSE MODE (smooth transition)"
    );
    console.log("💡 Press [G] to start ghost animation");
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this.isActive) return;

    // ✅ Update smooth mode transition
    this.updateModeTransition(deltaTime);

    if (this.lightParticles) {
      this.lightParticles.update(deltaTime);
    }

    // ✅ Update cinematic first (takes priority over manual camera)
    if (this.cinematic) {
      const wasPlaying = this.cinematic.isPlaying;
      this.cinematic.update(deltaTime);

      // ✅ Auto-show info panel when cinematic ends
      if (wasPlaying && !this.cinematic.isPlaying && !this.infoPanelVisible) {
        this.showInfoPanel();
      }
    }

    // Only update manual camera if cinematic not playing
    if (this.cameraMode && (!this.cinematic || !this.cinematic.isPlaying)) {
      this.cameraMode.update(deltaTime / 1000);
    }

    if (this.ghostMixer) {
      this.ghostMixer.update(deltaTime / 1000);
    }

    // ✅ Update arcade animation
    if (this.arcadeMixer) {
      this.arcadeMixer.update(deltaTime / 1000);
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

    // ✅ Dispose arcade resources
    if (this.arcadeMixer) {
      this.arcadeMixer.stopAllAction();
      this.arcadeMixer = null;
    }

    // Clear arcade material storage
    this.arcadeOriginalMaterials = [];

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
