// js/scenes/scene2/config.js
// Configuration for Scene 2 (Forest)

export default {
  // Model paths
  models: {
    forest: "assets/models/forest.glb",
    ghost: "assets/models/red_ghost.glb", // ✅ Ghost model
    arcade: "assets/models/arcade.glb", // ✅ Arcade machine
  },

  // Initial scales
  scale: {
    forest: { x: 100, y: 100, z: 100 },
    ghost: { x: 3, y: 3, z: 3 }, // ✅ Ghost scale
    arcade: { x: 0.2, y: 0.2, z: 0.2 }, // ✅ Arcade scale (adjusted)
  },

  // Initial positions
  positions: {
    forest: { x: 0, y: 0, z: 0 },
    arcade: { x: 6.65, y: 7541.2, z: 220.71 }, // ✅ Camera position (adjusted)
  },

  // Initial rotations
  rotations: {
    forest: { x: 0, y: 0, z: 0 },
    arcade: { x: 0, y: Math.PI + 0.1, z: 0 }, // ✅ Arcade rotation (adjusted)
  },

  // Lighting - ✅ MUCH BRIGHTER FOR NORMAL MODE
  lighting: {
    ambient: {
      color: 0x445566, // ✅ Lighter blue-grey (was 0x1a1a2e)
      intensity: 0.6, // ✅ 2x brighter (was 0.3)
    },
    sun: {
      color: 0xfff4e6, // ✅ Warm sunlight (was 0x6699ff)
      intensity: 1.2, // ✅ 2.4x brighter (was 0.5)
      position: { x: 10, y: 20, z: 10 },
    },
    fill: {
      color: 0x88aacc, // ✅ Brighter cool blue (was 0x334477)
      intensity: 0.5, // ✅ 2.5x brighter (was 0.2)
      position: { x: -5, y: 10, z: -5 },
    },
    fog: {
      enabled: true,
      color: 0x2a3a4e, // ✅ Much lighter fog (was 0x0a0a1e)
      near: 10,
      far: 200,
    },
  },

  // Camera
  camera: {
    initial: { x: -8.84, y: 7542.8, z: 97.28 }, // ✅ Absolute start position
    rotation: { yaw: 0.136, pitch: 0.058 },
    lookAt: { x: -8.84, y: 7542.8, z: 100 }, // Look forward
  },

  // Background - ✅ BRIGHTER (was 0x000011 - almost black)
  background: {
    color: 0x1a2838, // ✅ Dark blue (mystical but visible)
  },

  // ✅ Light Particles
  lightParticles: {
    enabled: true,
    particleCount: 300,
    area: { x: 300, y: 0, z: 300 },
    height: -10,
    size: 1,
  },

  // ✅ Ghost configuration (absolute position)
  ghost: {
    position: { x: 38.9, y: 7538.8, z: 109.97 }, // Absolute spawn position
    rotation: { x: 0, y: -Math.PI / 2, z: 0 }, // Initial rotation
  },

  // ✅ GOLDEN APOCALYPSE MODE SETTINGS (for smooth transition)
  apocalypse: {
    background: {
      color: 0x000000, // ✅ Pure black sky
    },
    fog: {
      color: 0x1a1500, // ✅ Dark GOLD mist (changed from red 0x1a0808)
    },
    lighting: {
      ambient: {
        color: 0x3a3010, // ✅ GOLDEN tint (changed from red 0x3a2a2a)
        intensity: 0.4, // ✅ Slightly dimmer
      },
      sun: {
        color: 0x8a7a50, // ✅ GOLDEN dim light (changed from red 0x8a6a70)
        intensity: 0.8,
      },
      fill: {
        color: 0x3a3020, // ✅ Warm GOLDEN fill (changed from red 0x3a2a30)
        intensity: 0.3,
      },
    },
    fireflies: {
      color: 0xffd700, // ✅ GOLD fireflies (changed from red 0xff2020) ✨
    },
    materialDarkness: 0.45, // ✅ Slightly darker forest (was 0.6, now 0.45)
  },
};
