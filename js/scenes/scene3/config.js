// js/scenes/scene3/config.js
// ✅ UPDATED: Camera positions from screenshots

export default {
  // Model paths
  models: {
    maze: "assets/models/maze1.glb",
  },

  // Initial scales
  scale: {
    maze: { x: 1, y: 1, z: 1 },
  },

  // Initial positions
  positions: {
    maze: { x: 0, y: 0, z: 0 }, // Center
  },

  // Initial rotations
  rotations: {
    maze: { x: 0, y: 0, z: 0 },
  },

  // Lighting - BRIGHT & WIDE (opsi A)
  lighting: {
    ambient: {
      color: 0xffffff, // ✅ Pure white
      intensity: 0.8, // ✅ Bright ambient
    },
    directional: {
      color: 0xffffff, // ✅ White light
      intensity: 0.6, // ✅ Strong directional from above
      position: { x: 0, y: 100, z: 0 }, // ✅ From top
      target: { x: 0, y: 0, z: 0 }, // ✅ Point at maze center
    },
    fog: {
      enabled: false, // ✅ DISABLED for full visibility
    },
  },

  // Camera - ✅ From screenshots
  camera: {
    initial: { x: -17.87, y: 107.49, z: 36.33 }, // ✅ Starting position
    rotation: { yaw: -3.144, pitch: -1.231 }, // ✅ Starting rotation (looking down)
    lookUp: { yaw: -3.144, pitch: -0.245 }, // ✅ Look up rotation (from 2nd screenshot)
  },

  // Background - PURE BLACK
  background: {
    color: 0x000000, // Pure black
  },
};
