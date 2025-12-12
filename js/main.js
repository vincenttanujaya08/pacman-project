// js/main.js
// Entry point - orchestrates the entire application

import CameraController from "./CameraController.js";
import SceneManager from "./SceneManager.js";

class App {
  constructor() {
    // Three.js core
    this.renderer = null;
    this.camera = null;
    this.clock = new THREE.Clock();

    // Controllers
    this.cameraController = null;
    this.sceneManager = null;

    // State
    this.isRunning = false;
    this.currentMode = "free"; // ✅ Always free mode

    // DOM elements
    this.canvasContainer = null;
    this.loadingScreen = null;
    this.toggleModeBtn = null;
    this.freeInstructions = null;
    this.sceneNav = null; // ✅ NEW: Scene navigation container

    this.init();
  }

  async init() {
    console.log("Initializing Pac-Man 45th Anniversary...");

    // Setup DOM references
    this.setupDOM();

    // Setup Three.js
    this.setupRenderer();
    this.setupCamera();

    // Setup controllers
    this.setupCameraController();
    this.setupSceneManager();

    // Setup UI
    this.setupUI();

    // Load scenes
    await this.loadScenes();

    // Hide loading screen
    this.hideLoadingScreen();

    // Start
    this.start();

    console.log("Initialization complete!");
    console.log("💡 Press H to toggle scene navigation menu");
  }

  // ========== SETUP ==========

  setupDOM() {
    this.canvasContainer = document.getElementById("canvas-container");
    this.loadingScreen = document.getElementById("loading");
    this.toggleModeBtn = document.getElementById("toggleMode");
    this.freeInstructions = document.getElementById("freeInstructions");
    this.sceneNav = document.querySelector(".scene-nav"); // ✅ NEW
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.canvasContainer.appendChild(this.renderer.domElement);

    console.log("Renderer setup complete");
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    console.log("Camera setup complete");
  }

  setupCameraController() {
    this.cameraController = new CameraController(
      this.camera,
      this.renderer.domElement
    );

    // ✅ Always start in FREE mode
    this.cameraController.setMode("free");

    console.log("Camera controller setup complete (FREE MODE)");
  }

  setupSceneManager() {
    this.sceneManager = new SceneManager(this.renderer, this.camera);

    // Callback when scene changes
    this.sceneManager.onSceneChange = (sceneName) => {
      console.log(`Scene changed to: ${sceneName}`);
      this.updateSceneButtons(sceneName);
    };

    console.log("Scene manager setup complete");
  }

