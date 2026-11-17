const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const gameOverEl = document.getElementById('gameOver');
const startScreenEl = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('starCatcherHighScore') || 0;
let gameRunning = false;
let animationId;

highScoreEl.textContent = highScore;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 40,
    speed: 8,
    color: '#00ffff'
};

let stars = [];
let meteors = [];
let particles = [];

function spawnStar() {
    stars.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        size: 15 + Math.random() * 10,
        speed: 2 + Math.random() * 2,
        color: `hsl(${Math.random() * 60 + 40}, 100%, 60%)`
    });
}

function spawnMeteor() {
    meteors.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        size: 20 + Math.random() * 15,
        speed: 3 + Math.random() * 3,
        color: '#ff4444'
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: color
        });
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = star.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.fillStyle = meteor.color;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, meteor.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Trail
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x, meteor.y - 20);
        ctx.stroke();
    });
}

function drawParticles() {
    particles.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    });
}

function update() {
    if (!gameRunning) return;

    // Move objects
    stars.forEach((star, i) => {
        star.y += star.speed;
        if (star.y > canvas.height) stars.splice(i, 1);
        // Collision with player
        if (star.x > player.x && star.x < player.x + player.width &&
            star.y > player.y && star.y < player.y + player.height) {
            score += 10;
            scoreEl.textContent = score;
            createParticles(star.x, star.y, star.color);
            stars.splice(i, 1);
        }
    });

    meteors.forEach((meteor, i) => {
        meteor.y += meteor.speed;
        if (meteor.y > canvas.height) meteors.splice(i, 1);
        // Collision
        if (meteor.x > player.x && meteor.x < player.x + player.width &&
            meteor.y > player.y && meteor.y < player.y + player.height) {
            lives--;
            livesEl.textContent = lives;
            createParticles(meteor.x, meteor.y, meteor.color);
            meteors.splice(i, 1);
            if (lives <= 0) endGame();
        }
    });

    // Spawn
    if (Math.random() < 0.03) spawnStar();
    if (Math.random() < 0.015) spawnMeteor();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    drawStars();
    drawMeteors();
    drawPlayer();
    drawParticles();
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    score = 0;
    lives = 3;
    stars = [];
    meteors = [];
    particles = [];
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    gameRunning = true;
    startScreenEl.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    gameLoop();
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('starCatcherHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    finalScoreEl.textContent = score;
    gameOverEl.classList.remove('hidden');
}

// Controls
let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function handleInput() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
}

// Mouse control
canvas.addEventListener('mousemove', e => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
});

setInterval(handleInput, 16); // Smooth keyboard

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw
draw();