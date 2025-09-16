const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreValueElement = document.getElementById('scoreValue');
const highScoreValueElement = document.getElementById('highScoreValue');
const finalScoreElement = document.getElementById('finalScore');
const newHighScoreText = document.getElementById('newHighScoreText');
const youAreAwesomeText = document.querySelector('.you-are-awesome');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const playAgainBtnEnd = document.getElementById('playAgainBtnEnd');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameEndScreen = document.getElementById('gameEndScreen');
const finalAnimation = document.querySelector('.final-animation');

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 3;
let cameraX = 0;
let gameLoopId;

const player = {
    x: 150,
    y: canvas.height - 150,
    width: 40,
    height: 60,
    speed: 8,
    jumpForce: 16,
    velocityY: 0,
    jumping: false,
    grounded: false,
    color: '#e94560',
    frame: 0,
    frameRate: 10,
    animationState: 'idle'
};

let gameOver = false;
let platforms = [];
let obstacles = [];
let coins = [];
let backgroundElements = [];
let parallaxLayers = [];
const levelWidth = 20000;
let keys = {};

function init() {
    score = 0;
    gameSpeed = 3;
    gameOver = false;
    cameraX = 0;
    player.x = 150;
    player.y = canvas.height - 150;
    player.velocityY = 0;
    player.jumping = false;
    player.grounded = false;
    player.frame = 0;
    player.animationState = 'idle';

    platforms = [];
    obstacles = [];
    coins = [];
    backgroundElements = [];
    parallaxLayers = [];

    platforms.push({ x: 0, y: canvas.height - 90, width: levelWidth, height: 90, color: '#27ae60' });

    for (let i = 0; i < 100; i++) {
        const width = 100 + Math.random() * 150;
        const x = 500 + i * 300 + Math.random() * 200;
        const y = canvas.height - 150 - Math.random() * 200;

        platforms.push({ x: x, y: y, width: width, height: 30, color: '#16a085' });
    }

    for (let i = 0; i < 70; i++) {
        const x = 600 + i * 300 + Math.random() * 200;
        const size = 30 + Math.random() * 20;
        obstacles.push({ x: x, y: canvas.height - 90 - size, width: size, height: size, color: '#c0392b' });
    }

    for (let i = 0; i < 150; i++) {
        const x = 400 + i * 200 + Math.random() * 150;
        const y = canvas.height - 200 - Math.random() * 200;
        const size = 15;
        coins.push({ x: x, y: y, width: size, height: size, collected: false, color: '#f1c40f' });
    }

    for (let i = 0; i < 50; i++) {
        const size = 5 + Math.random() * 10;
        backgroundElements.push({ x: Math.random() * levelWidth, y: Math.random() * canvas.height, width: size, height: size, color: 'rgba(255, 255, 255, 0.5)' });
    }

    for (let i = 0; i < 3; i++) {
        parallaxLayers.push({ x: 0, speed: (i + 1) * 0.2, color: i === 0 ? '#2980b9' : i === 1 ? '#3498db' : '#5dade2' });
    }

    gameOverScreen.style.display = 'none';
    gameEndScreen.style.display = 'none';
    finalAnimation.style.display = 'none';
    newHighScoreText.style.display = 'none';
    youAreAwesomeText.style.display = 'none';
    updateScore();

    setInterval(increaseDifficulty, 10000);
}

function updateScore() {
    scoreValueElement.textContent = score;
    highScoreValueElement.textContent = highScore;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreValueElement.textContent = highScore;
        newHighScoreText.style.display = 'block';
        youAreAwesomeText.style.display = 'block';
    }
}

