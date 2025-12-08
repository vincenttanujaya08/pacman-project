// js/scenes/opening/LogoEffect.js
// Animated Pac-Man logo that fades in and gets sucked by black hole

export default class LogoEffect {
  constructor(scene, config, camera, cameraController) {
    this.scene = scene;
    this.config = config;
    this.camera = camera;
    this.cameraController = cameraController;

    // Logo mesh
    this.logoMesh = null;

    // Black hole
    this.blackHole = null;
    this.blackHoleMixer = null;

    // Animation state
    this.opacity = 0;
    this.fadeInComplete = false;
    this.isVisible = false;

    // Black hole state
    this.blackHoleVisible = false;
    this.blackHoleOpacity = 0;
    this.blackHoleFadeDuration = 1000; // 1 second fade in
    this.blackHoleFadeElapsed = 0;

    // Sucking state
    this.isSucking = false;
    this.suckDuration = 2000; // 2 seconds
    this.suckElapsed = 0;
    this.initialScale = 1;

    // Camera zoom state
    this.isZooming = false;
    this.zoomComplete = false;

    // Timing
    this.fadeInDuration = 2000; // 2 seconds to fade in
    this.fadeInElapsed = 0;
  }

  async init() {
    // Load logo texture
    const textureLoader = new THREE.TextureLoader();

    return new Promise((resolve, reject) => {
      textureLoader.load(
        "assets/images/logo.png",
        (texture) => {
          texture.encoding = THREE.sRGBEncoding;

          // Create logo plane
          const geometry = new THREE.PlaneGeometry(35, 10);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
          });

          this.logoMesh = new THREE.Mesh(geometry, material);
          this.logoMesh.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
          );
          this.logoMesh.visible = false;
          this.logoMesh.rotation.y = Math.PI;

          // ✅ FORCE logo to render in FRONT of black hole
          this.logoMesh.renderOrder = 999; // Render last = always on top
          this.logoMesh.material.depthTest = false; // Ignore depth

          this.scene.add(this.logoMesh);

          // Load black hole model
          this.loadBlackHole()
            .then(() => {
              console.log("✅ Logo & Black hole loaded");
              resolve();
            })
            .catch(reject);
        },
        undefined,
        (error) => {
          console.error("❌ Error loading logo image:", error);
          reject(error);
        }
      );
    });
  }

  async loadBlackHole() {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(
        "assets/models/blackhole.glb",
        (gltf) => {
          this.blackHole = gltf.scene;

          // Position behind logo (same x,y but z further back)
          this.blackHole.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z - 5 // 5 units behind logo
          );

          // Scale - adjust as needed
          this.blackHole.scale.set(7, 7, 7);

          // ✅ Rotate Z axis (tilt downward slightly)
          this.blackHole.rotation.z = 0.6; // ~11 degrees tilt
          this.blackHole.rotation.y = -Math.PI / 2;

          // Initially invisible
          this.blackHole.visible = false;

          // Setup animation if available
          if (gltf.animations && gltf.animations.length > 0) {
            this.blackHoleMixer = new THREE.AnimationMixer(this.blackHole);
            const action = this.blackHoleMixer.clipAction(gltf.animations[0]);
            action.play();
            console.log("✅ Black hole animation playing");
          }

          // Set all materials to transparent for fade effect
          this.blackHole.traverse((child) => {
            if (child.isMesh) {
              child.material.transparent = true;
              child.material.opacity = 0;
              child.renderOrder = 1; // ✅ Render first = behind logo
            }
          });

          this.scene.add(this.blackHole);
          console.log("✅ Black hole model loaded");
          resolve();
        },
        undefined,
        (error) => {
          console.error("❌ Error loading black hole:", error);
          reject(error);
        }
      );
    });
  }

  show() {
    if (this.logoMesh) {
      this.logoMesh.visible = true;
      this.isVisible = true;
      this.fadeInElapsed = 0;
      this.fadeInComplete = false;
      console.log("✅ Logo animation started");
    }
  }

  hide() {
    if (this.logoMesh) {
      this.logoMesh.visible = false;
      this.isVisible = false;
    }
    if (this.blackHole) {
      this.blackHole.visible = false;
      this.blackHoleVisible = false;
    }
  }

  update(deltaTime) {
    if (!this.logoMesh || !this.isVisible) return;

    // Update black hole animation
    if (this.blackHoleMixer) {
      this.blackHoleMixer.update(deltaTime / 1000);
    }

    // Phase 1: Logo fade in
    if (!this.fadeInComplete) {
      this.fadeInElapsed += deltaTime;
      const progress = Math.min(this.fadeInElapsed / this.fadeInDuration, 1);

      this.opacity = this.easeInOutCubic(progress);
      this.logoMesh.material.opacity = this.opacity;

      if (progress >= 1) {
        this.fadeInComplete = true;
        console.log("✅ Logo fade in complete!");

        // Start showing black hole
        if (this.blackHole) {
          this.blackHole.visible = true;
          this.blackHoleVisible = true;
          console.log("✅ Black hole appearing...");
        }
      }

      return;
    }

    // Phase 2: Black hole fade in
    if (this.blackHoleVisible && !this.isSucking) {
      this.blackHoleFadeElapsed += deltaTime;
      const progress = Math.min(
        this.blackHoleFadeElapsed / this.blackHoleFadeDuration,
        1
      );

      this.blackHoleOpacity = this.easeInOutCubic(progress);

      // Apply opacity to all black hole materials
      if (this.blackHole) {
        this.blackHole.traverse((child) => {
          if (child.isMesh) {
            child.material.opacity = this.blackHoleOpacity;
          }
        });
      }

      if (progress >= 1) {
        console.log("✅ Black hole visible! Starting sucking animation...");
        this.isSucking = true;
        this.suckElapsed = 0;
      }

      return;
    }

    // Phase 3: Logo gets sucked into black hole
    if (this.isSucking && !this.isZooming) {
      this.suckElapsed += deltaTime;
      const progress = Math.min(this.suckElapsed / this.suckDuration, 1);
      const easedProgress = this.easeInCubic(progress);

      // Scale down to 0 (sucked to center point)
      const scale = 1 - easedProgress;
      this.logoMesh.scale.set(scale, scale, scale);

      // Optional: Move slightly towards black hole center
      const targetZ = this.config.position.z - 5;
      this.logoMesh.position.z =
        this.config.position.z +
        (targetZ - this.config.position.z) * easedProgress * 0.3;

      if (progress >= 1) {
        console.log("✅ Logo sucked! Starting camera zoom...");
        this.logoMesh.visible = false; // Hide completely
        this.isZooming = true;
        this.startCameraZoom();
      }

      return;
    }

    // Phase 4: Camera zoom handled by camera controller
    // Zoom completion will be checked in OpeningScene
  }

  startCameraZoom() {
    if (!this.camera || !this.cameraController || !this.blackHole) return;

    const blackHolePos = this.blackHole.position;

    // Zoom to black hole position (very close)
    this.cameraController.moveTo(
      new THREE.Vector3(blackHolePos.x, blackHolePos.y, blackHolePos.z + 0), // Close to black hole
      blackHolePos,
      3000, // 3 seconds zoom
      this.cameraController.easeInCubic,
      () => {
        console.log("✅ Camera zoom complete! Starting white fade...");
        this.startWhiteFade(); // ⭐ TAMBAH INI
      }
    );
  }

  // ⭐ TAMBAH FUNCTION BARU INI (dibawah startCameraZoom)
  startWhiteFade() {
    const overlay = document.createElement("div");
    overlay.id = "white-fade";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "white";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 2000ms ease"; // 2 detik fade
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "999";

    document.body.appendChild(overlay);

    // Trigger fade
    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);

    // Mark zoom complete after fade
    setTimeout(() => {
      this.zoomComplete = true;
      console.log("✅ White fade complete! Ready for next scene.");
    }, 2100); // 2.1 detik (sedikit lebih lama dari fade)
  }

  reset() {
    this.opacity = 0;
    this.fadeInComplete = false;
    this.fadeInElapsed = 0;
    this.isVisible = false;

    this.blackHoleVisible = false;
    this.blackHoleOpacity = 0;
    this.blackHoleFadeElapsed = 0;

    this.isSucking = false;
    this.suckElapsed = 0;

    this.isZooming = false;
    this.zoomComplete = false;

    if (this.logoMesh) {
      this.logoMesh.visible = false;
      this.logoMesh.material.opacity = 0;
      this.logoMesh.scale.set(1, 1, 1);
      this.logoMesh.position.z = this.config.position.z;
    }

    if (this.blackHole) {
      this.blackHole.visible = false;
      this.blackHole.traverse((child) => {
        if (child.isMesh) {
          child.material.opacity = 0;
        }
      });
    }

    // ⭐ TAMBAH INI - Remove white fade overlay
    const overlay = document.getElementById("white-fade");
    if (overlay) {
      overlay.remove();
    }

    console.log("🔄 Logo & Black hole reset");
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeInCubic(t) {
    return t * t * t;
  }

  dispose() {
    if (this.logoMesh) {
      this.scene.remove(this.logoMesh);
      this.logoMesh.geometry.dispose();
      this.logoMesh.material.map.dispose();
      this.logoMesh.material.dispose();
      this.logoMesh = null;
    }

    if (this.blackHole) {
      this.blackHole.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this.blackHole);
      this.blackHole = null;
    }

    if (this.blackHoleMixer) {
      this.blackHoleMixer.stopAllAction();
      this.blackHoleMixer = null;
    }
  }
  // ⭐ TAMBAH INI - Remove white fade overlay
  overlay = document.getElementById("white-fade");
  if(overlay) {
    overlay.remove();
  }
}
