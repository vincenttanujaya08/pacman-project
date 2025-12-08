// js/scenes/scene2/config.js
// Configuration for Scene 2 - Forest Environment

export default {
  // Model paths
  models: {
    forest: "assets/models/forest.glb",
  },

  // Initial scales (adjust dengan keyboard [1][2])
  scale: {
    forest: { x: 1, y: 1, z: 1 },
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
      color: 0x404040, // Soft gray
      intensity: 0.5,
    },
    main: {
      color: 0xffffff, // White
      intensity: 1.0,
      position: { x: 50, y: 100, z: 50 },
    },
    fill: {
      color: 0x8888ff, // Soft blue
      intensity: 0.3,
      position: { x: -50, y: 50, z: -50 },
    },
  },

  // Camera
  camera: {
    initial: { x: 0, y: 5, z: 20 }, // Default dari depan
    lookAt: { x: 0, y: 0, z: 0 },
  },
};
