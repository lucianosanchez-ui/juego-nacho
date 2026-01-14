// Configuración del canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log('Juego iniciando...', canvas, ctx);

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
        this.size = CELL_SIZE;
        this.speed = 2;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
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
    }

    checkCollision(x, y) {
        const gridX = Math.floor(x / CELL_SIZE);
        const gridY = Math.floor(y / CELL_SIZE);
        const gridX2 = Math.floor((x + this.size - 1) / CELL_SIZE);
        const gridY2 = Math.floor((y + this.size - 1) / CELL_SIZE);

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
        // Dibujar perrito (círculo amarillo con ojos)
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const radius = this.size / 2 - 2;

        // Cuerpo amarillo
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Contorno
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ojos
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 3, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 4, centerY - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nariz
        ctx.beginPath();
        ctx.arc(centerX, centerY + 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Clase de los Fantasmas (Gatitos)
class Ghost {
    constructor(x, y, color, personality) {
        this.startX = x * CELL_SIZE;
        this.startY = y * CELL_SIZE;
        this.x = this.startX;
        this.y = this.startY;
        this.size = CELL_SIZE;
        this.speed = 1 + level * 0.1;
        this.color = color;
        this.personality = personality;
        this.direction = { x: 0, y: -1 };
        this.scared = false;
    }

    update(player) {
        this.scared = powerMode;

        // Elegir dirección basada en personalidad
        if (Math.random() < 0.05) {
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
        if (Math.random() < 0.1) {
            this.moveRandom();
        }
    }

    checkCollision(x, y) {
        const gridX = Math.floor(x / CELL_SIZE);
        const gridY = Math.floor(y / CELL_SIZE);
        const gridX2 = Math.floor((x + this.size - 1) / CELL_SIZE);
        const gridY2 = Math.floor((y + this.size - 1) / CELL_SIZE);

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
        // Dibujar gatito (forma de fantasma estilo Pacman)
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const radius = this.size / 2 - 2;

        // Color según estado
        if (this.scared) {
            ctx.fillStyle = '#2196F3';
        } else {
            ctx.fillStyle = this.color;
        }

        // Cuerpo (mitad superior circular)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);

        // Parte inferior con forma ondulada
        const waveWidth = this.size / 3;
        ctx.lineTo(this.x + this.size - 2, this.y + this.size - 2);
        ctx.lineTo(this.x + this.size - waveWidth, this.y + this.size - 6);
        ctx.lineTo(this.x + waveWidth, this.y + this.size - 6);
        ctx.lineTo(this.x + 2, this.y + this.size - 2);
        ctx.closePath();
        ctx.fill();

        // Contorno
        ctx.strokeStyle = this.scared ? '#1976D2' : this.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ojos
        if (this.scared) {
            // Ojos de miedo
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(centerX - 5, centerY - 2, 3, 0, Math.PI * 2);
            ctx.arc(centerX + 5, centerY - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(centerX - 5, centerY - 2, 1, 0, Math.PI * 2);
            ctx.arc(centerX + 5, centerY - 2, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ojos normales
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(centerX - 4, centerY - 2, 3, 0, Math.PI * 2);
            ctx.arc(centerX + 4, centerY - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(centerX - 4, centerY - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(centerX + 4, centerY - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
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
    powerModeTimer = 300;
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

        if (dist < CELL_SIZE) {
            if (powerMode) {
                score += 200;
                updateScore();
                ghost.reset();
            } else {
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

    // Dibujar mapa
    drawMap();

    if (!gamePaused) {
        player.update();
        for (let ghost of ghosts) {
            ghost.update(player);
        }
        updatePowerMode();
        checkCollisions();
    }

    // Dibujar entidades
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
    console.log('Iniciando juego...');
    gameRunning = true;
    gamePaused = false;
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

    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.textContent = '⏸️ Pausa';

    console.log('Comenzando game loop...');
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

// Controles de teclado
document.addEventListener('keydown', (e) => {
    if (!gameRunning && e.key === 'Enter') {
        startGame();
        return;
    }

    if (!gameRunning) return;

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

// Botones de UI
const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
    restartBtn.addEventListener('click', startGame);
}

const nextLevelBtn = document.getElementById('nextLevelBtn');
if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', nextLevel);
}

const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
        if (gameRunning) {
            gamePaused = !gamePaused;
            pauseBtn.textContent = gamePaused ? '▶️ Continuar' : '⏸️ Pausa';
        }
    });
}

// Controles táctiles para móviles
function setupTouchControls() {
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    if (!btnUp || !btnDown || !btnLeft || !btnRight) {
        console.log('Botones táctiles no encontrados');
        return;
    }

    const handleDirection = (x, y) => {
        console.log('Dirección:', x, y);
        if (gameRunning && !gamePaused) {
            player.nextDirection = { x, y };
        }
    };

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Eventos touch y click
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

    console.log('Controles táctiles configurados');
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM listo');
        setupTouchControls();
        startGame();
    });
} else {
    console.log('DOM ya estaba listo');
    setupTouchControls();
    startGame();
}
