// js/scenes/scene2/config.js
// Configuration for Scene 2 (Forest)

export default {
  // Model paths
  models: {
    forest: "assets/models/forest.glb",
  },

  // Initial scales (adjust after testing)
  scale: {
    forest: { x: 100, y: 100, z: 100 }, // ✅ START SMALL untuk debug
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
      color: 0x1a1a2e, // ✅ Dark blue-purple (night)
      intensity: 0.3, // ✅ Very dim
    },
    sun: {
      color: 0x6699ff, // ✅ Moonlight (blue-ish)
      intensity: 0.5, // ✅ Soft moonlight
      position: { x: 10, y: 20, z: 10 },
    },
    fill: {
      color: 0x334477, // ✅ Dark blue fill
      intensity: 0.2, // ✅ Very subtle
      position: { x: -5, y: 10, z: -5 },
    },
    fog: {
      enabled: true, // ✅ Enable fog for depth
      color: 0x0a0a1e, // ✅ Very dark blue
      near: 10,
      far: 200,
    },
  },

  // Camera
  camera: {
    initial: { x: 7.76, y: 7550.23, z: 228.71 }, // ✅ Lebih jauh + tinggi
    lookAt: { x: 0, y: 0, z: 0 },
  },

  // Background
  background: {
    color: 0x000011, // ✅ Very dark blue (night sky)
  },
};