function increaseDifficulty() {
    if (!gameOver) {
        gameSpeed += 0.5;
        console.log(`Game speed increased to: ${gameSpeed}`);
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - cameraX + 8, player.y + 10, 8, 8);
    ctx.fillRect(player.x - cameraX + 24, player.y + 10, 8, 8);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x - cameraX + 10, player.y + 12, 4, 4);
    ctx.fillRect(player.x - cameraX + 26, player.y + 12, 4, 4);

    if (player.grounded) {
        if (keys['ArrowLeft'] || keys['ArrowRight']) {
            player.animationState = 'running';
        } else {
            player.animationState = 'idle';
        }
    } else {
        player.animationState = 'jumping';
    }

    if (player.animationState === 'running') {
        const legOffset = Math.sin(player.frame * 0.5) * 5;
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(player.x - cameraX + 5, player.y + player.height, 10, -10 + legOffset);
        ctx.fillRect(player.x - cameraX + 25, player.y + player.height, 10, -10 - legOffset);
        player.frame = (player.frame + 1) % player.frameRate;
    } else {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(player.x - cameraX + 5, player.y + player.height - 10, 10, 10);
        ctx.fillRect(player.x - cameraX + 25, player.y + player.height - 10, 10, 10);
    }
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x - cameraX, platform.y, platform.width, platform.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(platform.x - cameraX, platform.y, platform.width, 5);
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x - cameraX, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = '#7f1d1d';
        for (let i = 0; i < obstacle.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(obstacle.x - cameraX + i, obstacle.y);
            ctx.lineTo(obstacle.x - cameraX + i + 5, obstacle.y - 10);
            ctx.lineTo(obstacle.x - cameraX + i + 10, obstacle.y);
            ctx.closePath();
            ctx.fill();
        }
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(coin.x - cameraX + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(coin.x - cameraX + coin.width / 2 - 3, coin.y + coin.height / 2 - 3, coin.width / 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4b6cb7');
    gradient.addColorStop(1, '#a1c4fd');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    parallaxLayers.forEach(layer => {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 50);
        for (let i = 0; i < canvas.width; i += 100) {
            const layerX = (i + layer.x) % canvas.width;
            ctx.lineTo(layerX, canvas.height - 50 - Math.sin(i / 100 + layer.x) * 40);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
    });

    backgroundElements.forEach(element => {
        if (element.x - cameraX > -50 && element.x - cameraX < canvas.width + 50) {
            ctx.fillStyle = element.color;
            ctx.fillRect(element.x - cameraX, element.y, element.width, element.height);
        }
    });

    ctx.fillStyle = '#16a085';
    ctx.fillRect(0 - cameraX, canvas.height - 90, levelWidth, 90);

    ctx.fillStyle = '#1abc9c';
    for (let i = 0; i < levelWidth; i += 20) {
        if (i - cameraX > -20 && i - cameraX < canvas.width + 20) {
            ctx.fillRect(i - cameraX, canvas.height - 90, 10, 5);
        }
    }
}

function checkCollisions() {
    player.grounded = false;

    platforms.forEach(platform => {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height / 2 &&
            player.velocityY > 0) {

            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.grounded = true;
            player.jumping = false;
        }
    });

    obstacles.forEach(obstacle => {
        if (player.x + player.width > obstacle.x &&
            player.x < obstacle.x + obstacle.width &&
            player.y + player.height > obstacle.y &&
            player.y < obstacle.y + obstacle.height) {

            gameOver = true;
            gameOverScreen.style.display = 'flex';
            if (score <= 50) {
                finalScoreElement.textContent = "You are too noob for it";
            } else {
                finalScoreElement.textContent = "Final Score: " + score;
            }
            saveHighScore();
            cancelAnimationFrame(gameLoopId);
        }
    });

    coins.forEach(coin => {
        if (!coin.collected &&
            player.x + player.width > coin.x &&
            player.x < coin.x + coin.width &&
            player.y + player.height > coin.y &&
            player.y < coin.y + coin.height) {

            coin.collected = true;
            score += 10;
            updateScore();
        }
    });
}

function update() {
    cameraX += gameSpeed;

    if (cameraX >= levelWidth - canvas.width) {
        gameOver = true;
        gameEndScreen.style.display = 'flex';
        finalAnimation.style.display = 'block';
        saveHighScore();
        cancelAnimationFrame(gameLoopId);
        return;
    }

    if (!player.grounded) {
        player.velocityY += 0.5;
    }

    player.y += player.velocityY;

    if (player.y > canvas.height) {
        gameOver = true;
        gameOverScreen.style.display = 'flex';
        if (score <= 50) {
            finalScoreElement.textContent = "You are too noob for it 🤣🤣";
        } else {  
            finalScoreElement.textContent = "Final Score: " + score;
        }
        saveHighScore();
        cancelAnimationFrame(gameLoopId);
        return;
    }

    if (player.y < 0) {
        player.y = 0;
        player.velocityY = 0;
    }

    if (keys['ArrowLeft']) {
        player.x -= player.speed;
    }

    if (keys['ArrowRight']) {
        player.x += player.speed;
        const targetCameraX = player.x - canvas.width * 0.4;
        cameraX += (targetCameraX - cameraX) * 0.05;
    }

    if (player.x < cameraX + 100) {
        cameraX = player.x - 100;
        if (cameraX < 0) cameraX = 0;
    }

    if (keys[' '] && player.grounded && !player.jumping) {
        player.velocityY = -player.jumpForce;
        player.jumping = true;
        player.grounded = false;
    }

    if (player.velocityY < 0 && !keys[' ']) {
        player.velocityY *= 0.8;
    }

    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlatforms();
    drawObstacles();
    drawCoins();
    drawPlayer();
}

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
});

restartBtn.addEventListener('click', function() {
    window.location.reload();
});

playAgainBtn.addEventListener('click', function() {
    window.location.reload();
});

playAgainBtnEnd.addEventListener('click', function() {
    window.location.reload();
});

init();
gameLoop();

