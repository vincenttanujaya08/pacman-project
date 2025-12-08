// js/scenes/scene2/GhostController.js
// Controls Ghost spawning and movement animation

export default class GhostController {
  constructor(ghostModel) {
    this.ghost = ghostModel;

    // Animation state
    this.isAnimating = false;
    this.hasFinished = false;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // Movement path (example - adjust as needed)
    this.path = [
      {
        type: "move",
        from: { x: 0, y: 0, z: 0 }, // Will be set to spawn position
        to: { x: 30, y: 0, z: 0 }, // Move right
        duration: 3000, // 3 seconds
        rotation: Math.PI / 2, // Face right (+X)
      },
      {
        type: "rotate",
        from: Math.PI / 2,
        to: Math.PI, // Turn to face -Z
        duration: 500, // 0.5 seconds
      },
      {
        type: "move",
        from: { x: 30, y: 0, z: 0 },
        to: { x: 30, y: 0, z: -30 }, // Move forward
        duration: 3000,
        // Already facing -Z from rotation
      },
      {
        type: "rotate",
        from: Math.PI,
        to: Math.PI * 1.5, // Turn to face +X
        duration: 500,
      },
      {
        type: "move",
        from: { x: 30, y: 0, z: -30 },
        to: { x: 60, y: 0, z: -30 }, // Move right again
        duration: 3000,
      },
    ];
  }

  // Set spawn position (relative to camera)
  setSpawnPosition(position) {
    this.ghost.position.copy(position);

    // Update first path step's 'from' position
    if (this.path.length > 0 && this.path[0].type === "move") {
      this.path[0].from.x = position.x;
      this.path[0].from.y = position.y;
      this.path[0].from.z = position.z;
    }

    console.log(
      `👻 Ghost spawned at: (${position.x.toFixed(2)}, ${position.y.toFixed(
        2
      )}, ${position.z.toFixed(2)})`
    );
  }

  start() {
    console.log("👻 Ghost animation started!");
    this.isAnimating = true;
    this.hasFinished = false;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // Set initial rotation
    const firstStep = this.path[0];
    if (firstStep.rotation !== undefined) {
      this.ghost.rotation.y = firstStep.rotation;
    }
  }

  stop() {
    this.isAnimating = false;
    console.log("👻 Ghost animation stopped");
  }

  reset() {
    this.currentStep = 0;
    this.elapsedTime = 0;
    this.hasFinished = false;
    this.isAnimating = false;

    // Reset to first position
    const firstStep = this.path[0];
    if (firstStep && firstStep.type === "move") {
      this.ghost.position.set(
        firstStep.from.x,
        firstStep.from.y,
        firstStep.from.z
      );
      this.ghost.rotation.y = firstStep.rotation || 0;
    }

    console.log("👻 Ghost reset to spawn position");
  }

  update(deltaTime) {
    if (!this.isAnimating) return;
    if (this.currentStep >= this.path.length) {
      // Animation complete
      if (!this.hasFinished) {
        console.log("✅ Ghost animation complete!");
        this.hasFinished = true;
      }
      this.isAnimating = false;
      return;
    }

    this.elapsedTime += deltaTime;

    const step = this.path[this.currentStep];
    const t = Math.min(this.elapsedTime / step.duration, 1);

    if (step.type === "move") {
      // Linear interpolation for position
      this.ghost.position.x = this.lerp(step.from.x, step.to.x, t);
      this.ghost.position.y = this.lerp(step.from.y, step.to.y, t);
      this.ghost.position.z = this.lerp(step.from.z, step.to.z, t);

      // Set rotation for this movement
      if (step.rotation !== undefined) {
        this.ghost.rotation.y = step.rotation;
      }
    } else if (step.type === "rotate") {
      // Smooth rotation
      this.ghost.rotation.y = this.lerp(
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
          `👻 Ghost step ${this.currentStep + 1}/${this.path.length}`
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
      this.elapsedTime / (this.path[this.currentStep]?.duration || 1),
      1
    );

    return currentProgress + stepProgress / totalSteps;
  }

  // Custom path setter (if you want to change path dynamically)
  setPath(newPath) {
    this.path = newPath;
    this.reset();
    console.log(`👻 Ghost path updated (${newPath.length} steps)`);
  }
}