  setupUI() {
    // Mode toggle button
    this.toggleModeBtn.addEventListener("click", () => {
      this.toggleMode();
    });

    // Scene navigation buttons
    const sceneButtons = document.querySelectorAll(".btn-scene");
    sceneButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const sceneName = btn.dataset.scene;
        this.sceneManager.switchTo(sceneName);
      });
    });

    // ✅ NEW: Toggle scene navigation with H key
    document.addEventListener("keydown", (e) => {
      if (e.key === "h" || e.key === "H") {
        this.toggleSceneNav();
      }
    });

    // Window resize
    window.addEventListener("resize", () => {
      this.onWindowResize();
    });

    console.log("UI setup complete");
  }

  // ✅ NEW: Toggle scene navigation visibility
  toggleSceneNav() {
    if (!this.sceneNav) return;

    this.sceneNav.classList.toggle("visible");

    if (this.sceneNav.classList.contains("visible")) {
      console.log("✅ Scene navigation menu shown");
    } else {
      console.log("❌ Scene navigation menu hidden");
    }
  }

  // ========== SCENE LOADING ==========

  // js/main.js
  // ✅ UPDATE: Add Scene3 loading

  // ... existing code ...

  async loadScenes() {
    console.log("Loading scenes...");

    this.updateLoadingProgress(0, "Loading scenes...");

    // Load Opening Scene
    const OpeningScene = await import("./scenes/opening/OpeningScene.js").then(
      (m) => m.default
    );
    const openingScene = new OpeningScene(
      "opening",
      this.renderer,
      this.camera
    );
    await this.sceneManager.addScene("opening", openingScene);

    this.updateLoadingProgress(33, "Loading scene 2...");

    // Load Scene 2
    const Scene2 = await import("./scenes/scene2/scene2.js").then(
      (m) => m.default
    );
    const scene2 = new Scene2("scene2", this.renderer, this.camera);
    await this.sceneManager.addScene("scene2", scene2);

    this.updateLoadingProgress(66, "Loading scene 3...");

    // ✅ Load Scene 3
    const Scene3 = await import("./scenes/scene3/Scene3.js").then(
      (m) => m.default
    );
    const scene3 = new Scene3("scene3", this.renderer, this.camera);
    await this.sceneManager.addScene("scene3", scene3);

    this.updateLoadingProgress(80, "Loading scene 4...");

    // Load Scene 4
    const Scene4 = await import("./scenes/scene4/Scene4.js").then(
      (m) => m.default
    );
    const scene4 = new Scene4("scene4", this.renderer, this.camera);
    await this.sceneManager.addScene("scene4", scene4);

    this.updateLoadingProgress(100, "Ready!");
    console.log("All scenes loaded successfully!");

    // Start with opening scene
    await this.sceneManager.switchTo("opening", "instant");
  }

  updateLoadingProgress(percent, text) {
    const progressFill = document.getElementById("progressFill");
    const loadingText = document.getElementById("loadingText");

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (loadingText && text) {
      loadingText.textContent = text;
    }
  }

  hideLoadingScreen() {
    setTimeout(() => {
      this.loadingScreen.classList.add("hidden");
    }, 500);
  }

  // ========== MODE SWITCHING ==========

  toggleMode() {
    if (this.currentMode === "cinematic") {
      this.currentMode = "free";
      this.cameraController.setMode("free");
      this.toggleModeBtn.querySelector("#modeText").textContent =
        "Switch to Cinematic Mode";
      this.freeInstructions.classList.remove("hidden");
    } else {
      this.currentMode = "cinematic";
      this.cameraController.setMode("cinematic");
      this.toggleModeBtn.querySelector("#modeText").textContent =
        "Switch to Free Mode";
      this.freeInstructions.classList.add("hidden");
    }

    console.log(`Mode switched to: ${this.currentMode}`);
  }

  // ========== UI UPDATES ==========

  updateSceneButtons(activeSceneName) {
    const sceneButtons = document.querySelectorAll(".btn-scene");
    sceneButtons.forEach((btn) => {
      if (btn.dataset.scene === activeSceneName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ========== ANIMATION LOOP ==========

  start() {
    this.isRunning = true;
    this.animate();
    console.log("Animation loop started");
  }

  stop() {
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta() * 1000; // Convert to milliseconds

    // ✅ FIX: Clamp deltaTime to prevent huge jumps when tab is inactive
    const clampedDelta = Math.min(deltaTime, 100); // Max 100ms per frame

    // Update camera controller
    const currentScene = this.sceneManager.getCurrentScene();
    this.cameraController.update(clampedDelta);

    // Update scene manager
    this.sceneManager.update(clampedDelta);

    // ✅ Update position display (with rotation)
    this.updatePositionDisplay();

    // Render
    this.sceneManager.render();
  }

  // js/main.js - updatePositionDisplay()

  // js/main.js
  // ✅ UPDATE: Fix updatePositionDisplay for Scene3

  // ... existing code ...

  updatePositionDisplay() {
    const pos = this.camera.position;

    const posXElem = document.getElementById("posX");
    const posYElem = document.getElementById("posY");
    const posZElem = document.getElementById("posZ");

    if (posXElem) posXElem.textContent = pos.x.toFixed(2);
    if (posYElem) posYElem.textContent = pos.y.toFixed(2);
    if (posZElem) posZElem.textContent = pos.z.toFixed(2);

    // ✅ Show yaw & pitch rotation
    const rotYawElem = document.getElementById("rotYaw");
    const rotPitchElem = document.getElementById("rotPitch");

    if (rotYawElem && rotPitchElem) {
      // Get current scene
      const currentScene = this.sceneManager.getCurrentScene();

      // If in Scene 2 and has cameraMode, show FPS rotation
      if (
        currentScene &&
        currentScene.name === "scene2" &&
        currentScene.cameraMode
      ) {
        const cameraMode = currentScene.cameraMode;
        rotYawElem.textContent = cameraMode.fps.yaw.toFixed(3);
        rotPitchElem.textContent = cameraMode.fps.pitch.toFixed(3);
      }
      // ✅ If in Scene 3 with debug FPS mode, show rotation
      else if (
        currentScene &&
        currentScene.name === "scene3" &&
        currentScene.debugFPSMode
      ) {
        rotYawElem.textContent = currentScene.yaw.toFixed(3);
        rotPitchElem.textContent = currentScene.pitch.toFixed(3);
      } else {
        rotYawElem.textContent = "-";
        rotPitchElem.textContent = "-";
      }
    }
  }

  // ... rest of existing code ...

  // ========== CLEANUP ==========

  dispose() {
    this.stop();

    if (this.cameraController) {
      this.cameraController.dispose();
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
