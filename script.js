document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const arena = document.getElementById('arena');
  const inputField = document.getElementById('input-field');
  const scoreCounter = document.getElementById('score-counter');
  const livesCounter = document.getElementById('lives-counter');
  const timeCounter = document.getElementById('time-counter');
  const gameOver = document.getElementById('game-over');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const restartButton = document.getElementById('restart-button');
  const playAgainButton = document.getElementById('play-again');
  const targetZone = document.getElementById('target-zone');

  // Game state
  let gameState = {
    isRunning: false,
    enemies: [],
    score: 0,
    lives: 0,
    startTime: null,
    elapsedTime: 0,
    difficultyLevel: 1,
    spawnInterval: 2000, // Initial spawn interval in ms
    minSpawnInterval: 500, // Minimum spawn interval in ms
    baseEnemySpeed: 5, // Base speed (seconds) for single character
    maxEnemySpeed: 15 // Max speed (seconds) for four characters
  };

  // Initialize game
  function initGame() {
    // Reset state
    gameState = {
      isRunning: true,
      enemies: [],
      score: 0,
      lives: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      difficultyLevel: 1,
      spawnInterval: 2000,
      minSpawnInterval: 500,
      baseEnemySpeed: 5,
      maxEnemySpeed: 15
    };

    // Clear arena
    const enemies = document.querySelectorAll('.enemy');
    enemies.forEach(enemy => enemy.remove());
    
    const trails = document.querySelectorAll('.enemy-trail');
    trails.forEach(trail => trail.remove());

    // Reset UI
    scoreCounter.textContent = '0';
    livesCounter.textContent = '0';
    timeCounter.textContent = '00:00';
    gameOver.classList.add('hidden');
    gameOver.classList.remove('flex');
    
    // Focus input field
    inputField.value = '';
    inputField.focus();

    // Start game loops
    gameLoops();
  }

  // Main game loops
  function gameLoops() {
    if (!gameState.isRunning) return;

    const gameLoop = setInterval(() => {
      if (!gameState.isRunning) {
        clearInterval(gameLoop);
        return;
      }

      // Update time
      gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
      const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
      const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
      timeCounter.textContent = `${minutes}:${seconds}`;

      // Increase difficulty
      updateDifficulty();

      // Move enemies
      moveEnemies();
    }, 16); // ~60fps

    // Enemy spawning loop
    spawnEnemyLoop();
  }

  // Spawn enemy loop with dynamic timing
  function spawnEnemyLoop() {
    if (!gameState.isRunning) return;
    
    spawnEnemy();
    
    // Calculate next spawn time based on difficulty
    const nextSpawnTime = Math.max(
      gameState.minSpawnInterval,
      gameState.spawnInterval - (gameState.difficultyLevel * 100)
    );
    
    setTimeout(spawnEnemyLoop, nextSpawnTime);
  }

  // Update game difficulty based on elapsed time
  function updateDifficulty() {
    gameState.difficultyLevel = 1 + Math.floor(gameState.elapsedTime / 10);
    
    // Adjust spawn interval based on difficulty
    gameState.spawnInterval = Math.max(
      gameState.minSpawnInterval,
      2000 - (gameState.difficultyLevel * 120)
    );
  }

  // Spawn a new enemy
  function spawnEnemy() {
    // Weighted selection for character length
    const weightDistribution = [
      { length: 1, weight: 4 },
      { length: 2, weight: 5 },
      { length: 3, weight: 3 },
      { length: 4, weight: 2 }
    ];
    
    // Adjust weights based on difficulty
    if (gameState.difficultyLevel > 3) {
      weightDistribution[0].weight = 5; // More single characters
      weightDistribution[1].weight = 6; // More two-character words
    }
    
    if (gameState.difficultyLevel > 7) {
      weightDistribution[0].weight = 6; // Even more single characters
      weightDistribution[2].weight = 4; // More three-character words
      weightDistribution[3].weight = 3; // More four-character words
    }
    
    // Create weighted array
    const weightedLengths = [];
    weightDistribution.forEach(item => {
      for (let i = 0; i < item.weight; i++) {
        weightedLengths.push(item.length);
      }
    });
    
    // Select random length based on weights
    const charLength = weightedLengths[Math.floor(Math.random() * weightedLengths.length)];
    
    // Get a word from the appropriate bank
    const wordsOfLength = wordBank[charLength];
    if (!wordsOfLength || wordsOfLength.length === 0) {
      console.error(`No words found for length ${charLength}`);
      return;
    }
    
    const word = wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)];
    
    // Calculate speed (single character: 5s, four characters: 15s)
    const baseSpeed = gameState.baseEnemySpeed;
    const maxSpeed = gameState.maxEnemySpeed;
    const speedRange = maxSpeed - baseSpeed;
    
    // Linear interpolation for speed based on character length
    const speed = baseSpeed + ((charLength - 1) / 3) * speedRange;
    
    // Apply difficulty scaling to speed
    const difficultyFactor = 1 + (gameState.difficultyLevel * 0.1);
    const finalSpeed = speed / difficultyFactor;
    
    // Randomly select side (left or right)
    const side = Math.random() < 0.5 ? 'left' : 'right';
    
    // Calculate starting position
    const arenaRect = arena.getBoundingClientRect();
    const startX = side === 'left' ? 0 : arenaRect.width;
    const startY = 80 + Math.random() * (arenaRect.height - 160);
    
    // Target is center of arena
    const targetX = arenaRect.width / 2;
    const targetY = arenaRect.height / 2;
    
    // Create enemy element
    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    enemy.textContent = word;
    enemy.style.left = `${startX}px`;
    enemy.style.top = `${startY}px`;
    
    // Create trail effect
    const trail = document.createElement('div');
    trail.className = 'enemy-trail';
    
    // Calculate trail angle
    const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
    
    // Position and rotate trail
    trail.style.left = `${startX}px`;
    trail.style.top = `${startY}px`;
    trail.style.width = `${distance}px`;
    trail.style.transform = `rotate(${angle}deg)`;
    
    // Add enemy and trail to DOM
    arena.appendChild(trail);
    arena.appendChild(enemy);
    
    // Create enemy object
    const enemyObj = {
      element: enemy,
      trail: trail,
      word: word,
      startX: startX,
      startY: startY,
      targetX: targetX,
      targetY: targetY,
      startTime: Date.now(),
      duration: finalSpeed * 1000, // Convert to milliseconds
      progress: 0,
      destroyed: false,
      charLength: charLength
    };
    
    gameState.enemies.push(enemyObj);
  }

  // Move all enemies
  function moveEnemies() {
    const now = Date.now();
    const centerX = arena.clientWidth / 2;
    const centerY = arena.clientHeight / 2;
    const targetRadius = targetZone.clientWidth / 2;
    
    gameState.enemies.forEach(enemy => {
      if (enemy.destroyed) return;
      
      // Calculate progress (0 to 1)
      enemy.progress = Math.min(1, (now - enemy.startTime) / enemy.duration);
      
      // Calculate current position using easeInOut
      const t = enemy.progress;
      // Using cubic easing for smooth movement
      const eased = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const currentX = enemy.startX + (enemy.targetX - enemy.startX) * eased;
      const currentY = enemy.startY + (enemy.targetY - enemy.startY) * eased;
      
      // Update enemy position
      enemy.element.style.left = `${currentX}px`;
      enemy.element.style.top = `${currentY}px`;
      
      // Update trail opacity based on progress
      if (enemy.trail) {
        enemy.trail.style.opacity = Math.max(0, 0.3 - enemy.progress * 0.3);
      }
      
      // Check if enemy reached the target
      const distanceToCenter = Math.sqrt(
        Math.pow(currentX - centerX, 2) + 
        Math.pow(currentY - centerY, 2)
      );
      
      if (distanceToCenter <= targetRadius && enemy.progress >= 1 && !enemy.destroyed) {
        // Enemy reached target
        enemy.destroyed = true;
        enemy.element.classList.add('enemy-failed');
        
        // Increment lives counter
        gameState.lives++;
        livesCounter.textContent = gameState.lives;
        
        // Shake the input field
        inputField.classList.add('field-shake');
        setTimeout(() => {
          inputField.classList.remove('field-shake');
        }, 400);
        
        // Remove enemy and trail after animation
        setTimeout(() => {
          if (enemy.element.parentNode) {
            enemy.element.remove();
          }
          
          if (enemy.trail && enemy.trail.parentNode) {
            enemy.trail.remove();
          }
        }, 600);
        
        // Check game over condition
        if (gameState.lives >= 10) {
          endGame();
        }
      }
    });
    
    // Clean up destroyed enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
      if (enemy.destroyed && !enemy.element.parentNode) {
        return false;
      }
      return true;
    });
  }

  // Handle input submission
  function handleInput(value) {
    if (!value.trim()) return;
    
    // Find matching enemy
    let matchFound = false;
    
    // Sort enemies by progress to prioritize enemies closer to the center
    const sortedEnemies = [...gameState.enemies]
      .filter(enemy => !enemy.destroyed)
      .sort((a, b) => b.progress - a.progress);
    
    for (const enemy of sortedEnemies) {
      if (enemy.word === value.trim()) {
        // Mark enemy as destroyed
        enemy.destroyed = true;
        enemy.element.classList.add('enemy-matched');
        
        // Add destroy animation
        setTimeout(() => {
          enemy.element.classList.add('enemy-destroyed');
        }, 100);
        
        // Remove enemy and trail after animation
        setTimeout(() => {
          if (enemy.element.parentNode) {
            enemy.element.remove();
          }
          
          if (enemy.trail && enemy.trail.parentNode) {
            enemy.trail.remove();
          }
        }, 600);
        
        // Update score (more points for longer words)
        const basePoints = 10;
        const points = basePoints * enemy.charLength * enemy.charLength; // Square for exponential scoring
        
        // Bonus points for destroying enemies closer to center
        const proximityBonus = Math.floor(enemy.progress * 10);
        const totalPoints = points + proximityBonus;
        
        gameState.score += totalPoints;
        scoreCounter.textContent = gameState.score;
        
        matchFound = true;
        break;
      }
    }
    
    // Shake input if no match found
    if (!matchFound) {
      inputField.classList.add('field-shake');
      setTimeout(() => {
        inputField.classList.remove('field-shake');
      }, 400);
    }
    
    // Clear input field
    inputField.value = '';
  }

  // End game
  function endGame() {
    gameState.isRunning = false;
    
    // Update final score and time
    finalScore.textContent = gameState.score;
    
    const minutes = Math.floor(gameState.elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (gameState.elapsedTime % 60).toString().padStart(2, '0');
    finalTime.textContent = `${minutes}:${seconds}`;
    
    // Show game over screen
    gameOver.classList.remove('hidden');
    gameOver.classList.add('flex');
  }

  // Event listeners
  inputField.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && gameState.isRunning) {
      e.preventDefault();
      handleInput(inputField.value);
    }
  });

  restartButton.addEventListener('click', initGame);
  playAgainButton.addEventListener('click', initGame);

  // Make sure input field stays focused during gameplay
  document.addEventListener('click', (e) => {
    if (gameState.isRunning && e.target !== inputField) {
      inputField.focus();
    }
  });

  // Start game on load
  initGame();
});
