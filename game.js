/**
 * Main Game Engine for Dino Runner
 * Handles game loop, physics, state, collisions, obstacles, day/night cycle, and rendering.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Initialize Audio & Sprites
  const audio = window.soundManager;
  const sprites = new window.SpriteCache();

  // --- Constants & Config ---
  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 300;
  const GROUND_Y = 240;

  const GRAVITY = 0.65;
  const JUMP_FORCE = -12.5;
  const FAST_DROP_FORCE = 1.3;
  const INITIAL_SPEED = 6.5;
  const MAX_SPEED = 14.0;
  const SPEED_ACCELERATION = 0.0012; // Gradual speed increase

  // Safe LocalStorage helpers
  function safeStorageGet(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeStorageSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  function safeStorageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  // --- Game State ---
  const STATE = {
    START: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAMEOVER: 3
  };

  let gameState = STATE.START;
  let gameSpeed = INITIAL_SPEED;
  let score = 0;
  let hiScore = parseInt(safeStorageGet('dino_hi_score', '0'), 10);
  let distanceRan = 0;

  // 100-pt milestone flash effect
  let milestoneFlashTimer = 0;
  let lastMilestone = 0;

  // Day/Night cycle
  let isNight = false;
  let dayNightTransition = 0; // 0 = day, 1 = night
  const CYCLE_INTERVAL = 700; // switch every 700 points
  const NIGHT_DURATION = 280; // night lasts 280 points

  // Horizon & Ground texture dots
  let groundOffset = 0;
  const groundDots = [];
  for (let i = 0; i < 60; i++) {
    groundDots.push({
      x: Math.random() * CANVAS_WIDTH * 2,
      y: GROUND_Y + 3 + Math.random() * 25,
      size: Math.random() > 0.6 ? 2 : 1
    });
  }

  // Twinkling stars for night mode
  const stars = [];
  for (let i = 0; i < 20; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: 20 + Math.random() * 110,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2
    });
  }

  // --- Dino Character Object ---
  const dino = {
    x: 65,
    y: GROUND_Y - 48,
    width: 48,
    height: 48,
    vy: 0,
    isGrounded: true,
    isJumping: false,
    isDucking: false,
    duckWidth: 66,
    duckHeight: 30,
    animTimer: 0,
    animFrame: 0,
    stepTimer: 0,

    reset() {
      this.y = GROUND_Y - 48;
      this.vy = 0;
      this.isGrounded = true;
      this.isJumping = false;
      this.isDucking = false;
      this.animTimer = 0;
      this.animFrame = 0;
      this.stepTimer = 0;
    },

    jump() {
      if (this.isGrounded) {
        this.vy = JUMP_FORCE;
        this.isGrounded = false;
        this.isJumping = true;
        audio.playJump();
      }
    },

    duck(isDucking) {
      if (this.isDucking !== isDucking) {
        if (isDucking) audio.playDuck();
      }
      this.isDucking = isDucking;
      if (!this.isGrounded && isDucking) {
        // Fast-drop if duck is pressed in mid-air
        this.vy += FAST_DROP_FORCE * 2;
      }
    },

    update(dt) {
      // Physics
      if (!this.isGrounded) {
        let currentGravity = GRAVITY;
        if (this.isDucking) {
          currentGravity += FAST_DROP_FORCE;
        }
        this.vy += currentGravity * dt;
        this.y += this.vy * dt;

        const normalGroundY = GROUND_Y - (this.isDucking ? this.duckHeight : this.height);
        if (this.y >= normalGroundY) {
          this.y = normalGroundY;
          this.vy = 0;
          this.isGrounded = true;
          this.isJumping = false;
        }
      } else {
        this.y = GROUND_Y - (this.isDucking ? this.duckHeight : this.height);

        // Footstep sound while running
        this.stepTimer += dt;
        if (this.stepTimer > 16) {
          this.stepTimer = 0;
          audio.playStep();
        }
      }

      // Animation frame toggle
      this.animTimer += dt;
      const animSpeed = Math.max(4, 9 - gameSpeed * 0.3);
      if (this.animTimer > animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    },

    getHitboxes() {
      // Precise multi-box collision detection
      const boxes = [];
      if (this.isDucking) {
        // Ducking: lower, wider profile
        boxes.push({
          x: this.x + 36,
          y: this.y + 4,
          w: 26,
          h: 24
        }); // head
        boxes.push({
          x: this.x + 4,
          y: this.y + 12,
          w: 48,
          h: 18
        }); // body & tail
      } else {
        // Standing / Running
        boxes.push({
          x: this.x + 24,
          y: this.y + 2,
          w: 22,
          h: 18
        }); // head & snout
        boxes.push({
          x: this.x + 12,
          y: this.y + 18,
          w: 26,
          h: 16
        }); // chest & body
        boxes.push({
          x: this.x + 16,
          y: this.y + 34,
          w: 18,
          h: 14
        }); // legs
      }
      return boxes;
    },

    draw(ctx, isNight) {
      let spriteKey = 'dinoStand';

      if (gameState === STATE.GAMEOVER) {
        spriteKey = 'dinoDead';
      } else if (!this.isGrounded) {
        spriteKey = this.isDucking ? (this.animFrame === 0 ? 'dinoDuck1' : 'dinoDuck2') : 'dinoStand';
      } else if (gameState === STATE.PLAYING) {
        if (this.isDucking) {
          spriteKey = this.animFrame === 0 ? 'dinoDuck1' : 'dinoDuck2';
        } else {
          spriteKey = this.animFrame === 0 ? 'dinoRun1' : 'dinoRun2';
        }
      }

      const img = sprites.get(spriteKey, isNight);
      if (img) {
        ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y));
      }
    }
  };

  // --- Obstacle Manager ---
  class Obstacle {
    constructor(type, x) {
      this.type = type;
      this.x = x;
      this.animTimer = 0;
      this.animFrame = 0;

      // Set dimensions and Y based on type
      switch (type) {
        case 'cactusS1':
          this.w = 18;
          this.h = 32;
          this.y = GROUND_Y - this.h;
          break;
        case 'cactusS2':
          this.w = 34;
          this.h = 32;
          this.y = GROUND_Y - this.h;
          break;
        case 'cactusS3':
          this.w = 50;
          this.h = 32;
          this.y = GROUND_Y - this.h;
          break;
        case 'cactusL1':
          this.w = 26;
          this.h = 50;
          this.y = GROUND_Y - this.h;
          break;
        case 'cactusL2':
          this.w = 50;
          this.h = 50;
          this.y = GROUND_Y - this.h;
          break;
        case 'birdLow':
          this.w = 44;
          this.h = 28;
          this.y = GROUND_Y - 28; // must jump over
          break;
        case 'birdMid':
          this.w = 44;
          this.h = 28;
          this.y = GROUND_Y - 58; // must duck under
          break;
        case 'birdHigh':
          this.w = 44;
          this.h = 28;
          this.y = GROUND_Y - 95; // safe overhead
          break;
      }
    }

    update(dt, speed) {
      this.x -= speed * dt;

      // Animate wings if pterodactyl
      if (this.type.startsWith('bird')) {
        this.animTimer += dt;
        if (this.animTimer > 8) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % 2;
        }
      }
    }

    getHitbox() {
      // Inset by 4px horizontally for forgiving, fair collision
      return {
        x: this.x + 4,
        y: this.y + 3,
        w: Math.max(6, this.w - 8),
        h: Math.max(6, this.h - 4)
      };
    }

    draw(ctx, isNight) {
      let spriteKey = this.type;
      if (this.type.startsWith('bird')) {
        spriteKey = this.animFrame === 0 ? 'bird1' : 'bird2';
      }

      const img = sprites.get(spriteKey, isNight);
      if (img) {
        ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y));
      }
    }
  }

  let obstacles = [];
  let nextObstacleDistance = 0;

  function resetObstacles() {
    obstacles = [];
    nextObstacleDistance = 500;
  }

  function spawnObstacle() {
    const obstacleTypes = ['cactusS1', 'cactusS2', 'cactusS3', 'cactusL1', 'cactusL2'];

    // Birds unlock after score 320
    if (score > 320) {
      obstacleTypes.push('birdLow', 'birdMid');
      if (score > 600) {
        obstacleTypes.push('birdHigh');
      }
    }

    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    obstacles.push(new Obstacle(type, CANVAS_WIDTH + 20));

    // Dynamic obstacle spacing based on speed
    const minGap = 290 + gameSpeed * 17;
    const maxGap = minGap + 260;
    nextObstacleDistance = minGap + Math.random() * (maxGap - minGap);
  }

  // --- Clouds Manager ---
  class Cloud {
    constructor(x) {
      this.x = x || CANVAS_WIDTH + Math.random() * 200;
      this.y = 35 + Math.random() * 85;
      this.speed = 0.8 + Math.random() * 0.5;
    }

    update(dt) {
      this.x -= this.speed * dt;
    }

    draw(ctx, isNight) {
      const img = sprites.get('cloud', isNight);
      if (img) {
        ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y));
      }
    }
  }

  let clouds = [];
  function initClouds() {
    clouds = [
      new Cloud(100),
      new Cloud(350),
      new Cloud(600),
      new Cloud(820)
    ];
  }
  initClouds();

  // --- Collision Detection Helper ---
  function checkCollision(dino, obstacle) {
    const dinoBoxes = dino.getHitboxes();
    const obsBox = obstacle.getHitbox();

    for (const d of dinoBoxes) {
      if (
        d.x < obsBox.x + obsBox.w &&
        d.x + d.w > obsBox.x &&
        d.y < obsBox.y + obsBox.h &&
        d.y + d.h > obsBox.y
      ) {
        return true;
      }
    }
    return false;
  }

  // --- Game Lifecycle ---
  function startGame() {
    gameState = STATE.PLAYING;
    gameSpeed = INITIAL_SPEED;
    score = 0;
    distanceRan = 0;
    lastMilestone = 0;
    milestoneFlashTimer = 0;
    dino.reset();
    resetObstacles();
    audio.init();
    audio.playStart();
  }

  function gameOver() {
    gameState = STATE.GAMEOVER;
    audio.playHit();

    if (score > hiScore) {
      hiScore = Math.floor(score);
      safeStorageSet('dino_hi_score', hiScore.toString());
      updateHUD();
    }
  }

  function restartGame() {
    startGame();
  }

  function togglePause() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
    }
  }

  // --- HUD Elements & Buttons ---
  const sfxBtn = document.getElementById('btn-sfx');
  const musicBtn = document.getElementById('btn-music');
  const jumpBtn = document.getElementById('touch-jump');
  const duckBtn = document.getElementById('touch-duck');
  const resetScoreBtn = document.getElementById('btn-reset-score');

  function updateAudioButtons() {
    if (sfxBtn) {
      sfxBtn.innerHTML = audio.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      sfxBtn.classList.toggle('active', audio.sfxEnabled);
    }
    if (musicBtn) {
      musicBtn.innerHTML = audio.musicEnabled ? '🎵 MUSIC: ON' : '🎵 MUSIC: OFF';
      musicBtn.classList.toggle('active', audio.musicEnabled);
    }
  }

  if (sfxBtn) {
    sfxBtn.addEventListener('click', (e) => {
      e.blur();
      audio.toggleSFX();
      updateAudioButtons();
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.blur();
      audio.toggleMusic();
      updateAudioButtons();
    });
  }

  if (resetScoreBtn) {
    resetScoreBtn.addEventListener('click', (e) => {
      e.blur();
      if (confirm('Reset high score to 0?')) {
        hiScore = 0;
        safeStorageRemove('dino_hi_score');
        updateHUD();
      }
    });
  }

  audio.onStateChange = updateAudioButtons;
  updateAudioButtons();

  // Mobile / On-screen buttons
  if (jumpBtn) {
    const handleJumpPress = (e) => {
      e.preventDefault();
      audio.init();
      if (gameState === STATE.START || gameState === STATE.GAMEOVER) {
        restartGame();
      } else if (gameState === STATE.PLAYING) {
        dino.jump();
      }
    };
    jumpBtn.addEventListener('touchstart', handleJumpPress, { passive: false });
    jumpBtn.addEventListener('mousedown', handleJumpPress);
  }

  if (duckBtn) {
    const startDuck = (e) => {
      e.preventDefault();
      audio.init();
      if (gameState === STATE.PLAYING) {
        dino.duck(true);
      }
    };
    const endDuck = (e) => {
      e.preventDefault();
      dino.duck(false);
    };
    duckBtn.addEventListener('touchstart', startDuck, { passive: false });
    duckBtn.addEventListener('touchend', endDuck, { passive: false });
    duckBtn.addEventListener('mousedown', startDuck);
    duckBtn.addEventListener('mouseup', endDuck);
    duckBtn.addEventListener('mouseleave', endDuck);
  }

  // --- Input Listeners ---
  const keysDown = {};

  window.addEventListener('keydown', (e) => {
    audio.init();

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (gameState === STATE.START || gameState === STATE.GAMEOVER) {
        restartGame();
      } else if (gameState === STATE.PLAYING) {
        dino.jump();
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      if (gameState === STATE.PLAYING) {
        dino.duck(true);
      }
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      audio.toggleSFX();
      updateAudioButtons();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      dino.duck(false);
    }
  });

  // Canvas click / tap to start or jump
  canvas.addEventListener('click', (e) => {
    audio.init();
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const clickY = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    if (gameState === STATE.START || gameState === STATE.GAMEOVER) {
      restartGame();
    } else if (gameState === STATE.PLAYING) {
      dino.jump();
    }
  });

  // Prevent double tap zoom on mobile
  canvas.addEventListener('touchstart', (e) => {
    audio.init();
    if (gameState === STATE.START || gameState === STATE.GAMEOVER) {
      e.preventDefault();
      restartGame();
    } else if (gameState === STATE.PLAYING) {
      e.preventDefault();
      dino.jump();
    }
  }, { passive: false });

  // --- Formatting Helpers ---
  function formatScore(n) {
    const s = Math.floor(n).toString();
    return s.padStart(5, '0');
  }

  function updateHUD() {
    // HUD is rendered directly onto canvas for pixel-perfect arcade look!
  }

  // --- Main Game Loop ---
  let lastTimestamp = performance.now();

  function gameLoop(timestamp) {
    const elapsed = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Normalizing delta time around 60fps (16.67ms = 1.0)
    const dt = Math.min(elapsed / 16.67, 2.5);

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    // Update day / night cycle based on score
    const currentCyclePos = Math.floor(score) % (CYCLE_INTERVAL + NIGHT_DURATION);
    isNight = currentCyclePos >= CYCLE_INTERVAL;

    if (gameState === STATE.PLAYING) {
      // Accelerate speed gradually
      if (gameSpeed < MAX_SPEED) {
        gameSpeed += SPEED_ACCELERATION * dt;
      }

      // Update score and distance
      distanceRan += gameSpeed * dt;
      score = distanceRan * 0.025;

      // Milestone 100-point double chime & flash
      const currentHundred = Math.floor(score / 100);
      if (currentHundred > lastMilestone) {
        lastMilestone = currentHundred;
        milestoneFlashTimer = 60; // flash score for ~1 sec
        audio.playMilestone();
      }

      if (milestoneFlashTimer > 0) {
        milestoneFlashTimer -= dt;
      }

      // Update Dino
      dino.update(dt);

      // Scroll Ground
      groundOffset = (groundOffset + gameSpeed * dt) % CANVAS_WIDTH;

      // Obstacle management
      nextObstacleDistance -= gameSpeed * dt;
      if (nextObstacleDistance <= 0) {
        spawnObstacle();
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update(dt, gameSpeed);

        // Check Collision
        if (checkCollision(dino, obs)) {
          gameOver();
          break;
        }

        // Remove off-screen obstacles
        if (obs.x + obs.w < -50) {
          obstacles.splice(i, 1);
        }
      }

      // Cloud management
      for (const cloud of clouds) {
        cloud.update(dt);
        if (cloud.x < -60) {
          cloud.x = CANVAS_WIDTH + Math.random() * 150;
          cloud.y = 35 + Math.random() * 85;
        }
      }
    } else if (gameState === STATE.START) {
      // Idle animation
      dino.animTimer += dt;
      if (dino.animTimer > 15) {
        dino.animTimer = 0;
        dino.animFrame = (dino.animFrame + 1) % 2;
      }
    }
  }

  function render() {
    // Background color based on Day / Night
    const bgColor = isNight ? '#202124' : '#f7f7f7';
    const textColor = isNight ? '#e0e0e0' : '#535353';
    const mutedTextColor = isNight ? '#888888' : '#9e9e9e';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Night Mode: Draw Moon and Twinkling Stars
    if (isNight) {
      // Moon
      const moonImg = sprites.get('moon', true);
      if (moonImg) {
        ctx.drawImage(moonImg, CANVAS_WIDTH - 150, 40);
      }

      // Stars
      const starImg = sprites.get('star', true);
      if (starImg) {
        const time = performance.now() * 0.003;
        for (const s of stars) {
          const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed * 100 + s.phase));
          ctx.globalAlpha = alpha;
          ctx.drawImage(starImg, Math.floor(s.x), Math.floor(s.y));
        }
        ctx.globalAlpha = 1.0;
      }
    }

    // Clouds
    for (const cloud of clouds) {
      cloud.draw(ctx, isNight);
    }

    // Ground Horizon Line
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Ground bumps and pixel texture
    ctx.fillStyle = textColor;
    for (const dot of groundDots) {
      const renderX = (dot.x - groundOffset * 0.8 + CANVAS_WIDTH * 4) % (CANVAS_WIDTH + 40) - 20;
      ctx.fillRect(Math.floor(renderX), Math.floor(dot.y), dot.size * 2, dot.size);
    }

    // Obstacles
    for (const obs of obstacles) {
      obs.draw(ctx, isNight);
    }

    // Dino Character
    dino.draw(ctx, isNight);

    // --- HUD: Scores & Status ---
    ctx.font = '16px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'right';

    // High score label
    if (hiScore > 0) {
      ctx.fillStyle = mutedTextColor;
      ctx.fillText(`HI ${formatScore(hiScore)}  `, CANVAS_WIDTH - 110, 36);
    }

    // Current score (with flash effect on milestones)
    const shouldFlash = milestoneFlashTimer > 0 && Math.floor(milestoneFlashTimer / 8) % 2 === 0;
    if (!shouldFlash) {
      ctx.fillStyle = textColor;
      ctx.fillText(formatScore(score), CANVAS_WIDTH - 25, 36);
    }

    // Day / Night indicator icon
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillText(isNight ? '🌙' : '☀️', 25, 36);

    // --- Overlays & State Prompts ---
    if (gameState === STATE.START) {
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = '16px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('PRESS SPACE OR TAP TO RUN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);

      ctx.fillStyle = mutedTextColor;
      ctx.font = '11px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('↑ JUMP   ↓ DUCK   P PAUSE   M AUDIO', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    } else if (gameState === STATE.PAUSED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('P A U S E D', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

      ctx.fillStyle = '#e0e0e0';
      ctx.font = '12px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('PRESS P TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    } else if (gameState === STATE.GAMEOVER) {
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = '20px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('G A M E   O V E R', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

      // Draw Restart Icon
      const restartImg = sprites.get('restartIcon', isNight);
      if (restartImg) {
        ctx.drawImage(restartImg, CANVAS_WIDTH / 2 - 18, CANVAS_HEIGHT / 2 - 5);
      }

      ctx.fillStyle = mutedTextColor;
      ctx.font = '11px "Press Start 2P", "Courier New", monospace';
      ctx.fillText('PRESS SPACE OR TAP TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  }

  // Start animation loop
  requestAnimationFrame(gameLoop);
});
