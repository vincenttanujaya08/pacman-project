// js/scenes/scene3/Scene3Cinematic.js
// Cinematic controller for Scene 3 entrance sequence

import TextSprite from "./TextSprite.js";

export default class Scene3Cinematic {
  constructor(scene, camera, mazeModel) {
    this.scene = scene;
    this.camera = camera;
    this.mazeModel = mazeModel;

    this.isPlaying = false;
    this.currentStep = 0;
    this.stepElapsed = 0;

    // Text sprites
    this.enterText = null;
    this.yesText = null;
    this.noText = null;
    this.enteringText = null;
    this.loadingBar = null;
    this.percentText = null;
    this.pacmanSprite = null;
    this.successText = null;

    // Camera animation state
    this.startPos = new THREE.Vector3();
    this.startYaw = 0;
    this.startPitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;

    // Loading progress
    this.loadingProgress = 0;

    // Hover animation state
    this.hoverTime = 0;

    // ✅ Cinematic sequence
    this.sequence = [
      {
        name: "look_up",
        duration: 1500,
        fromPitch: -1.231,
        toPitch: -0.245,
      },
      {
        name: "show_enter_text",
        duration: 500,
      },
      {
        name: "look_at_no",
        duration: 1000,
        targetYaw: -3.044, // Slight right
      },
      {
        name: "look_at_yes",
        duration: 1000,
        targetYaw: -3.244, // Slight left
      },
      {
        name: "nod_yes",
        duration: 1000,
        nods: 3,
      },
      {
        name: "yes_selected",
        duration: 500,
      },
      {
        name: "entering_text",
        duration: 500,
      },
      {
        name: "loading",
        duration: 3500,
      },
      {
        name: "success",
        duration: 1000,
      },
      {
        name: "fade_text",
        duration: 500,
      },
      {
        name: "look_down",
        duration: 2000,
        fromPitch: -0.245,
        toPitch: -1.231,
      },
      {
        name: "fade_maze",
        duration: 2000,
      },
      {
        name: "complete",
        duration: 500,
      },
    ];
  }

  start() {
    if (this.isPlaying) return;

    console.log("🎬 Scene3 Cinematic Started!");
    this.isPlaying = true;
    this.currentStep = 0;
    this.stepElapsed = 0;
    this.loadingProgress = 0;

    // Store starting camera state
    this.startPos.copy(this.camera.position);
    this.startYaw = -3.144;
    this.startPitch = -1.231;
  }

  stop() {
    this.isPlaying = false;
    console.log("🎬 Scene3 Cinematic Stopped");
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    if (this.currentStep >= this.sequence.length) {
      console.log("✅ Scene3 Cinematic Complete!");
      this.isPlaying = false;
      return;
    }

    const step = this.sequence[this.currentStep];
    this.stepElapsed += deltaTime;

    const t = Math.min(this.stepElapsed / step.duration, 1);
    const easedT = this.easeInOutCubic(t);

    // Execute step logic
    switch (step.name) {
      case "look_up":
        this.updateLookUp(step, easedT);
        break;
      case "show_enter_text":
        this.updateShowEnterText(step, t);
        break;
      case "look_at_no":
        this.updateLookAtNo(step, easedT, deltaTime);
        break;
      case "look_at_yes":
        this.updateLookAtYes(step, easedT, deltaTime);
        break;
      case "nod_yes":
        this.updateNodYes(step, t, deltaTime);
        break;
      case "yes_selected":
        this.updateYesSelected(step, t);
        break;
      case "entering_text":
        this.updateEnteringText(step, t);
        break;
      case "loading":
        this.updateLoading(step, t, deltaTime);
        break;
      case "success":
        this.updateSuccess(step, t);
        break;
      case "fade_text":
        this.updateFadeText(step, t);
        break;
      case "look_down":
        this.updateLookDown(step, easedT);
        break;
      case "fade_maze":
        this.updateFadeMaze(step, t);
        break;
      case "complete":
        // Just wait
        break;
    }

    // Move to next step
    if (t >= 1) {
      console.log(`✅ Step complete: ${step.name}`);
      this.currentStep++;
      this.stepElapsed = 0;
    }
  }

