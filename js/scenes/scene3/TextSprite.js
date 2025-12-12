// js/scenes/scene3/TextSprite.js
// Helper untuk bikin 3D text sprites dengan Pac-Man retro style

export default class TextSprite {
  /**
   * Create a 3D text sprite with Pac-Man style
   * @param {string} text - Text to display
   * @param {object} options - Styling options
   * @returns {THREE.Sprite}
   */
  static create(text, options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Options dengan defaults
    const fontSize = options.fontSize || 48;
    const fontFamily = options.fontFamily || "Arial Black, Arial, sans-serif";
    const textColor = options.textColor || "#FFD700"; // Pac-Man yellow
    const outlineColor = options.outlineColor || "#000000";
    const outlineWidth = options.outlineWidth || 4;
    const backgroundColor = options.backgroundColor || null;
    const padding = options.padding || 20;

    // Set canvas size (lebih besar untuk quality)
    canvas.width = 1024;
    canvas.height = 256;

    // Draw background (optional)
    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Setup text style
    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // Draw text outline (black stroke)
    if (outlineWidth > 0) {
      context.strokeStyle = outlineColor;
      context.lineWidth = outlineWidth;
      context.strokeText(text, x, y);
    }

    // Draw text fill (yellow)
    context.fillStyle = textColor;
    context.fillText(text, x, y);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite material
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    // Create sprite
    const sprite = new THREE.Sprite(material);

    // Set scale (width based on aspect ratio)
    const aspectRatio = canvas.width / canvas.height;
    const scale = options.scale || 5; // Default 5 units tall
    sprite.scale.set(scale * aspectRatio, scale, 1);

    // Store original values for animations
    sprite.userData.originalScale = sprite.scale.clone();
    sprite.userData.originalOpacity = 1;
    sprite.userData.text = text;

    return sprite;
  }

  /**
   * Create loading bar sprite
   * @param {number} progress - 0 to 1
   * @param {object} options - Styling options
   * @returns {THREE.Sprite}
   */
  static createLoadingBar(progress = 0, options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const width = options.width || 512;
    const height = options.height || 64;
    const barColor = options.barColor || "#FFD700"; // Yellow
    const bgColor = options.bgColor || "#333333"; // Dark grey
    const borderColor = options.borderColor || "#000000";
    const borderWidth = options.borderWidth || 4;

    canvas.width = width;
    canvas.height = height;

    // Draw background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);

    // Draw progress bar
    const progressWidth =
      (width - borderWidth * 2) * Math.max(0, Math.min(1, progress));
    context.fillStyle = barColor;
    context.fillRect(
      borderWidth,
      borderWidth,
      progressWidth,
      height - borderWidth * 2
    );

    // Draw border
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      width - borderWidth,
      height - borderWidth
    );

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);

    // Set scale
    const aspectRatio = width / height;
    const scale = options.scale || 1; // Default 1 unit tall
    sprite.scale.set(scale * aspectRatio, scale, 1);

    // Store canvas and context for updates
    sprite.userData.canvas = canvas;
    sprite.userData.context = context;
    sprite.userData.texture = texture;
    sprite.userData.options = options;

    return sprite;
  }

  /**
   * Update loading bar progress
   * @param {THREE.Sprite} barSprite - Loading bar sprite
   * @param {number} progress - 0 to 1
   */
  static updateLoadingBar(barSprite, progress) {
    const canvas = barSprite.userData.canvas;
    const context = barSprite.userData.context;
    const texture = barSprite.userData.texture;
    const options = barSprite.userData.options;

    const width = canvas.width;
    const height = canvas.height;
    const barColor = options.barColor || "#FFD700";
    const bgColor = options.bgColor || "#333333";
    const borderColor = options.borderColor || "#000000";
    const borderWidth = options.borderWidth || 4;

    // Clear and redraw
    context.clearRect(0, 0, width, height);

    // Background
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);

    // Progress
    const progressWidth =
      (width - borderWidth * 2) * Math.max(0, Math.min(1, progress));
    context.fillStyle = barColor;
    context.fillRect(
      borderWidth,
      borderWidth,
      progressWidth,
      height - borderWidth * 2
    );

    // Border
    context.strokeStyle = borderColor;
    context.lineWidth = borderWidth;
    context.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      width - borderWidth,
      height - borderWidth
    );

    // Update texture
    texture.needsUpdate = true;
  }

  /**
   * Create Pac-Man sprite (emoji style)
   * @param {object} options - Styling options
   * @returns {THREE.Sprite}
   */
  static createPacMan(options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const size = options.size || 128;
    canvas.width = size;
    canvas.height = size;

    // Draw Pac-Man (yellow circle with mouth)
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    // Yellow circle
    context.fillStyle = "#FFD700";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    context.lineTo(centerX, centerY);
    context.closePath();
    context.fill();

    // Black outline
    context.strokeStyle = "#000000";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    context.lineTo(centerX, centerY);
    context.closePath();
    context.stroke();

    // Eye
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(centerX, centerY - radius / 3, radius / 8, 0, Math.PI * 2);
    context.fill();

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create sprite
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);

    // Set scale
    const scale = options.scale || 1;
    sprite.scale.set(scale, scale, 1);

    return sprite;
  }

  /**
   * Animate sprite fade
   * @param {THREE.Sprite} sprite - Sprite to fade
   * @param {number} targetOpacity - Target opacity (0-1)
   * @param {number} duration - Duration in ms
   * @param {function} onComplete - Callback on complete
   */
  static fade(sprite, targetOpacity, duration, onComplete = null) {
    const startOpacity = sprite.material.opacity;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      sprite.material.opacity =
        startOpacity + (targetOpacity - startOpacity) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    animate();
  }

  /**
   * Animate sprite scale
   * @param {THREE.Sprite} sprite - Sprite to scale
   * @param {THREE.Vector3} targetScale - Target scale
   * @param {number} duration - Duration in ms
   * @param {function} onComplete - Callback on complete
   */
  static scale(sprite, targetScale, duration, onComplete = null) {
    const startScale = sprite.scale.clone();
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      sprite.scale.lerpVectors(startScale, targetScale, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };

    animate();
  }
}
