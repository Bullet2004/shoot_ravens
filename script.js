const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = innerWidth;
collisionCanvas.height = innerHeight;

let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;

let score = 0;
let gameOver = false;
ctx.font = '50px Impact';

let ravens = [];
const backgroundMusic = new Audio('halloween2.wav');
backgroundMusic.loop = true; // Loop the music

// Play the music after a user interaction, such as clicking the canvas
window.addEventListener('click', function() {
    if (!backgroundMusic.playing) {
        backgroundMusic.play();
    }
});

class Raven {
    constructor() {
        this.spriteWidth = 271;
        this.spriteHeight = 194;
        this.sizeModifier = Math.random() * 0.6 + 0.4;
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.directionX = Math.random()*5 + 3;
        this.directionY = Math.random()*5 - 2.5;
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = 'raven.png';
        this.frame = 0;
        this.maxFrame = 4;
        this.timeSinceSlap = 0;
        this.flapInterval = Math.random()*50 + 50;
        this.randomColors = [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)];
        this.color = 'rgb(' + this.randomColors[0] + ',' + this.randomColors[1] + ',' + this.randomColors[2] + ')';
        this.hasTrail = Math.random() > 0.5;
    }
    update(deltatime) {
        if (this.y < 0 || this.y > canvas.height - this.height) {
            this.directionY = this.directionX * -1;
        } 
        this.x -= this.directionX;
        this.y += this.directionY;
        if (this.x < 0 - this.width) this.markedForDeletion = true;
        this.timeSinceSlap += deltatime;
        if(this.timeSinceSlap > this.flapInterval) {
            if (this.frame > this.maxFrame) this.frame = 0;
            else this.frame++;
            this.timeSinceSlap = 0;
            if (this.hasTrail) {
                for(let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x, this.y, this.width, this.color));
                }
            }
        }
        if (this.x < 0 - this.width) gameOver = true;
    }
    draw() {
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.frame*this.spriteWidth ,0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

let particles = [];
class Particle {
    constructor(x, y, size, color) {
        this.x = x + size / 2;  
        this.y = y + size / 3;
        this.size = size;
        this.radius = Math.random() * this.size / 10; 
        this.maxRadius = Math.random() * 20 + 35; 
        this.markedForDeletion = false;
        this.speedX = Math.random() * 1 + 0.5;
        this.color = color;
    }
    update() {
        this.x += this.speedX; 
        this.radius += 0.3; 
        if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = 1 - this.radius/this.maxRadius;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fill();
        ctx.restore();
    }
}


let explosions = [];
class Explosions {
    constructor(x, y, size) {
        this.image = new Image();
        this.image.src = 'boom.png';
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = 'Fire impact 1.wav';
        this.timeSinceLastFrame = 0;
        this.frameInterval = 100;
        this.markedForDeletion = false;
    }
    update(deltaTime) {
        if (this.frame === 0) this.sound.play();
        this.timeSinceLastFrame += deltaTime;
        if (this.timeSinceLastFrame > this.frameInterval) {
            this.frame++;
            this.timeSinceLastFrame = 0;
            if (this.frame > 5) this.markedForDeletion = true;
        }
    }
    draw() {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size/4, this.size, this.size);
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.fillText('Score: ' + score, 50, 75);
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 50, 80);
}

function drawGameOver() {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2, canvas.height/2);
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width/2 + 5, canvas.height/2+5);
    if (!backgroundMusic.paused) {
        backgroundMusic.pause(); 
        backgroundMusic.currentTime = 0;  
    }
}

window.addEventListener('click', function(e) {
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
    const pc = detectPixelColor.data;
    ravens.forEach(object => {
        if(object.randomColors[0] === pc[0] && object.randomColors[1] === pc[1] && object.randomColors[2] === pc[2]) {
            object.markedForDeletion = true;
            score++;
            explosions.push(new Explosions(object.x, object.y, object.width));
        }
    })
})

const raven = new Raven();

function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextRaven += deltaTime;
    if(timeToNextRaven > ravenInterval) {
        ravens.push(new Raven());
        timeToNextRaven = 0;
        ravens.sort(function(a,b) {
            return a.width - b.width;
        })
    };
    drawScore();
    [...particles, ...ravens, ...explosions].forEach(object => object.update(deltaTime));
    [...particles, ...ravens, ...explosions].forEach(object => object.draw());
    ravens = ravens.filter(object => !object.markedForDeletion);
    explosions = explosions.filter(object => !object.markedForDeletion);
    particles = particles.filter(object => !object.markedForDeletion);
    if (!gameOver) requestAnimationFrame(animate);
    else drawGameOver();
}

animate(0);