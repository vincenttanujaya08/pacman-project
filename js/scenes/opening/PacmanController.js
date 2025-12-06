// js/scenes/opening/PacmanController.js
// Controls Pacman movement and rotation

export default class PacmanController {
  constructor(pacmanModel) {
    this.pacman = pacmanModel;

    // Animation state
    this.isAnimating = false;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // Movement path
    this.path = [
      {
        type: "move",
        from: { x: 0, y: 0, z: 6.5 },
        to: { x: 60, y: 0, z: 6.5 },
        duration: 3000, // 3 seconds
        rotation: 0, // Face +X direction
      },
      {
        type: "rotate",
        from: -Math.PI / 2, // Current rotation
        to: -Math.PI, // Rotate -90° to face -Z
        duration: 500, // 0.5 seconds
      },
      {
        type: "move",
        from: { x: 60, y: 0, z: 6.5 },
        to: { x: 60, y: 0, z: -80 },
        duration: 4000, // 4 seconds
        rotation: -Math.PI / 2, // Face -Z direction
      },
    ];
  }

  start() {
    console.log("🎬 Pacman animation started!");
    this.isAnimating = true;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // Set initial position and rotation
    const firstStep = this.path[0];
    this.pacman.position.set(
      firstStep.from.x,
      firstStep.from.y,
      firstStep.from.z
    );
    this.pacman.rotation.y = firstStep.rotation || 0;
  }

  stop() {
    this.isAnimating = false;
  }

  reset() {
    this.currentStep = 0;
    this.elapsedTime = 0;
    const firstStep = this.path[0];
    this.pacman.position.set(
      firstStep.from.x,
      firstStep.from.y,
      firstStep.from.z
    );
    this.pacman.rotation.y = 0;
  }

  update(deltaTime) {
    if (!this.isAnimating) return;
    if (this.currentStep >= this.path.length) {
      // Animation complete
      console.log("✅ Pacman animation complete!");
      this.isAnimating = false;
      return;
    }

    this.elapsedTime += deltaTime;

    const step = this.path[this.currentStep];
    const t = Math.min(this.elapsedTime / step.duration, 1);

    if (step.type === "move") {
      // Linear interpolation for position
      this.pacman.position.x = this.lerp(step.from.x, step.to.x, t);
      this.pacman.position.y = this.lerp(step.from.y, step.to.y, t);
      this.pacman.position.z = this.lerp(step.from.z, step.to.z, t);

      // Set rotation for this movement
      if (step.rotation !== undefined) {
        this.pacman.rotation.y = step.rotation;
      }
    } else if (step.type === "rotate") {
      // Smooth rotation
      this.pacman.rotation.y = this.lerp(
        step.from,
        step.to,
        this.easeInOutQuad(t)
      );
    }

    // Move to next step when current is complete
    if (t >= 1) {
      this.currentStep++;
      this.elapsedTime = 0;

      if (this.currentStep < this.path.length) {
        console.log(
          `📍 Pacman step ${this.currentStep + 1}/${this.path.length}`
        );
      }
    }
  }

  // Linear interpolation
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  // Easing function for smooth rotation
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Get current animation progress (0-1)
  getProgress() {
    if (this.path.length === 0) return 0;

    const totalSteps = this.path.length;
    const currentProgress = this.currentStep / totalSteps;
    const stepProgress = Math.min(
      this.elapsedTime / this.path[this.currentStep]?.duration || 1,
      1
    );

    return currentProgress + stepProgress / totalSteps;
  }
}
