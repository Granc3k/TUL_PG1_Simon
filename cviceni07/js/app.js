// Vaše původní inicializace a proměnné
var stats;
var camera, controls, scene, renderer;

// Nové herní objekty
var paddle1, paddle2, ball, table;
var globalPaddleSpeed = 0.1; // Rychlost pálek
var globalBallSpeed = 0.03;  // Základní rychlost míčku
var ballSpeed = { x: globalBallSpeed, y: globalBallSpeed };
var ballDirection = { x: 1, y: 1 };

// Skóre
var scorePlayer1 = 0;
var scorePlayer2 = 0;

// Stavové proměnné pro pohyb pálek
let paddle1MovingUp = false;
let paddle1MovingDown = false;
let paddle2MovingUp = false;
let paddle2MovingDown = false;

// Funkce inicializace scény
function init() {
    // Kamera
    camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 6;

    // Ovládání
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 4.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    // Scéna
    scene = new THREE.Scene();

    // Pozadí scény
    scene.background = new THREE.Color(0x333333);

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Statistiky
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    // Přidání herních prvků
    addGameElements();

    // Přidání skóre
    addScoreDisplay();

    // Posluchače událostí
    window.addEventListener('resize', onWindowResize, false);
}
function addGameElements() {
    // Textura hrací plochy
    const textureLoader = new THREE.TextureLoader();
    let tableTexture;
    try {
        tableTexture = textureLoader.load(
            './textures/table.jpg', // Cesta k textuře
            function (texture) {
                console.log("Textura úspěšně načtena:", texture);
            },
            undefined,
            function (err) {
                console.error("Chyba při načítání textury:", err);
            }
        );
    } catch (error) {
        console.error("Textura nebyla načtena, bude použita defaultní modrá barva.");
        tableTexture = null;
    }

    // Pokud textura není načtena, použijeme modrou barvu
    const tableMaterial = tableTexture
        ? new THREE.MeshBasicMaterial({ map: tableTexture, side: THREE.DoubleSide })
        : new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

    // Hrací plocha (stůl)
    var tableGeometry = new THREE.PlaneBufferGeometry(10, 5); // Velikost hrací plochy
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.rotation.x = -Math.PI / 2; // Orientace plochy horizontálně (X-Z)
    table.position.y = -0.6; // Posun hrací plochy dolů
    scene.add(table);

    // Skupina pro herní prvky (box, pálky, míček)
    const gameGroup = new THREE.Group();

    // Pálka hráče 1
    var paddleGeometry = new THREE.BoxGeometry(0.2, 1, 0.2); // Vertikální pálky
    var paddleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle1.position.set(-4.5, 0, 0); // Umístění na levé straně
    gameGroup.add(paddle1);

    // Pálka hráče 2
    paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle2.position.set(4.5, 0, 0); // Umístění na pravé straně
    gameGroup.add(paddle2);

    // Míček
    var ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    var ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0, 0); // Výchozí pozice ve středu
    gameGroup.add(ball);

    // Viditelné hrany boxu
    var boxGeometry = new THREE.BoxGeometry(10, 5, 1); // Upravené rozměry boxu
    var boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    var borderBox = new THREE.Mesh(boxGeometry, boxMaterial);
    borderBox.position.set(0, 0, 0); // Umístění boxu kolem herních prvků
    gameGroup.add(borderBox);

    // Oblasti skórování (logika pouze bez vizualizace)
    const goalZone1 = {
        xMin: -5.1,
        xMax: -4.9,
        yMin: -2.5,
        yMax: 2.5
    };

    const goalZone2 = {
        xMin: 4.9,
        xMax: 5.1,
        yMin: -2.5,
        yMax: 2.5
    };

    // Ukládáme logické hranice pro použití v logice
    gameGroup.goalZones = { goalZone1, goalZone2 };

    // Otočení celé herní skupiny
    gameGroup.rotation.x = -Math.PI / 2; // Otočení celého boxu, aby odpovídal textuře
    gameGroup.position.y = 0; // Udržení ve správné výšce
    scene.add(gameGroup);
}


