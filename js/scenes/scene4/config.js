// js/scenes/scene4/config.js

export default {
  // Model paths
  models: {
    maze: "assets/models/remaster.glb",
  },

  // Initial scales
  scale: {
    maze: { x: 10, y: 10, z: 10 },
  },

  // Initial positions
  positions: {
    maze: { x: 0, y: 0, z: 0 },
  },

  // Initial rotations
  rotations: {
    maze: { x: 0, y: 0, z: 0 },
  },

  // Lighting
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 0.4,
    },
    hemisphere: {
      skyColor: 0xffffff,
      groundColor: 0x444444,
      intensity: 0.6,
    },
    main: {
      color: 0xffffff,
      intensity: 1.8,
      position: { x: 80, y: 150, z: 80 },
    },
    fill: {
      color: 0xffffff,
      intensity: 0.6,
      position: { x: -80, y: 80, z: -80 },
    },
    rim: {
      color: 0xaaaaff,
      intensity: 0.5,
      position: { x: 0, y: 20, z: -100 },
    },
  },

  // Camera - for FPS mode
  camera: {
    normal: { x: 5, y: 4, z: -20 },
    falling: { x: 5, y: 150, z: -20 }, // ✅ Changed from 50 to 150
    rotation: {
      yaw: 0,
      pitchDown: -1.5,
      pitchNormal: 0,
    },
  },

  // Background
  background: {
    color: 0x202030,
  },

  // Intro cinematic
  intro: {
    fadeInDuration: 1500,
    fallingDuration: 3000,
  },
};
