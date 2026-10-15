
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const message = document.getElementById("message");

const keys = {};
const worldWidth = 1600;

let score = 0;
let level = 1;
let cameraX = 0;
let finished = false;
let won = false;

const player = {
  x: 50, y: 300,
  w: 28, h: 36,
  vx: 0, vy: 0,
  speed: 4,
  jump: -11,
  grounded: false
};

let platforms = [];
let coins = [];

function buildLevel() {
  platforms = [
    { x: 0, y: 370, w: 350, h: 50 },
    { x: 420, y: 330, w: 180, h: 24 },
    { x: 670, y: 285, w: 180, h: 24 },
    { x: 920, y: 330, w: 200, h: 24 },
    { x: 1190, y: 285, w: 160, h: 24 },
    { x: 1420, y: 370, w: 180, h: 50 }
  ];

  coins = [
    { x: 170, y: 330, got: false },
    { x: 480, y: 290, got: false },
    { x: 730, y: 245, got: false },
    { x: 1000, y: 290, got: false },
    { x: 1240, y: 245, got: false }
  ];

  player.x = 50;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;

  cameraX = 0;
  finished = false;
  won = false;

  message.textContent = "Colete as moedas e encontre a bandeira!";
}

function restartGame() {
  score = 0;
  level = 1;
  scoreText.textContent = score;
  levelText.textContent = level;
  buildLevel();
}

function nextLevel() {
  level++;
  levelText.textContent = level;
  buildLevel();

  // Cada nova fase terá mais um desafio.
  if (level === 2) {
    platforms[2].y = 255;
  }

  if (level === 3) {
    platforms[1].y = 290;
    platforms[3].y = 290;
  }
}

function drawWorld() {
  // Céu
  ctx.fillStyle = "#8ed6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nuvens decorativas
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < 7; i++) {
    const x = ((i * 155 - cameraX * 0.3) % 1000 + 1000) % 1000;

    ctx.beginPath();
    ctx.arc(x, 65 + (i % 3) * 25, 20, 0, Math.PI * 2);
    ctx.arc(x + 22, 60 + (i % 3) * 25, 25, 0, Math.PI * 2);
    ctx.arc(x + 45, 68 + (i % 3) * 25, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Plataformas
  platforms.forEach(p => {
    ctx.fillStyle = "#855b38";
    ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);

    ctx.fillStyle = "#48a84f";
    ctx.fillRect(p.x - cameraX, p.y, p.w, 8);
  });

  // Moedas
  coins.forEach(c => {
    if (c.got) return;

    ctx.fillStyle = "#ffbf26";
    ctx.beginPath();
    ctx.arc(c.x - cameraX, c.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e18b16";
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // Bandeira da saída
  ctx.fillStyle = "#4a3526";
  ctx.fillRect(1510 - cameraX, 305, 6, 65);

  ctx.fillStyle = "#ff5b5b";
  ctx.beginPath();
  ctx.moveTo(1516 - cameraX, 305);
  ctx.lineTo(1555 - cameraX, 320);
  ctx.lineTo(1516 - cameraX, 335);
  ctx.fill();

  // Personagem
  ctx.fillStyle = "#5947d8";
  ctx.fillRect(
    player.x - cameraX,
    player.y,
    player.w,
    player.h
  );

  // Olhos
  ctx.fillStyle = "white";
  ctx.fillRect(player.x - cameraX + 16, player.y + 8, 6, 6);

  ctx.fillStyle = "#172033";
  ctx.fillRect(player.x - cameraX + 19, player.y + 10, 3, 3);
}

function update() {
  if (finished) return;

  player.vx = 0;

  if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
  if (keys.ArrowRight || keys.d) player.vx = player.speed;

  player.x += player.vx;

  // Impede atravessar as laterais das plataformas.
  player.x = Math.max(0, Math.min(worldWidth - player.w, player.x));

  // Gravidade
  player.vy += 0.5;
  player.y += player.vy;
  player.grounded = false;

  // Colisão com o topo das plataformas
  for (const p of platforms) {
    const overlaps =
      player.x + player.w > p.x &&
      player.x < p.x + p.w;

    const wasAbove =
      player.y + player.h - player.vy <= p.y;

    const isFalling = player.vy >= 0;

    if (
      overlaps &&
      isFalling &&
      wasAbove &&
      player.y + player.h >= p.y
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  // Coleta de moedas
  coins.forEach(c => {
    const touching =
      player.x < c.x + 10 &&
      player.x + player.w > c.x - 10 &&
      player.y < c.y + 10 &&
      player.y + player.h > c.y - 10;

    if (!c.got && touching) {
      c.got = true;
      score++;
      scoreText.textContent = score;
    }
  });

  // Cair ou alcançar a saída
  if (player.y > canvas.height + 50) {
    finished = true;
    message.textContent = "Você caiu! Clique em Recomeçar.";
  }

  if (player.x > 1490 && player.y + player.h >= 350) {
    if (level < 3) {
      nextLevel();
    } else {
      finished = true;
      won = true;
      message.textContent =
        "Parabéns! Você completou as 3 fases!";
    }
  }

  // Câmera acompanha o personagem
  cameraX = Math.max(
    0,
    Math.min(worldWidth - canvas.width, player.x - 250)
  );
}

function draw() {
  drawWorld();

  if (finished && won) {
    ctx.fillStyle = "rgba(23, 32, 51, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "AVENTURA CONCLUÍDA!",
      canvas.width / 2,
      canvas.height / 2
    );

    ctx.textAlign = "left";
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function jump() {
  if (player.grounded && !finished) {
    player.vy = player.jump;
    player.grounded = false;
  }
}

window.addEventListener("keydown", event => {
  if ([
    "ArrowLeft", "ArrowRight", "ArrowUp", " "
  ].includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (
    event.key === "ArrowUp" ||
    event.key === " " ||
    event.key === "w"
  ) {
    jump();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key] = false;
});

function bindButton(id, key) {
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[key] = true;
    button.setPointerCapture(event.pointerId);
  });

  const release = () => {
    keys[key] = false;
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

bindButton("left", "ArrowLeft");
bindButton("right", "ArrowRight");

document.getElementById("jump").addEventListener("pointerdown", event => {
  event.preventDefault();
  jump();
});

document.getElementById("restart").addEventListener("click", restartGame);

buildLevel();
gameLoop();