// Přidání skóre
function addScoreDisplay() {
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    scoreDiv.style.position = 'absolute';
    scoreDiv.style.top = '10px';
    scoreDiv.style.left = '50%';
    scoreDiv.style.transform = 'translateX(-50%)';
    scoreDiv.style.color = 'white';
    scoreDiv.style.fontSize = '24px';
    scoreDiv.style.fontFamily = 'Arial, sans-serif';
    scoreDiv.style.zIndex = 100;
    scoreDiv.innerHTML = `Player 1: ${scorePlayer1} | Player 2: ${scorePlayer2}`;
    document.body.appendChild(scoreDiv);
}

// Aktualizace skóre
function updateScore() {
    const scoreDiv = document.getElementById('score');
    scoreDiv.innerHTML = `Player 1: ${scorePlayer1} | Player 2: ${scorePlayer2}`;
}
function updateGame() {
    // Pohyb pálky hráče 1
    if (paddle1MovingUp && paddle1.position.y < 2.5) {
        paddle1.position.y += globalPaddleSpeed;
    }
    if (paddle1MovingDown && paddle1.position.y > -2.5) {
        paddle1.position.y -= globalPaddleSpeed;
    }

    // Pohyb pálky hráče 2
    if (paddle2MovingUp && paddle2.position.y < 2.5) {
        paddle2.position.y += globalPaddleSpeed;
    }
    if (paddle2MovingDown && paddle2.position.y > -2.5) {
        paddle2.position.y -= globalPaddleSpeed;
    }

    // Pohyb míčku
    ball.position.x += ballSpeed.x * ballDirection.x;
    ball.position.y += ballSpeed.y * ballDirection.y;

    // Odrážení od hran
    if (ball.position.y > 2.5 || ball.position.y < -2.5) {
        ballDirection.y *= -1;
    }

    // Kolize s pálkami
    if (
        ball.position.x < paddle1.position.x + 0.2 && // Kontrola přední hrany levé pálky
        ball.position.x > paddle1.position.x &&      // Míček nesmí být za levou pálkou
        ball.position.y < paddle1.position.y + 0.6 && 
        ball.position.y > paddle1.position.y - 0.6
    ) {
        ballDirection.x *= -1; // Odrážení
        ball.position.x = paddle1.position.x + 0.21; // Posun míčku mimo pálku
    }

    if (
        ball.position.x > paddle2.position.x - 0.2 && // Kontrola přední hrany pravé pálky
        ball.position.x < paddle2.position.x &&      // Míček nesmí být za pravou pálkou
        ball.position.y < paddle2.position.y + 0.6 &&
        ball.position.y > paddle2.position.y - 0.6
    ) {
        ballDirection.x *= -1; // Odrážení
        ball.position.x = paddle2.position.x - 0.21; // Posun míčku mimo pálku
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


// Reset míčku
function resetBall() {
    ball.position.set(0, 0, 0);
    ballDirection.x *= -1;
}

// Ovládání
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            paddle1MovingUp = true;
            break;
        case 's':
            paddle1MovingDown = true;
            break;
        case 'ArrowUp':
            paddle2MovingUp = true;
            break;
        case 'ArrowDown':
            paddle2MovingDown = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            paddle1MovingUp = false;
            break;
        case 's':
            paddle1MovingDown = false;
            break;
        case 'ArrowUp':
            paddle2MovingUp = false;
            break;
        case 'ArrowDown':
            paddle2MovingDown = false;
            break;
    }
});

// Animace
function animate() {
    requestAnimationFrame(animate);
    updateGame();
    controls.update();
    render();
}

// Renderování
function render() {
    renderer.render(scene, camera);
    stats.update();
}

// Změna velikosti okna
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Spuštění aplikace
init();
animate();
