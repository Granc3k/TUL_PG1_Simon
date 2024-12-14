// made by Martin "Granc3k" Šimon

// Env variables
let camera, scene, renderer, controls;
let paddle1, paddle2, ball;
let scorePlayer1 = 0;
let scorePlayer2 = 0;
let ballDirection = { x: 1, y: 1 };
let ballSpeed = 0.03;
let ballSpeedIncrement = 0.005; // Zrychlení míčku při každém odrazu
let isPaused = false; // state pauzy

// Sound efekty
let paddleHitSound = new Audio("sounds/bounce.mp3");
let winSound = new Audio("sounds/win.mp3");

// Herní parametry z URL
let gameMode = window.gameModeParam || "1v1";
let scoreLimit = parseInt(window.scoreLimitParam) || 10;

// Init scény
function init() {
  // Creatnutí kamery
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 6;

  // Creatnutí scény
  scene = new THREE.Scene();

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  controls = new THREE.TrackballControls(camera, renderer.domElement);

  // Create game prvků
  createGameElements();

  // Show skóre
  addScoreDisplay();
  addBackButton();

  // Responzivita
  window.addEventListener("resize", onWindowResize, false);

  // Control kláves
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function createGameElements() {
  // Hrací plocha
  const tableGeometry = new THREE.PlaneGeometry(12, 8);
  const tableMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    side: THREE.DoubleSide,
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.rotation.x = 0;
  table.position.z = -2; // Posunutí plochy dozadu
  scene.add(table);

  // Pálky
  const paddleGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
  const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
  paddle1.position.set(-4.5, 0, 0);
  scene.add(paddle1);

  paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
  paddle2.position.set(4.5, 0, 0);
  scene.add(paddle2);

  // Míček
  const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 0, 0);
  scene.add(ball);
}

function addScoreDisplay() {
  // Div pro skóre
  const scoreDiv = document.createElement("div");
  scoreDiv.id = "score";
  scoreDiv.style.position = "absolute";
  scoreDiv.style.top = "10px";
  scoreDiv.style.left = "50%";
  scoreDiv.style.transform = "translateX(-50%)";
  scoreDiv.style.color = "white";
  scoreDiv.style.fontSize = "24px";
  scoreDiv.style.fontFamily = "Arial, sans-serif";
  scoreDiv.style.zIndex = 100;
  scoreDiv.innerHTML = `Player 1: ${scorePlayer1} | Player 2: ${scorePlayer2}`;
  document.body.appendChild(scoreDiv);
}

function addBackButton() {
  // Tlačítko pro návrat do menu
  const backButton = document.createElement("button");
  backButton.id = "backButton";
  backButton.innerText = "Zpět do menu";
  backButton.style.position = "absolute";
  backButton.style.top = "100px";
  backButton.style.left = "50%";
  backButton.style.transform = "translateX(-50%)";
  backButton.style.padding = "10px 20px";
  backButton.style.fontSize = "16px";
  backButton.style.fontFamily = "Arial, sans-serif";
  backButton.style.display = "none";
  backButton.style.zIndex = 100;
  backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.body.appendChild(backButton);
}

function togglePauseDisplay(showPause) {
  // Pauza po zmáčknutí ESC
  let pauseDiv = document.getElementById("pause");
  if (!pauseDiv) {
    pauseDiv = document.createElement("div");
    pauseDiv.id = "pause";
    pauseDiv.style.position = "absolute";
    pauseDiv.style.top = "50px";
    pauseDiv.style.left = "50%";
    pauseDiv.style.transform = "translateX(-50%)";
    pauseDiv.style.color = "white";
    pauseDiv.style.fontSize = "24px";
    pauseDiv.style.fontFamily = "Arial, sans-serif";
    pauseDiv.style.zIndex = 100;
    document.body.appendChild(pauseDiv);
  }
  pauseDiv.innerHTML = showPause ? "Pauza" : "";

  const backButton = document.getElementById("backButton");
  backButton.style.display = showPause ? "block" : "none";
}

function updateScore() {
  // Update skóre
  const scoreDiv = document.getElementById("score");
  scoreDiv.innerHTML = `Player 1: ${scorePlayer1} | Player 2: ${scorePlayer2}`;
}

function onWindowResize() {
  // Responzivita v 3D spacu
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event) {
  // Handler pro klávesy
  if (event.key === "w") paddle1MovingUp = true;
  if (event.key === "s") paddle1MovingDown = true;
  if (gameMode === "1v1" && event.key === "ArrowUp") paddle2MovingUp = true;
  if (gameMode === "1v1" && event.key === "ArrowDown") paddle2MovingDown = true;
  if (event.key === "Escape") togglePause();
}

