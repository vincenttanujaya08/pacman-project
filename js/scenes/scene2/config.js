// js/scenes/scene2/config.js
// Configuration for Scene 2 (Forest)

export default {
  // Model paths
  models: {
    forest: "assets/models/forest.glb",
  },

  // Initial scales
  scale: {
    forest: { x: 100, y: 100, z: 100 },
  },

  // Initial positions
  positions: {
    forest: { x: 0, y: 0, z: 0 },
  },

  // Initial rotations
  rotations: {
    forest: { x: 0, y: 0, z: 0 },
  },

  // Lighting
  lighting: {
    ambient: {
      color: 0x1a1a2e,
      intensity: 0.3,
    },
    sun: {
      color: 0x6699ff,
      intensity: 0.5,
      position: { x: 10, y: 20, z: 10 },
    },
    fill: {
      color: 0x334477,
      intensity: 0.2,
      position: { x: -5, y: 10, z: -5 },
    },
    fog: {
      enabled: true,
      color: 0x0a0a1e,
      near: 10,
      far: 200,
    },
  },

  // Camera
  camera: {
    initial: { x: 7.76, y: 7550.23, z: 228.71 },
    lookAt: { x: 0, y: 0, z: 0 },
  },

  // Background
  background: {
    color: 0x000011,
  },

  // ✅ Light Particles (NEW!)
  lightParticles: {
    enabled: true,
    particleCount: 300,
    area: { x: 300, y: 0, z: 300 },
    height: -10,
    size: 1,
  },
};
