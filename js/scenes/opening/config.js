// js/scenes/opening/config.js
// Configuration for Opening Scene

export default {
  // Model paths
  models: {
    city: "assets/models/city.glb",
    pacman: "assets/models/pacman.glb",
  },

  // Initial scales (adjust these after testing)
  scale: {
    city: { x: 0.5, y: 0.5, z: 0.5 },
    pacman: { x: 0.05, y: 0.05, z: 0.05 },
  },

  // Initial positions
  positions: {
    city: { x: 0, y: 0, z: 0 },
    pacman: { x: 0, y: 0, z: 6.5 }, // Start from left
  },

  rotations: {
    city: { x: 0, y: 0, z: 0 },
    pacman: { x: 0, y: -Math.PI / 2, z: 0 },
  },

  // Lighting
  lighting: {
    ambient: {
      color: 0x332255, // ✅ Dark purple ambient
      intensity: 0.2,
    },
    main: {
      color: 0x8866ff, // ✅ Purple-ish main light
      intensity: 0.6,
      position: { x: 50, y: 100, z: 50 },
    },
    fill: {
      color: 0xaa8800, // ✅ Dark yellow/gold fill
      intensity: 0.4,
      position: { x: -50, y: 50, z: -50 },
    },
    neon: {
      color: 0xffaa00, // ✅ Yellow/orange neon
      intensity: 1.2,
      position: { x: 0, y: 20, z: 30 },
    },
    fog: {
      color: 0x221144, // ✅ Dark purple fog
      near: 10,
      far: 200,
    },
  },

  // Camera
  camera: {
    initial: { x: 60.19, y: 3.79, z: -82.04 },
    lookAt: { x: 60, y: 0, z: 0 },
  },

  logo: {
    position: { x: 60, y: 10, z: -50 }, // In middle of first path
    fadeInDuration: 5000, // 2 seconds fade in
    eatDistance: 8, // Distance at which Pacman eats it
  },

  // Animation timing (for later)
  timing: {
    pacmanWalkDuration: 5000, // ms
    cameraZoomDuration: 3000,
    fadeOutDuration: 1000,
  },

  // Rain effect
  rain: {
    enabled: true,
    particleCount: 2000,
    size: 0.3,
    speed: 0.5,
    area: { x: 200, y: 100, z: 200 },
  },
};
