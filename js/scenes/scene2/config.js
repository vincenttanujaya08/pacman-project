// js/scenes/scene2/config.js
// Configuration for Scene 2 (Forest)

export default {
  // Model paths
  models: {
    forest: "assets/models/forest.glb",
  },

  // Initial scales (adjust after testing)
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
      color: 0xffffff, // White
      intensity: 0.6,
    },
    sun: {
      color: 0xffffff, // White sunlight
      intensity: 0.8,
      position: { x: 10, y: 20, z: 10 },
    },
    fill: {
      color: 0xaaccff, // Soft blue fill
      intensity: 0.3,
      position: { x: -5, y: 10, z: -5 },
    },
    fog: {
      enabled: false,
      color: 0x87ceeb,
      near: 10,
      far: 100,
    },
  },

  // Camera
  camera: {
    initial: { x: 0, y: 2, z: 10 },
    lookAt: { x: 0, y: 0, z: 0 },
  },

  // Background
  background: {
    color: 0x87ceeb, // Sky blue
  },
};