  // ========== STEP UPDATES ==========

  updateLookUp(step, t) {
    const pitch = this.lerp(step.fromPitch, step.toPitch, t);
    this.applyCameraRotation(-3.144, pitch);
  }

  updateShowEnterText(step, t) {
    if (this.stepElapsed < 16) {
      // Create text on first frame
      this.createEnterTexts();
    }

    // Fade in
    if (this.enterText) this.enterText.material.opacity = t;
    if (this.yesText) this.yesText.material.opacity = t;
    if (this.noText) this.noText.material.opacity = t;
  }

  updateLookAtNo(step, t, deltaTime) {
    // Rotate to NO
    const yaw = this.lerp(-3.144, step.targetYaw, t);
    this.applyCameraRotation(yaw, -0.245);

    // Hover animation on NO
    if (this.noText) {
      this.hoverTime += deltaTime * 0.003;
      const scale = 1.0 + Math.sin(this.hoverTime) * 0.1;
      this.noText.scale
        .copy(this.noText.userData.originalScale)
        .multiplyScalar(scale);
    }
  }

  updateLookAtYes(step, t, deltaTime) {
    // Rotate to YES
    const yaw = this.lerp(-3.044, step.targetYaw, t);
    this.applyCameraRotation(yaw, -0.245);

    // Reset NO hover
    if (this.noText && t < 0.1) {
      this.noText.scale.copy(this.noText.userData.originalScale);
    }

    // Hover animation on YES
    if (this.yesText) {
      this.hoverTime += deltaTime * 0.003;
      const scale = 1.0 + Math.sin(this.hoverTime) * 0.1;
      this.yesText.scale
        .copy(this.yesText.userData.originalScale)
        .multiplyScalar(scale);
    }
  }

  updateNodYes(step, t, deltaTime) {
    // Nod animation (3 nods)
    const nodCycle = Math.sin(t * Math.PI * step.nods * 2);
    const nodAmount = 0.15; // Nod intensity
    const pitch = -0.245 + nodCycle * nodAmount;

    this.applyCameraRotation(-3.244, pitch);

    // Keep YES hovering
    if (this.yesText) {
      this.hoverTime += deltaTime * 0.003;
      const scale = 1.0 + Math.sin(this.hoverTime) * 0.1;
      this.yesText.scale
        .copy(this.yesText.userData.originalScale)
        .multiplyScalar(scale);
    }
  }

  updateYesSelected(step, t) {
    // Fade out NO and ENTER
    if (this.noText) this.noText.material.opacity = 1 - t;
    if (this.enterText) this.enterText.material.opacity = 1 - t;

    // Scale up and brighten YES
    if (this.yesText) {
      const scale = this.lerp(1.0, 1.5, t);
      this.yesText.scale
        .copy(this.yesText.userData.originalScale)
        .multiplyScalar(scale);

      // Brightness (emissive-like effect via opacity boost won't work, so just keep at 1)
      this.yesText.material.opacity = 1.0;
    }

    // Hide NO and ENTER at end
    if (t >= 1) {
      if (this.noText) this.noText.visible = false;
      if (this.enterText) this.enterText.visible = false;
    }
  }

  updateEnteringText(step, t) {
    if (this.stepElapsed < 16) {
      // Create entering text
      this.createEnteringText();
    }

    // Fade out YES
    if (this.yesText) this.yesText.material.opacity = 1 - t;

    // Fade in ENTERING text
    if (this.enteringText) this.enteringText.material.opacity = t;
    if (this.loadingBar) this.loadingBar.material.opacity = t;
    if (this.percentText) this.percentText.material.opacity = t;
    if (this.pacmanSprite) this.pacmanSprite.material.opacity = t;

    // Hide YES at end
    if (t >= 1 && this.yesText) {
      this.yesText.visible = false;
    }
  }

