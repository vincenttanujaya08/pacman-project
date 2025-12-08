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
  }

  // ========== SETUP ==========

  setupDOM() {
    this.canvasContainer = document.getElementById("canvas-container");
    this.loadingScreen = document.getElementById("loading");
    this.toggleModeBtn = document.getElementById("toggleMode");
    this.freeInstructions = document.getElementById("freeInstructions");
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

    // Window resize
    window.addEventListener("resize", () => {
      this.onWindowResize();
    });

    console.log("UI setup complete");
  }

  // ========== SCENE LOADING ==========

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

    this.updateLoadingProgress(50, "Loading scene 2...");

    // ✅ Load Scene 2 (Ghosts/next scene)
    // TODO: Ganti dengan scene 2 kamu yang sebenarnya
    // Untuk sementara pakai TestScene dulu
    // Load Scene 2 module (replace with your actual scene file)
    const Scene2 = await import("./scenes/scene2/scene2.js").then(
      (m) => m.default
    );
    const scene2 = new Scene2("ghosts", this.renderer, this.camera);
    await this.sceneManager.addScene("ghosts", scene2);

    this.updateLoadingProgress(100, "Ready!");

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
    this.cameraController.update(clampedDelta);

    // Update scene manager
    this.sceneManager.update(clampedDelta);

    // ✅ Update position display
    this.updatePositionDisplay();

    // Render
    this.sceneManager.render();
  }

  updatePositionDisplay() {
    const pos = this.camera.position;

    const posXElem = document.getElementById("posX");
    const posYElem = document.getElementById("posY");
    const posZElem = document.getElementById("posZ");

    if (posXElem) posXElem.textContent = pos.x.toFixed(2);
    if (posYElem) posYElem.textContent = pos.y.toFixed(2);
    if (posZElem) posZElem.textContent = pos.z.toFixed(2);
  }

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
