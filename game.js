// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constantes del juego
const CELL_SIZE = 28;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 22;

// Estado del juego
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let powerMode = false;
let powerModeTimer = 0;

// Mapa del laberinto (0 = vacío, 1 = pared, 2 = croqueta, 3 = píldora de poder)
const originalMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,1],
    [1,1,1,1,2,1,2,2,2,2,2,2,2,2,1,2,1,1,1,1],
    [1,1,1,1,2,1,2,1,1,0,0,1,1,2,1,2,1,1,1,1],
    [2,2,2,2,2,2,2,1,0,0,0,0,1,2,2,2,2,2,2,2],
    [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
    [1,1,1,1,2,1,2,2,2,2,2,2,2,2,1,2,1,1,1,1],
    [1,1,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

let map = JSON.parse(JSON.stringify(originalMap));

// Clase del Jugador (Perrito)
class Player {
    constructor() {
        this.x = 10 * CELL_SIZE;
        this.y = 15 * CELL_SIZE;
        this.size = CELL_SIZE - 4;
        this.speed = 2;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.mouthOpen = 0;
    }

    update() {
        // Intentar cambiar de dirección
        const nextX = this.x + this.nextDirection.x * this.speed;
        const nextY = this.y + this.nextDirection.y * this.speed;
        if (!this.checkCollision(nextX, nextY)) {
            this.direction = { ...this.nextDirection };
        }

        // Mover en la dirección actual
        const newX = this.x + this.direction.x * this.speed;
        const newY = this.y + this.direction.y * this.speed;

        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }

        // Wrap around (teletransporte en los bordes)
        if (this.x < -CELL_SIZE) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -CELL_SIZE;

        // Recoger croquetas
        this.collectDots();

        // Animación de boca
        this.mouthOpen += 0.1;
    }

    checkCollision(x, y) {
        const gridX = Math.floor(x / CELL_SIZE);
        const gridY = Math.floor(y / CELL_SIZE);
        const gridX2 = Math.floor((x + this.size) / CELL_SIZE);
        const gridY2 = Math.floor((y + this.size) / CELL_SIZE);

        if (gridY < 0 || gridY >= GRID_HEIGHT || gridY2 < 0 || gridY2 >= GRID_HEIGHT) return false;
        if (gridX < 0 || gridX >= GRID_WIDTH || gridX2 < 0 || gridX2 >= GRID_WIDTH) return false;

        return map[gridY][gridX] === 1 || map[gridY][gridX2] === 1 ||
               map[gridY2][gridX] === 1 || map[gridY2][gridX2] === 1;
    }

    collectDots() {
        const gridX = Math.floor((this.x + this.size / 2) / CELL_SIZE);
        const gridY = Math.floor((this.y + this.size / 2) / CELL_SIZE);

        if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
            if (map[gridY][gridX] === 2) {
                map[gridY][gridX] = 0;
                score += 10;
                updateScore();
                checkWin();
            } else if (map[gridY][gridX] === 3) {
                map[gridY][gridX] = 0;
                score += 50;
                updateScore();
                activatePowerMode();
                checkWin();
            }
        }
    }

    draw() {
        // Dibujar perrito emoji
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🐕', this.x, this.y);
    }
}

// Clase de los Fantasmas (Gatitos)
class Ghost {
    constructor(x, y, color, personality) {
        this.startX = x * CELL_SIZE;
        this.startY = y * CELL_SIZE;
        this.x = this.startX;
        this.y = this.startY;
        this.size = CELL_SIZE - 4;
        this.speed = 1 + level * 0.1;
        this.color = color;
        this.personality = personality; // 'chase', 'random', 'ambush', 'patrol'
        this.direction = { x: 0, y: -1 };
        this.scared = false;
    }

    update(player) {
        this.scared = powerMode;

        // Elegir dirección basada en personalidad
        if (Math.random() < 0.05) { // Cambiar dirección ocasionalmente
            if (this.scared) {
                this.moveAwayFrom(player);
            } else {
                switch (this.personality) {
                    case 'chase':
                        this.moveTowards(player);
                        break;
                    case 'random':
                        this.moveRandom();
                        break;
                    case 'ambush':
                        this.moveAmbush(player);
                        break;
                    case 'patrol':
                        this.movePatrol();
                        break;
                }
            }
        }

        // Mover
        const newX = this.x + this.direction.x * this.speed;
        const newY = this.y + this.direction.y * this.speed;

        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Si choca, elegir nueva dirección
            this.moveRandom();
        }

