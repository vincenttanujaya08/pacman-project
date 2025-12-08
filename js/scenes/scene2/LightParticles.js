// Fireflies with mixed solid + glow types, independent twinkle + drifting
// ✅ WITH COLOR CHANGE SUPPORT for apocalypse mode

export default class LightParticles {
  constructor(scene, camera, config) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    this.fireflies = [];
    this.time = 0;
  }

  // GLOW texture (soft)
  createGlowTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.1,
      size / 2,
      size / 2,
      size * 0.5
    );

    gradient.addColorStop(0, "rgba(255,255,180,1)");
    gradient.addColorStop(0.2, "rgba(255,255,180,0.5)");
    gradient.addColorStop(1, "rgba(255,255,180,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // SOLID texture (hard circle)
  createSolidTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // Natural spherical distribution (AAA style)
  randomPosition() {
    const radius = this.config.radius || 120;

    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const r = radius * (0.65 + Math.random() * 0.35);

    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.cos(phi);
    let z = r * Math.sin(phi) * Math.sin(theta);

    // Keep fireflies floating mid-air
    y = Math.abs(y) * 0.6 + radius * 0.15;

    return { x, y, z };
  }

  init() {
    const count = this.config.particleCount || 300;
    const size = this.config.size || 12;

    const glowTex = this.createGlowTexture();
    const solidTex = this.createSolidTexture();

    const glowRatio = 0.3; // 30% glow, 70% solid

    for (let i = 0; i < count; i++) {
      const isGlow = Math.random() < glowRatio;

      const spriteMaterial = new THREE.SpriteMaterial({
        map: isGlow ? glowTex : solidTex,
        color: 0xffffb4, // Default: warm white/yellow
        transparent: isGlow ? true : false,
        opacity: 1.0,
        depthWrite: !isGlow,
        blending: isGlow ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      const sprite = new THREE.Sprite(spriteMaterial);

      sprite.userData.base = this.randomPosition();

      // Twinkle properties (solid twinkles less)
      sprite.userData.twinkle = {
        speed: Math.random() * 2 + 0.5,
        phase: Math.random() * Math.PI * 2,
        min: isGlow ? 0.15 : 0.6,
        max: 1.0,
      };

      // Drift randomness
      sprite.userData.drift = Math.random() * 500;

      sprite.scale.set(
        isGlow ? size * 1.3 : size,
        isGlow ? size * 1.3 : size,
        1
      );

      sprite.userData.type = isGlow ? "glow" : "solid";

      this.scene.add(sprite);
      this.fireflies.push(sprite);
    }

    console.log("✨ LightParticles initialized (Mixed Glow + Solid)");
  }

  // ✅ NEW: Change color of all fireflies (for apocalypse mode)
  setColor(hexColor) {
    for (const f of this.fireflies) {
      f.material.color.setHex(hexColor);
    }
    console.log(`✨ Fireflies color changed to: #${hexColor.toString(16)}`);
  }

  update(deltaTime) {
    this.time += deltaTime * 0.001;
    const cam = this.camera.position;

    for (const f of this.fireflies) {
      const base = f.userData.base;
      const t = this.time + f.userData.drift;

      // Smooth drifting
      f.position.set(
        cam.x + base.x + Math.sin(t * 0.7) * 3 + Math.cos(t * 0.3) * 2,
        cam.y + base.y + Math.sin(t * 1.1) * 2,
        cam.z + base.z + Math.cos(t * 0.5) * 3
      );

      // Twinkle
      const tw = f.userData.twinkle;
      const twVal =
        tw.min +
        (tw.max - tw.min) *
          (Math.sin(this.time * tw.speed + tw.phase) * 0.5 + 0.5);

      f.material.opacity = twVal;
    }
  }

  dispose() {
    for (const f of this.fireflies) {
      f.material.dispose();
      this.scene.remove(f);
    }
    this.fireflies = [];
  }
}
