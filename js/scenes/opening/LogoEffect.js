// js/scenes/opening/LogoEffect.js
// Animated Pac-Man logo that fades in and gets "eaten" by Pacman

export default class LogoEffect {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    // Logo mesh
    this.logoMesh = null;

    // Animation state
    this.opacity = 0;
    this.fadeInComplete = false;
    this.isVisible = false; // ✅ Logo starts hidden until animation ends

    // Timing
    this.fadeInDuration = 2000; // 2 seconds to fade in
    this.fadeInElapsed = 0;
    // eatDistance removed - no longer needed for collision
  }

  async init() {
    // ✅ Load logo image texture from uploaded file
    const textureLoader = new THREE.TextureLoader();

    return new Promise((resolve, reject) => {
      textureLoader.load(
        "assets/images/logo.png", // ✅ Path to your uploaded logo
        (texture) => {
          // ✅ FIX COLOR: Set texture encoding to preserve original colors
          texture.encoding = THREE.sRGBEncoding;

          // Create logo plane with loaded texture
          const geometry = new THREE.PlaneGeometry(35, 10); // ✅ Wider logo (20 width, 5 height)

          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0, // Start invisible
            side: THREE.DoubleSide,
            depthWrite: false, // Prevent z-fighting
          });

          this.logoMesh = new THREE.Mesh(geometry, material);

          // Position in center of path (where Pacman will pass)
          this.logoMesh.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
          );

          // ✅ Initially hidden (will show when animation starts)
          this.logoMesh.visible = false;

          // ✅ STATIC: No rotation, face camera directly
          this.logoMesh.rotation.y = Math.PI;

          this.scene.add(this.logoMesh);

          console.log("✅ Logo effect created with uploaded image");
          resolve();
        },
        undefined,
        (error) => {
          console.error("❌ Error loading logo image:", error);
          console.log("💡 Make sure logo.png is in assets/images/ folder");
          reject(error);
        }
      );
    });
  }

  // ✅ Show logo when animation starts
  show() {
    if (this.logoMesh) {
      this.logoMesh.visible = true;
      this.isVisible = true;
      this.fadeInElapsed = 0;
      this.fadeInComplete = false;
      console.log("✅ Logo animation started");
    }
  }

  // ✅ Hide logo
  hide() {
    if (this.logoMesh) {
      this.logoMesh.visible = false;
      this.isVisible = false;
    }
  }

  update(deltaTime, pacmanPosition) {
    if (!this.logoMesh || !this.isVisible) return;

    // Phase 1: Fade in gradually
    if (!this.fadeInComplete) {
      this.fadeInElapsed += deltaTime;
      const progress = Math.min(this.fadeInElapsed / this.fadeInDuration, 1);

      // Ease in
      this.opacity = this.easeInOutCubic(progress);
      this.logoMesh.material.opacity = this.opacity;

      if (progress >= 1) {
        this.fadeInComplete = true;
        console.log("✅ Logo fade in complete - Celebration!");
      }

      return;
    }

    // ✅ Logo stays visible as celebration (no collision, no eating)
    // Logo just fades in and stays there
  }

  reset() {
    this.opacity = 0;
    this.fadeInComplete = false;
    this.fadeInElapsed = 0;
    this.isVisible = false; // ✅ Hide on reset

    if (this.logoMesh) {
      this.logoMesh.visible = false; // ✅ Hidden until show() is called
      this.logoMesh.material.opacity = 0;
      this.logoMesh.scale.set(1, 1, 1);
    }

    console.log("🔄 Logo reset");
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  dispose() {
    if (this.logoMesh) {
      this.scene.remove(this.logoMesh);
      this.logoMesh.geometry.dispose();
      this.logoMesh.material.map.dispose();
      this.logoMesh.material.dispose();
      this.logoMesh = null;
    }
  }
}
