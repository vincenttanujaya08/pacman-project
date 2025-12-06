// js/scenes/BaseScene.js
// Base class for all scenes - provides common functionality

export default class BaseScene {
  constructor(name, renderer, camera) {
    this.name = name;
    this.renderer = renderer;
    this.camera = camera;

    // Three.js scene
    this.scene = new THREE.Scene();

    // State
    this.isActive = false;
    this.isInitialized = false;

    // Lighting (default)
    this.lights = [];

    // Objects in scene
    this.objects = [];

    // Animations
    this.animations = [];

    // Config (override in child classes)
    this.config = {};
  }

  // ========== LIFECYCLE METHODS (Override in child classes) ==========

  /**
   * Initialize scene - load models, setup lights, etc.
   * Called once when scene is added to SceneManager
   */
  async init() {
    console.log(`[${this.name}] Initializing...`);

    // Setup default lighting
    this.setupDefaultLighting();

    this.isInitialized = true;
    console.log(`[${this.name}] Initialized`);
  }

  /**
   * Called when scene becomes active
   */
  enter() {
    console.log(`[${this.name}] Entering...`);
    this.isActive = true;

    // Start animations if any
    this.startAnimations();
  }

  /**
   * Called every frame when scene is active
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.isActive) return;

    // Update animations
    this.updateAnimations(deltaTime);
  }

  /**
   * Called when scene becomes inactive
   */
  exit() {
    console.log(`[${this.name}] Exiting...`);
    this.isActive = false;

    // Stop animations
    this.stopAnimations();
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    console.log(`[${this.name}] Disposing...`);

    // Dispose all objects
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(object.material);
        }
      }
    });

    // Remove all children
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    this.objects = [];
    this.lights = [];
    this.animations = [];

    console.log(`[${this.name}] Disposed`);
  }

  // ========== HELPER METHODS ==========

  setupDefaultLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 5);
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  disposeMaterial(material) {
    if (material.map) material.map.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.envMap) material.envMap.dispose();
    material.dispose();
  }

  addObject(object, name = null) {
    this.scene.add(object);
    this.objects.push({ object, name });
    return object;
  }

  removeObject(object) {
    this.scene.remove(object);
    this.objects = this.objects.filter((item) => item.object !== object);
  }

  getObject(name) {
    const item = this.objects.find((item) => item.name === name);
    return item ? item.object : null;
  }

  // ========== ANIMATION METHODS ==========

  addAnimation(animation) {
    this.animations.push(animation);
  }

  startAnimations() {
    // Override in child class if needed
  }

  stopAnimations() {
    // Override in child class if needed
  }

  updateAnimations(deltaTime) {
    // Override in child class to update animations
  }

  // ========== UTILITIES ==========

  /**
   * Wait for specified duration
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Load GLTF model
   * @param {string} path - Path to GLTF file
   */
  async loadModel(path) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(
        path,
        (gltf) => {
          console.log(`[${this.name}] Model loaded:`, path);
          resolve(gltf);
        },
        (progress) => {
          // Progress callback
          const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
          console.log(`[${this.name}] Loading ${path}: ${percent}%`);
        },
        (error) => {
          console.error(`[${this.name}] Error loading model:`, path, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Create text sprite (for labels, UI, etc.)
   */
  createTextSprite(text, options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const fontSize = options.fontSize || 48;
    const fontFamily = options.fontFamily || "Arial";
    const textColor = options.textColor || "#FFFFFF";
    const backgroundColor = options.backgroundColor || "transparent";

    // Set canvas size
    canvas.width = 512;
    canvas.height = 128;

    // Draw background
    if (backgroundColor !== "transparent") {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw text
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);

    // Create sprite
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    return sprite;
  }
}