  updateLoading(step, t, deltaTime) {
    // Update loading progress
    this.loadingProgress = t;

    // Update loading bar
    if (this.loadingBar) {
      TextSprite.updateLoadingBar(this.loadingBar, this.loadingProgress);
    }

    // Update percentage text
    if (this.percentText) {
      const percent = Math.floor(this.loadingProgress * 100);
      this.updatePercentText(percent);
    }

    // Animate Pac-Man position
    if (this.pacmanSprite && this.loadingBar) {
      const barWidth = this.loadingBar.scale.x;
      const pacmanX = -barWidth / 2 + barWidth * this.loadingProgress;
      this.pacmanSprite.position.x = this.loadingBar.position.x + pacmanX;
    }

    // Camera idle sway
    const swayAmount = 0.05;
    const swaySpeed = 0.001;
    const yawSway = Math.sin(this.stepElapsed * swaySpeed) * swayAmount;
    const pitchSway =
      Math.cos(this.stepElapsed * swaySpeed * 0.7) * swayAmount * 0.5;

    this.applyCameraRotation(-3.244 + yawSway, -0.245 + pitchSway);
  }

  updateSuccess(step, t) {
    if (this.stepElapsed < 16) {
      // Hide loading UI
      if (this.loadingBar) this.loadingBar.visible = false;
      if (this.percentText) this.percentText.visible = false;
      if (this.pacmanSprite) this.pacmanSprite.visible = false;

      // Create SUCCESS text
      this.createSuccessText();
    }

    // Fade in SUCCESS
    if (this.successText) {
      this.successText.material.opacity = t;
    }

    // Fade out ENTERING
    if (this.enteringText) {
      this.enteringText.material.opacity = 1 - t;
    }

    if (t >= 1 && this.enteringText) {
      this.enteringText.visible = false;
    }
  }

  updateFadeText(step, t) {
    // Fade out SUCCESS
    if (this.successText) {
      this.successText.material.opacity = 1 - t;
    }

    if (t >= 1 && this.successText) {
      this.successText.visible = false;
    }
  }

  updateLookDown(step, t) {
    const pitch = this.lerp(step.fromPitch, step.toPitch, t);
    this.applyCameraRotation(-3.144, pitch);
  }