function handleKeyUp(event) {
  // Handler pro klávesy
  if (event.key === "w") paddle1MovingUp = false;
  if (event.key === "s") paddle1MovingDown = false;
  if (gameMode === "1v1" && event.key === "ArrowUp") paddle2MovingUp = false;
  if (gameMode === "1v1" && event.key === "ArrowDown")
    paddle2MovingDown = false;
}

function togglePause() {
  // Pauza
  isPaused = !isPaused;
  togglePauseDisplay(isPaused);
  if (!isPaused) animate(); // Restart animace, pokud hra pokračuje
}

let paddle1MovingUp = false;
let paddle1MovingDown = false;
let paddle2MovingUp = false;
let paddle2MovingDown = false;

function movePaddles() {
  // Pohyb pálkami
  if (paddle1MovingUp && paddle1.position.y < 2.5) paddle1.position.y += 0.1;
  if (paddle1MovingDown && paddle1.position.y > -2.5) paddle1.position.y -= 0.1;
  if (gameMode === "1v1") {
    if (paddle2MovingUp && paddle2.position.y < 2.5) paddle2.position.y += 0.1;
    if (paddle2MovingDown && paddle2.position.y > -2.5)
      paddle2.position.y -= 0.1;
  } else if (gameMode === "1vAI") {
    moveAI();
  }
}

function moveAI() {
  // Pohyb AI
  const speed = 0.03; // Speed pro pohybování AI pálky
  const reactionOffset = 0.3; // AI bude reagovat s určitou tolerancí

  if (ball.position.y > paddle2.position.y + reactionOffset) {
    paddle2.position.y += speed;
  } else if (ball.position.y < paddle2.position.y - reactionOffset) {
    paddle2.position.y -= speed;
  }
}

function animate() {
  if (isPaused) return; // If pauza, nevykresluje se
  requestAnimationFrame(animate);
  controls.update();
  movePaddles();
  moveBall();
  renderer.render(scene, camera);
  updateScore();
  checkGameEnd();
}

function moveBall() {
  ball.position.x += ballSpeed * ballDirection.x;
  ball.position.y += ballSpeed * ballDirection.y;

  // Kontrola kolizí s hranami
  if (ball.position.y > 2.5 || ball.position.y < -2.5) {
    ballDirection.y *= -1;
  }

  // Kolize s pálkami
  if (
    ball.position.x < paddle1.position.x + 0.3 &&
    ball.position.x > paddle1.position.x &&
    ball.position.y < paddle1.position.y + 0.6 &&
    ball.position.y > paddle1.position.y - 0.6
  ) {
    ballDirection.x *= -1;
    ball.position.x = paddle1.position.x + 0.31;
    ballSpeed += ballSpeedIncrement; // Zrychlení míčku
    paddleHitSound.play(); // Zvuk při odrazu od levé pálky
  }

  if (
    ball.position.x > paddle2.position.x - 0.3 &&
    ball.position.x < paddle2.position.x &&
    ball.position.y < paddle2.position.y + 0.6 &&
    ball.position.y > paddle2.position.y - 0.6
  ) {
    ballDirection.x *= -1;
    ball.position.x = paddle2.position.x - 0.31;
    ballSpeed += ballSpeedIncrement; // Zrychlení míčku
    paddleHitSound.play(); // Zvuk při odrazu od pravé pálky
  }

  // Skórování
  if (ball.position.x < -5) {
    scorePlayer2++;
    updateScore();
    resetBall();
  } else if (ball.position.x > 5) {
    scorePlayer1++;
    updateScore();
    resetBall();
  }
}

function resetBall() {
  ball.position.set(0, 0, 0);
  ballDirection.x *= -1;
  ballSpeed = 0.03; // Reset rychlosti míčku po skórování
}

function checkGameEnd() {
  if (scorePlayer1 >= scoreLimit) {
    winSound.play(); // Zvuk při vítězství
    alert("Player 1 wins!");
    window.location.href = "index.html"; // Přesměrování na menu
  } else if (scorePlayer2 >= scoreLimit) {
    winSound.play(); // Zvuk při vítězství
    alert("Player 2 wins!");
    window.location.href = "index.html";
  }
}

function resetGame() {
  // Reset hry
  scorePlayer1 = 0;
  scorePlayer2 = 0;
  resetBall();
}

// Spuštění hry
init();
animate();
