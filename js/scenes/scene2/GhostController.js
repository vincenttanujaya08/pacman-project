// js/scenes/scene2/GhostController.js
// ✅ NEW: Ghost chase sequence - Move forward → Rotate to camera → Chase!

export default class GhostController {
  constructor(ghostModel) {
    this.ghost = ghostModel;

    // Animation state
    this.isAnimating = false;
    this.hasFinished = false;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // ✅ NEW CHASE SEQUENCE
    this.path = [
      // Step 1: Move forward straight (from spawn position)
      {
        type: "move",
        from: { x: 0, y: 0, z: 0 }, // Will be set to spawn position
        to: { x: 0, y: 0, z: 0 }, // Will be calculated (+25 forward)
        duration: 2500, // 2.5 seconds
        rotation: null, // Face forward
      },
      // Step 2: Quick rotate to face camera (creepy turn!)
      {
        type: "rotate",
        from: 0,
        to: Math.PI, // 180° turn to face camera
        duration: 800, // 0.8 seconds - quick!
      },
      // Step 3: Chase camera! (mengejar!)
      {
        type: "chase",
        from: { x: 0, y: 0, z: 0 }, // Current position
        to: { x: 0, y: 0, z: 200 }, // Will be calculated dynamically
        duration: 6000, // 6 seconds - fast chase
      },
    ];

    // Chase settings
    this.chaseSpeed = 0.75; // Slightly slower than camera (hampir kekejar!)
    this.chaseOffset = 12; // Stay ~12 units behind camera (visible in lookback)
  }

  // ✅ NEW: Start chase sequence (called after ghost fades in)
  startChaseSequence() {
    console.log("👻 Ghost chase sequence started!");
    this.initialRotationY = this.ghost.rotation.y;
    this.isAnimating = true;
    this.hasFinished = false;
    this.currentStep = 0;
    this.elapsedTime = 0;

    // Get current ghost position
    const currentPos = this.ghost.position;

    // Step 1: Calculate forward movement (move +25 units in +Z direction)
    this.path[0].from.x = currentPos.x;
    this.path[0].from.y = currentPos.y;
    this.path[0].from.z = currentPos.z;

    this.path[0].to.x = currentPos.x - 5;
    this.path[0].to.y = currentPos.y;
    this.path[0].to.z = currentPos.z + 25; // Move forward

    // Step 2: Rotate will use current rotation
    this.path[1].from = this.ghost.rotation.y;
    this.path[1].to = Math.PI; // Face camera direction (-Z)

    // Step 3: Chase will be calculated dynamically
    // (position will be updated in real-time based on camera)

    console.log(
      `👻 Ghost starting from: (${currentPos.x.toFixed(
        2
      )}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)})`
    );
  }

  // Set spawn position (called when scene enters)
  setSpawnPosition(position) {
    this.ghost.position.copy(position);

    console.log(
      `👻 Ghost spawned at: (${position.x.toFixed(2)}, ${position.y.toFixed(
        2
      )}, ${position.z.toFixed(2)})`
    );
  }

  start() {
    // Legacy method - use startChaseSequence() instead
    this.startChaseSequence();
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

    // Reset to spawn position
    const firstStep = this.path[0];
    if (firstStep && firstStep.from) {
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
        console.log("✅ Ghost chase complete!");
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
        this.ghost.rotation.y = this.initialRotationY;
      }
    } else if (step.type === "rotate") {
      // Smooth rotation
      this.ghost.rotation.y = this.lerp(
        step.from,
        step.to,
        this.easeInOutQuad(t)
      );
    } else if (step.type === "chase") {
      // ✅ CHASE MODE: Move towards camera dynamically!

      // Get camera position from scene (will be injected)
      const cameraPos = window.app?.camera?.position;

      if (cameraPos) {
        // Calculate target position (behind camera by offset)
        const direction = new THREE.Vector3(
          cameraPos.x - this.ghost.position.x,
          0, // No Y movement
          cameraPos.z - this.ghost.position.z
        ).normalize();

        // Target is chaseOffset units behind camera
        const targetPos = new THREE.Vector3(
          cameraPos.x - direction.x * this.chaseOffset,
          this.ghost.position.y, // Keep same height
          cameraPos.z - direction.z * this.chaseOffset
        );

        // Move towards target with chaseSpeed
        const moveSpeed = this.chaseSpeed * (deltaTime / 16); // Normalize to ~60fps

        this.ghost.position.x = this.lerp(
          this.ghost.position.x,
          targetPos.x,
          moveSpeed * 0.05 // Smooth movement
        );
        this.ghost.position.z = this.lerp(
          this.ghost.position.z,
          targetPos.z,
          moveSpeed * 0.05
        );

        // Always face towards camera (creepy!)
        const angle = Math.atan2(
          cameraPos.x - this.ghost.position.x,
          cameraPos.z - this.ghost.position.z
        );
        this.ghost.rotation.y = angle;
      }
    }

    // Move to next step when current is complete
    if (t >= 1) {
      this.currentStep++;
      this.elapsedTime = 0;

      if (this.currentStep < this.path.length) {
        const nextStep = this.path[this.currentStep];

        console.log(
          `👻 Ghost step ${this.currentStep + 1}/${this.path.length}: ${
            nextStep.type
          }`
        );

        // Setup next step if it's chase
        if (nextStep.type === "chase") {
          nextStep.from.x = this.ghost.position.x;
          nextStep.from.y = this.ghost.position.y;
          nextStep.from.z = this.ghost.position.z;
          console.log("👻 Ghost now CHASING camera!");
        }
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
