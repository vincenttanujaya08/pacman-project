// js/SceneManager.js
// Manages multiple scenes and transitions between them

export default class SceneManager {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;

    this.scenes = new Map(); // Map of scene name -> scene object
    this.currentScene = null;
    this.currentSceneName = null;

    this.isTransitioning = false;
    this.transitionDuration = 1000; // ms

    // Callbacks
    this.onSceneChange = null;
  }

  // ========== SCENE MANAGEMENT ==========

  async addScene(name, sceneInstance) {
    this.scenes.set(name, sceneInstance);

    // Initialize scene
    console.log(`Initializing scene: ${name}`);
    await sceneInstance.init();
    console.log(`Scene initialized: ${name}`);
  }

  removeScene(name) {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.dispose();
      this.scenes.delete(name);
    }
  }

  getScene(name) {
    return this.scenes.get(name);
  }

  // ========== SCENE SWITCHING ==========

  async switchTo(sceneName, transition = "fade") {
    if (this.isTransitioning) {
      console.warn("Already transitioning, please wait");
      return;
    }

    const nextScene = this.scenes.get(sceneName);
    if (!nextScene) {
      console.error(`Scene "${sceneName}" not found`);
      return;
    }

    if (this.currentSceneName === sceneName) {
      console.log(`Already in scene: ${sceneName}`);
      return;
    }

    this.isTransitioning = true;

    // Exit current scene
    if (this.currentScene) {
      console.log(`Exiting scene: ${this.currentSceneName}`);
      await this.transitionOut(transition);
      this.currentScene.exit();
    }

    // Switch to new scene
    this.currentScene = nextScene;
    this.currentSceneName = sceneName;

    console.log(`Entering scene: ${sceneName}`);
    this.currentScene.enter();

    // Transition in
    await this.transitionIn(transition);

    this.isTransitioning = false;

    // Callback
    if (this.onSceneChange) {
      this.onSceneChange(sceneName);
    }
  }

  // ========== TRANSITIONS ==========

  async transitionOut(type = "fade") {
    return new Promise((resolve) => {
      if (type === "fade") {
        this.fadeOut(this.transitionDuration / 2, resolve);
      } else if (type === "instant") {
        resolve();
      }
    });
  }

  async transitionIn(type = "fade") {
    return new Promise((resolve) => {
      if (type === "fade") {
        this.fadeIn(this.transitionDuration / 2, resolve);
      } else if (type === "instant") {
        resolve();
      }
    });
  }

  fadeOut(duration, callback) {
    // Create black overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "0";
    overlay.style.transition = `opacity ${duration}ms ease`;
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "500";
    overlay.id = "scene-transition";

    document.body.appendChild(overlay);

    // Trigger fade
    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      callback();
    }, duration);
  }

  fadeIn(duration, callback) {
    const overlay = document.getElementById("scene-transition");
    if (!overlay) {
      callback();
      return;
    }

    overlay.style.transition = `opacity ${duration}ms ease`;
    overlay.style.opacity = "0";

    setTimeout(() => {
      overlay.remove();
      callback();
    }, duration);
  }

  // ========== UPDATE & RENDER ==========

  update(deltaTime) {
    if (this.currentScene && !this.isTransitioning) {
      this.currentScene.update(deltaTime);
    }
  }

  render() {
    if (this.currentScene) {
      this.renderer.render(this.currentScene.scene, this.camera);
    }
  }

  // ========== UTILITIES ==========

  getCurrentSceneName() {
    return this.currentSceneName;
  }

  getCurrentScene() {
    return this.currentScene;
  }

  // ========== CLEANUP ==========

  dispose() {
    // Dispose all scenes
    this.scenes.forEach((scene, name) => {
      console.log(`Disposing scene: ${name}`);
      scene.dispose();
    });

    this.scenes.clear();
    this.currentScene = null;
    this.currentSceneName = null;
  }
}