        // Wrap around
        if (this.x < -CELL_SIZE) this.x = canvas.width;
        if (this.x > canvas.width) this.x = -CELL_SIZE;
    }

    moveTowards(player) {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        let bestDir = directions[0];
        let minDist = Infinity;

        for (let dir of directions) {
            const newX = this.x + dir.x * CELL_SIZE;
            const newY = this.y + dir.y * CELL_SIZE;
            if (!this.checkCollision(newX, newY)) {
                const dist = Math.hypot(newX - player.x, newY - player.y);
                if (dist < minDist) {
                    minDist = dist;
                    bestDir = dir;
                }
            }
        }

        this.direction = bestDir;
    }

    moveAwayFrom(player) {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        let bestDir = directions[0];
        let maxDist = -Infinity;

        for (let dir of directions) {
            const newX = this.x + dir.x * CELL_SIZE;
            const newY = this.y + dir.y * CELL_SIZE;
            if (!this.checkCollision(newX, newY)) {
                const dist = Math.hypot(newX - player.x, newY - player.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    bestDir = dir;
                }
            }
        }

        this.direction = bestDir;
    }

    moveRandom() {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    moveAmbush(player) {
        // Intentar moverse hacia donde el jugador va a estar
        const targetX = player.x + player.direction.x * CELL_SIZE * 4;
        const targetY = player.y + player.direction.y * CELL_SIZE * 4;

        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        let bestDir = directions[0];
        let minDist = Infinity;

        for (let dir of directions) {
            const newX = this.x + dir.x * CELL_SIZE;
            const newY = this.y + dir.y * CELL_SIZE;
            if (!this.checkCollision(newX, newY)) {
                const dist = Math.hypot(newX - targetX, newY - targetY);
                if (dist < minDist) {
                    minDist = dist;
                    bestDir = dir;
                }
            }
        }

        this.direction = bestDir;
    }

    movePatrol() {
        // Continuar en la misma dirección o cambiar aleatoriamente
        if (Math.random() < 0.1) {
            this.moveRandom();
        }
    }

    checkCollision(x, y) {
        const gridX = Math.floor(x / CELL_SIZE);
        const gridY = Math.floor(y / CELL_SIZE);
        const gridX2 = Math.floor((x + this.size) / CELL_SIZE);
        const gridY2 = Math.floor((y + this.size) / CELL_SIZE);

        if (gridY < 0 || gridY >= GRID_HEIGHT || gridY2 < 0 || gridY2 >= GRID_HEIGHT) return true;
        if (gridX < 0 || gridX >= GRID_WIDTH || gridX2 < 0 || gridX2 >= GRID_WIDTH) return true;

        return map[gridY][gridX] === 1 || map[gridY][gridX2] === 1 ||
               map[gridY2][gridX] === 1 || map[gridY2][gridX2] === 1;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }

    draw() {
        // Dibujar gatito emoji
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.scared ? '😨' : '🐱', this.x, this.y);
    }
}

// Inicializar entidades
let player = new Player();
let ghosts = [
    new Ghost(9, 9, '#FF0000', 'chase'),
    new Ghost(10, 9, '#FFB8FF', 'random'),
    new Ghost(9, 10, '#00FFFF', 'ambush'),
    new Ghost(10, 10, '#FFB852', 'patrol')
];

// Funciones del juego
function activatePowerMode() {
    powerMode = true;
    powerModeTimer = 300; // 5 segundos a 60 FPS
}

function updatePowerMode() {
    if (powerMode) {
        powerModeTimer--;
        if (powerModeTimer <= 0) {
            powerMode = false;
        }
    }
}

function checkCollisions() {
    for (let i = 0; i < ghosts.length; i++) {
        const ghost = ghosts[i];
        const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);

        if (dist < CELL_SIZE / 2) {
            if (powerMode) {
                // Comer gatito
                score += 200;
                updateScore();
                ghost.reset();
            } else {
                // Perder vida
                lives--;
                updateLives();
                if (lives <= 0) {
                    gameOver();
                } else {
                    resetPositions();
                }
            }
        }
    }
}