  updateFadeMaze(step, t) {
    if (!this.mazeModel) return;

    // Make materials transparent on first frame
    if (this.stepElapsed < 16) {
      this.mazeModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
        }
      });
    }

    // Fade out maze
    const opacity = 1 - t;
    this.mazeModel.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = opacity;
      }
    });

    // Hide completely at end
    if (t >= 1) {
      this.mazeModel.visible = false;
      console.log("🌑 Maze faded out - Full black screen");
    }
  }

  // ========== TEXT CREATION ==========

  createEnterTexts() {
    // Calculate position in front of camera (20 units forward)
    const forward = new THREE.Vector3(Math.sin(-3.144), 0, Math.cos(-3.144));
    const basePos = this.camera.position
      .clone()
      .add(forward.multiplyScalar(20));
    basePos.y = this.camera.position.y - 5; // Slightly below camera

    // "ENTER?" text
    this.enterText = TextSprite.create("ENTER?", {
      fontSize: 64,
      scale: 3,
    });
    this.enterText.position.copy(basePos);
    this.enterText.position.y += 3; // Above YES/NO
    this.enterText.material.opacity = 0;
    this.scene.add(this.enterText);

    // YES text
    this.yesText = TextSprite.create("YES", {
      fontSize: 48,
      scale: 2.5,
    });
    this.yesText.position.copy(basePos);
    this.yesText.position.x -= 5; // Left
    this.yesText.material.opacity = 0;
    this.scene.add(this.yesText);

    // NO text
    this.noText = TextSprite.create("NO", {
      fontSize: 48,
      scale: 2.5,
    });
    this.noText.position.copy(basePos);
    this.noText.position.x += 5; // Right
    this.noText.material.opacity = 0;
    this.scene.add(this.noText);

    console.log("📝 ENTER?, YES, NO texts created");
  }

  createEnteringText() {
    // Calculate position
    const forward = new THREE.Vector3(Math.sin(-3.244), 0, Math.cos(-3.244));
    const basePos = this.camera.position
      .clone()
      .add(forward.multiplyScalar(20));
    basePos.y = this.camera.position.y - 5;

    // "ENTERING THE WORLD OF PAC-MAN..." text
    this.enteringText = TextSprite.create("ENTERING THE WORLD OF PAC-MAN...", {
      fontSize: 40,
      scale: 2,
    });
    this.enteringText.position.copy(basePos);
    this.enteringText.position.y += 2;
    this.enteringText.material.opacity = 0;
    this.scene.add(this.enteringText);

    // Loading bar
    this.loadingBar = TextSprite.createLoadingBar(0, {
      width: 512,
      height: 64,
      scale: 1,
    });
    this.loadingBar.position.copy(basePos);
    this.loadingBar.position.y -= 1;
    this.loadingBar.material.opacity = 0;
    this.scene.add(this.loadingBar);

    // Percentage text
    this.percentText = TextSprite.create("0%", {
      fontSize: 32,
      scale: 1.5,
    });
    this.percentText.position.copy(basePos);
    this.percentText.position.y -= 3;
    this.percentText.material.opacity = 0;
    this.scene.add(this.percentText);

    // Pac-Man sprite
    this.pacmanSprite = TextSprite.createPacMan({
      size: 64,
      scale: 1.2,
    });
    this.pacmanSprite.position.copy(this.loadingBar.position);
    this.pacmanSprite.position.y += 0.5;
    this.pacmanSprite.material.opacity = 0;
    this.scene.add(this.pacmanSprite);

    console.log("📝 ENTERING text + loading bar created");
  }

  updatePercentText(percent) {
    if (!this.percentText) return;

    // Recreate text with new percentage
    const newText = TextSprite.create(`${percent}%`, {
      fontSize: 32,
      scale: 1.5,
    });

    // Copy position and opacity
    newText.position.copy(this.percentText.position);
    newText.material.opacity = this.percentText.material.opacity;

    // Replace
    this.scene.remove(this.percentText);
    this.percentText.material.map.dispose();
    this.percentText.material.dispose();

    this.percentText = newText;
    this.scene.add(this.percentText);
  }

  createSuccessText() {
    // Calculate position
    const forward = new THREE.Vector3(Math.sin(-3.244), 0, Math.cos(-3.244));
    const basePos = this.camera.position
      .clone()
      .add(forward.multiplyScalar(20));
    basePos.y = this.camera.position.y - 5;

    // "SUCCESS!" text
    this.successText = TextSprite.create("SUCCESS!", {
      fontSize: 64,
      scale: 4,
    });
    this.successText.position.copy(basePos);
    this.successText.material.opacity = 0;
    this.scene.add(this.successText);

    console.log("📝 SUCCESS! text created");
  }

  // ========== HELPERS ==========

  applyCameraRotation(yaw, pitch) {
    // Calculate look direction
    const lookX = Math.cos(pitch) * Math.sin(yaw);
    const lookY = Math.sin(pitch);
    const lookZ = Math.cos(pitch) * Math.cos(yaw);

    const lookAt = new THREE.Vector3(
      this.camera.position.x + lookX,
      this.camera.position.y + lookY,
      this.camera.position.z + lookZ
    );

    // Create camera matrix
    const worldUp = new THREE.Vector3(0, 1, 0);
    const z = new THREE.Vector3()
      .subVectors(this.camera.position, lookAt)
      .normalize();
    const x = new THREE.Vector3().crossVectors(worldUp, z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    const mat = new THREE.Matrix4().makeBasis(x, y, z);

    this.camera.quaternion.setFromRotationMatrix(mat);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ========== CLEANUP ==========

  dispose() {
    // Remove all text sprites
    const sprites = [
      this.enterText,
      this.yesText,
      this.noText,
      this.enteringText,
      this.loadingBar,
      this.percentText,
      this.pacmanSprite,
      this.successText,
    ];

    sprites.forEach((sprite) => {
      if (sprite) {
        this.scene.remove(sprite);
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
      }
    });

    console.log("🧹 Scene3 Cinematic disposed");
  }
}
