// js/scenes/opening/RainEffect.js
// Rain particle system for night atmosphere

export default class RainEffect {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    this.particles = null;
    this.particleSystem = null;
    this.time = 0;
  }

  init() {
    const particleCount = this.config.particleCount || 2000;
    const area = this.config.area || { x: 200, y: 100, z: 200 };

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random position in area
      positions[i3] = (Math.random() - 0.5) * area.x;
      positions[i3 + 1] = Math.random() * area.y; // ✅ Already distributed from 0 to max height
      positions[i3 + 2] = (Math.random() - 0.5) * area.z;

      // Random fall speed (more consistent range)
      velocities[i] = Math.random() * 0.2 + 0.9; // ✅ 0.9-1.1 range (tighter, more uniform)
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));

    // Create material (subtle white/blue rain)
    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: this.config.size || 0.3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create particle system
    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);

    console.log("✅ Rain effect initialized");
  }

  update(deltaTime) {
    if (!this.particleSystem) return;

    this.time += deltaTime;

    const positions = this.particleSystem.geometry.attributes.position.array;
    const velocities = this.particleSystem.geometry.attributes.velocity.array;
    const area = this.config.area || { x: 200, y: 100, z: 200 };
    const speed = this.config.speed || 0.5;

    for (let i = 0; i < positions.length; i += 3) {
      // Fall down
      positions[i + 1] -= velocities[i / 3] * speed * (deltaTime / 16);

      // Add slight horizontal drift
      positions[i] += Math.sin(this.time * 0.001 + i) * 0.02;

      // Reset if below ground
      if (positions[i + 1] < 0) {
        positions[i + 1] = area.y;
        positions[i] = (Math.random() - 0.5) * area.x;
        positions[i + 2] = (Math.random() - 0.5) * area.z;
      }
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  setIntensity(intensity) {
    if (!this.particleSystem) return;

    this.particleSystem.material.opacity = intensity * 0.6;
  }

  dispose() {
    if (this.particleSystem) {
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
      this.scene.remove(this.particleSystem);
    }
  }
}
