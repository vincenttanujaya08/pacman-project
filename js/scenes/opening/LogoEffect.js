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
    this.isEaten = false;
    this.fadeInComplete = false;

    // Timing
    this.fadeInDuration = 2000; // 2 seconds to fade in
    this.fadeInElapsed = 0;
    this.eatDistance = 5; // Distance at which Pacman "eats" logo
  }

  async init() {
    // Create logo plane with Pac-Man texture
    const geometry = new THREE.PlaneGeometry(15, 15); // Large billboard

    // Create canvas texture for Pac-Man logo
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Draw classic Pac-Man logo
    this.drawPacmanLogo(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

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

    // Rotate to face camera
    this.logoMesh.rotation.y = 0;

    this.scene.add(this.logoMesh);

    console.log("✅ Logo effect created");
  }

  drawPacmanLogo(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.4;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw yellow Pac-Man circle
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();

    // Draw eye
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius * 0.3, radius * 0.1, 0, 2 * Math.PI);
    ctx.fill();

    // Add "PAC-MAN 45th" text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAC-MAN", centerX, centerY + radius + 60);

    ctx.font = "bold 36px Arial";
    ctx.fillText("45th Anniversary", centerX, centerY + radius + 100);
  }

  update(deltaTime, pacmanPosition) {
    if (!this.logoMesh || this.isEaten) return;

    // Phase 1: Fade in gradually
    if (!this.fadeInComplete) {
      this.fadeInElapsed += deltaTime;
      const progress = Math.min(this.fadeInElapsed / this.fadeInDuration, 1);

      // Ease in
      this.opacity = this.easeInOutCubic(progress);
      this.logoMesh.material.opacity = this.opacity;

      if (progress >= 1) {
        this.fadeInComplete = true;
        console.log("✅ Logo fade in complete");
      }

      return;
    }

    // Phase 2: Check collision with Pacman
    if (pacmanPosition) {
      const distance = this.logoMesh.position.distanceTo(pacmanPosition);

      // Pacman is approaching - start fading out
      if (distance < this.eatDistance) {
        // Fade out based on distance (closer = more transparent)
        const fadeProgress = 1 - distance / this.eatDistance;
        this.opacity = 1 - fadeProgress;
        this.logoMesh.material.opacity = this.opacity;

        // Shrink logo as it's eaten
        const scale = 1 - fadeProgress * 0.5;
        this.logoMesh.scale.set(scale, scale, scale);

        // Mark as eaten when fully transparent
        if (this.opacity <= 0.01) {
          this.isEaten = true;
          this.logoMesh.visible = false;
          console.log("🍴 Logo eaten by Pacman!");
        }
      }
    }

    // Rotate logo slowly for visual interest
    if (!this.isEaten) {
      this.logoMesh.rotation.y += 0.001;
    }
  }

  reset() {
    this.opacity = 0;
    this.isEaten = false;
    this.fadeInComplete = false;
    this.fadeInElapsed = 0;

    if (this.logoMesh) {
      this.logoMesh.visible = true;
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
