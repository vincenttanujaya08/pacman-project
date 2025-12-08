// js/scenes/scene2/StarField.js
// Starry night sky particle system

export default class StarField {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    this.particleSystem = null;
  }

  init() {
    const starCount = this.config.starCount || 5000;
    const spread = this.config.spread || 500;

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Random position in sphere
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = (Math.random() - 0.5) * spread;
      positions[i3 + 2] = (Math.random() - 0.5) * spread;

      // Star color (white with slight blue/yellow tint)
      const colorVariation = Math.random();
      if (colorVariation > 0.9) {
        // Slight blue tint (10% of stars)
        colors[i3] = 0.8;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1.0;
      } else if (colorVariation > 0.8) {
        // Slight yellow tint (10% of stars)
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.95;
        colors[i3 + 2] = 0.8;
      } else {
        // Pure white (80% of stars)
        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 1.0;
      }

      // Random size (some stars brighter/bigger)
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Create material
    const material = new THREE.PointsMaterial({
      size: this.config.size || 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    // Create particle system
    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);

    console.log(`✨ Star field created with ${starCount} stars`);
  }

  update(deltaTime) {
    if (!this.particleSystem) return;

    // Slow rotation for subtle movement
    this.particleSystem.rotation.y += 0.00005 * deltaTime;
  }

  dispose() {
    if (this.particleSystem) {
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
      this.scene.remove(this.particleSystem);
      this.particleSystem = null;
    }
  }
}