function checkWin() {
    let dotsRemaining = 0;
    for (let row of map) {
        for (let cell of row) {
            if (cell === 2 || cell === 3) {
                dotsRemaining++;
            }
        }
    }

    if (dotsRemaining === 0) {
        victory();
    }
}

function resetPositions() {
    player = new Player();
    for (let ghost of ghosts) {
        ghost.reset();
    }
}

function drawMap() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = map[y][x];
            const posX = x * CELL_SIZE;
            const posY = y * CELL_SIZE;

            switch (cell) {
                case 1: // Pared
                    ctx.fillStyle = '#2121DE';
                    ctx.fillRect(posX, posY, CELL_SIZE, CELL_SIZE);
                    ctx.strokeStyle = '#4141EE';
                    ctx.strokeRect(posX, posY, CELL_SIZE, CELL_SIZE);
                    break;
                case 2: // Croqueta
                    ctx.fillStyle = '#FFB852';
                    ctx.beginPath();
                    ctx.arc(posX + CELL_SIZE / 2, posY + CELL_SIZE / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 3: // Píldora de poder
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(posX + CELL_SIZE / 2, posY + CELL_SIZE / 2, 6, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

function gameLoop() {
    if (!gameRunning) return;

    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar
    drawMap();

    if (!gamePaused) {
        player.update();
        for (let ghost of ghosts) {
            ghost.update(player);
        }
        updatePowerMode();
        checkCollisions();
    }

    player.draw();
    for (let ghost of ghosts) {
        ghost.draw();
    }

    // Mostrar mensaje de pausa
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Presiona ⏸️ para continuar', canvas.width / 2, canvas.height / 2 + 50);
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    map = JSON.parse(JSON.stringify(originalMap));
    player = new Player();
    ghosts = [
        new Ghost(9, 9, '#FF0000', 'chase'),
        new Ghost(10, 9, '#FFB8FF', 'random'),
        new Ghost(9, 10, '#00FFFF', 'ambush'),
        new Ghost(10, 10, '#FFB852', 'patrol')
    ];
    updateScore();
    updateLives();
    updateLevel();
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'flex';
}

function victory() {
    gameRunning = false;
    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victory').style.display = 'flex';
}

function nextLevel() {
    level++;
    map = JSON.parse(JSON.stringify(originalMap));
    player = new Player();
    ghosts = [
        new Ghost(9, 9, '#FF0000', 'chase'),
        new Ghost(10, 9, '#FFB8FF', 'random'),
        new Ghost(9, 10, '#00FFFF', 'ambush'),
        new Ghost(10, 10, '#FFB852', 'patrol')
    ];
    for (let ghost of ghosts) {
        ghost.speed = 1 + level * 0.1;
    }
    updateLevel();
    document.getElementById('victory').style.display = 'none';
    gameRunning = true;
    gameLoop();
}

// Controles
document.addEventListener('keydown', (e) => {
    if (!gameRunning && e.key === 'Enter') {
        startGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
            player.nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
            player.nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
            player.nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
            player.nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
    }
});

document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

// Botón de pausa
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        const btn = document.getElementById('pauseBtn');
        btn.textContent = gamePaused ? '▶️ Continuar' : '⏸️ Pausa';
    }
});

// Controles táctiles para móviles
function setupTouchControls() {
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    const handleDirection = (x, y) => {
        if (gameRunning && !gamePaused) {
            player.nextDirection = { x, y };
        }
    };

    // Prevenir scroll y zoom en dispositivos táctiles
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Eventos touch
    btnUp.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        handleDirection(0, -1);
    });
    btnUp.addEventListener('click', (e) => {
        preventDefaults(e);
        handleDirection(0, -1);
    });

    btnDown.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        handleDirection(0, 1);
    });
    btnDown.addEventListener('click', (e) => {
        preventDefaults(e);
        handleDirection(0, 1);
    });

    btnLeft.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        handleDirection(-1, 0);
    });
    btnLeft.addEventListener('click', (e) => {
        preventDefaults(e);
        handleDirection(-1, 0);
    });

    btnRight.addEventListener('touchstart', (e) => {
        preventDefaults(e);
        handleDirection(1, 0);
    });
    btnRight.addEventListener('click', (e) => {
        preventDefaults(e);
        handleDirection(1, 0);
    });
}

setupTouchControls();

// Iniciar juego automáticamente
startGame();
