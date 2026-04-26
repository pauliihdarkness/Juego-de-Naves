// ===========================
// UTILIDADES Y HELPERS
// ===========================

/**
 * Clase para manejar eventos y callback
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

/**
 * Calcula la distancia entre dos puntos
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula el ángulo entre dos puntos (en radianes)
 */
function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Genera un número aleatorio entre min y max
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Genera un número entero aleatorio entre min y max
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Verifica colisión rectangular
 */
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Verifica colisión circular
 */
function checkCircleCollision(circle1, circle2) {
    const dx = circle2.x - circle1.x;
    const dy = circle2.y - circle1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

/**
 * Limita un valor entre min y max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Suaviza la transición entre dos valores
 */
function lerp(start, end, t) {
    return start + (end - start) * clamp(t, 0, 1);
}

function drawProjectile(ctx, bullet, color = '#00ff88') {
    const angle = Math.atan2(bullet.vy, bullet.vx);
    const trailLength = Math.max(20, bullet.radius * 9);
    const coreWidth = Math.max(2, bullet.radius * 0.6);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(angle);

    if (bullet.type === 'missile') {
        // DISEÑO DE MISIL PREMIUM
        const missileSize = bullet.radius * 2.5;

        // 1. Fuego del motor (Flicker)
        const flicker = Math.random() * 5;
        const grad = ctx.createLinearGradient(-missileSize * 2 - flicker, 0, 0, 0);
        grad.addColorStop(0, 'rgba(255, 50, 0, 0)');
        grad.addColorStop(0.5, 'rgba(255, 150, 0, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 200, 1)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, missileSize * 0.4);
        ctx.lineTo(-missileSize * 3 - flicker, 0);
        ctx.lineTo(0, -missileSize * 0.4);
        ctx.fill();

        // 2. Cuerpo del misil (Metálico / Negro espacial)
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-missileSize, -missileSize * 0.5);
        ctx.lineTo(missileSize * 0.5, -missileSize * 0.5);
        ctx.lineTo(missileSize, 0); // Punta
        ctx.lineTo(missileSize * 0.5, missileSize * 0.5);
        ctx.lineTo(-missileSize, missileSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Aletas
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-missileSize * 0.8, -missileSize * 0.5);
        ctx.lineTo(-missileSize * 1.2, -missileSize * 1.1);
        ctx.lineTo(-missileSize * 0.4, -missileSize * 0.5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-missileSize * 0.8, missileSize * 0.5);
        ctx.lineTo(-missileSize * 1.2, missileSize * 1.1);
        ctx.lineTo(-missileSize * 0.4, missileSize * 0.5);
        ctx.fill();

        // 4. Luz de rastreo (Intermitente)
        if (Math.sin(Date.now() / 50) > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(missileSize * 0.2, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

    } else {
        // DISEÑO DE LÁSER ESTÁNDAR (Existente)
        // Halo Neon Transparente
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = bullet.radius * 3.5;
        ctx.beginPath();
        ctx.moveTo(-trailLength * 0.4, 0);
        ctx.lineTo(trailLength * 0.8, 0);
        ctx.stroke();

        // Estela exterior color base
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = color;
        ctx.lineWidth = bullet.radius * 1.5;
        ctx.beginPath();
        ctx.moveTo(-trailLength * 0.2, 0);
        ctx.lineTo(trailLength * 0.8, 0);
        ctx.stroke();

        // Estela interior plasma supercaliente
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = coreWidth;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(trailLength * 0.9, 0);
        ctx.stroke();

        // Cabeza del proyectil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(trailLength * 0.8, 0, coreWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Gestiona el audio del juego
 */
class AudioManager {
    constructor() {
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.sounds = {};
        this.musicTracks = {};
        this.currentMusic = null;
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        if (this.audioContext) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            this.audioContext = new AudioCtx();
        }
    }

    loadSound(name, pathOrConfig) {
        if (typeof pathOrConfig === 'string') {
            const audio = new Audio(pathOrConfig);
            audio.preload = 'auto';
            this.sounds[name] = { element: audio };
        } else {
            this.sounds[name] = pathOrConfig;
        }
    }

    loadMusic(name, path) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.preload = 'auto';
        this.musicTracks[name] = audio;
    }

    playMusic(name) {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }

        const track = this.musicTracks[name];
        if (track) {
            this.currentMusic = track;
            if (this.musicEnabled) {
                track.play().catch(err => console.log('Error playing music:', err));
            }
        }
    }

    playSound(name) {
        if (!this.soundEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;

        if (sound.element) {
            const audio = sound.element.cloneNode();
            audio.play().catch(err => console.log('Error playing sound:', err));
            return;
        }

        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => this.playTone(sound)).catch(() => this.playTone(sound));
            } else {
                this.playTone(sound);
            }
        }
    }

    playTone(config) {
        const { 
            type = 'sine', 
            frequency = 440, 
            frequencyEnd = null,
            duration = 0.12, 
            volume = 0.15, 
            attack = 0.01, 
            release = 0.05, 
            detune = 0 
        } = config;

        if (!this.audioContext) {
            this.initAudioContext();
            if (!this.audioContext) return;
        }

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        
        if (frequencyEnd) {
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, frequencyEnd), now + duration);
        }

        oscillator.detune.setValueAtTime(detune, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + duration + release + 0.02);
    }

    setupDefaultSounds() {
        this.loadSound('laser', {
            type: 'square', frequency: 1800, frequencyEnd: 300, duration: 0.15, volume: 0.12, attack: 0.001, release: 0.05, detune: 0
        });

        this.loadSound('explosion', {
            type: 'sawtooth', frequency: 150, frequencyEnd: 10, duration: 0.35, volume: 0.35, attack: 0.01, release: 0.3, detune: -50
        });

        this.loadSound('hit', {
            type: 'square', frequency: 300, frequencyEnd: 100, duration: 0.08, volume: 0.15, attack: 0.001, release: 0.05, detune: 50
        });

        this.loadSound('powerup', {
            type: 'sine', frequency: 400, frequencyEnd: 1600, duration: 0.25, volume: 0.15, attack: 0.02, release: 0.1, detune: 0
        });

        // Cargar música de la carpeta assets/sounds/music/
        this.loadMusic('menu', 'assets/sounds/music/Grid Runner.mp3');
        this.loadMusic('game', 'assets/sounds/music/Photon Run.mp3');
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (this.currentMusic) {
            if (enabled) {
                this.currentMusic.play().catch(err => console.log('Error playing music:', err));
            } else {
                this.currentMusic.pause();
            }
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
}



/**
 * Gestiona los controles del juego
 */
class InputManager {
    constructor() {
        this.keys = {};
        this.gamepadDeadzone = 0.3;
        this.listeners = {};
        this.gamepads = [];
        this.previousGamepadButtons = [];
        this.previousGamepadAxes = [];

        // Escuchar eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('gamepadconnected', (e) => this.handleGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.handleGamepadDisconnected(e));
    }

    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        this.emitKeyEvent('down', event.key.toLowerCase());
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
        this.emitKeyEvent('up', event.key.toLowerCase());
    }

    handleGamepadConnected(event) {
        this.gamepads[event.gamepad.index] = event.gamepad;
        console.log('Gamepad conectado:', event.gamepad.id);
    }

    handleGamepadDisconnected(event) {
        delete this.gamepads[event.gamepad.index];
        console.log('Gamepad desconectado:', event.gamepad.id);
    }

    pollGamepads() {
        const rawGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        this.previousGamepadButtons = this.gamepads.map((g) => g.buttons.slice());
        this.previousGamepadAxes = this.gamepads.map((g) => g.axes.slice());
        this.gamepads = [];

        for (let i = 0; i < rawGamepads.length; i++) {
            const gamepad = rawGamepads[i];
            if (!gamepad) continue;

            this.gamepads[i] = {
                axes: gamepad.axes.map(axis => Math.abs(axis) < this.gamepadDeadzone ? 0 : axis),
                buttons: gamepad.buttons.map(button => button.pressed)
            };
        }
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    getGamepadState(index = 0) {
        return this.gamepads[index] || null;
    }

    getGamepadAxes(index = 0) {
        const gamepad = this.getGamepadState(index);
        return gamepad ? gamepad.axes : [];
    }

    isGamepadButtonPressed(index, action) {
        const gamepad = this.getGamepadState(index);
        if (!gamepad) return false;

        const map = {
            fire: [0, 7], // Botón A o Gatillo Derecho (RT)
            fireSecondary: [1, 4], // Botón B o Bumper Izquierdo (LB)
            fireTertiary: [2, 5], // Botón X o Bumper Derecho (RB)
            action: [0, 1, 2, 3],
            confirm: [0, 9],
            back: [8, 1],
            start: [9],
            dpadUp: [12],
            dpadDown: [13],
            dpadLeft: [14],
            dpadRight: [15]
        };

        const buttons = map[action] || [];
        return buttons.some(indexButton => gamepad.buttons[indexButton]);
    }

    isGamepadButtonJustPressed(index, action) {
        const gamepad = this.getGamepadState(index);
        if (!gamepad) return false;

        const previousButtons = this.previousGamepadButtons[index] || [];
        const map = {
            fire: [0, 7], // Botón A o Gatillo Derecho (RT)
            fireSecondary: [1, 4], // Botón B o Bumper Izquierdo (LB)
            fireTertiary: [2, 5], // Botón X o Bumper Derecho (RB)
            action: [0, 1, 2, 3],
            confirm: [0, 9],
            back: [8, 1],
            start: [9],
            dpadUp: [12],
            dpadDown: [13],
            dpadLeft: [14],
            dpadRight: [15]
        };

        const buttons = map[action] || [];
        return buttons.some(indexButton => gamepad.buttons[indexButton] && !previousButtons[indexButton]);
    }

    isGamepadAxisJustPressed(index, axisName) {
        const axes = this.getGamepadAxes(index);
        const prevAxes = this.previousGamepadAxes[index] || [];
        if (!axes.length) return false;

        const threshold = 0.6;
        const axisMap = {
            up: { idx: 1, dir: -1 },
            down: { idx: 1, dir: 1 },
            left: { idx: 0, dir: -1 },
            right: { idx: 0, dir: 1 }
        };

        const mapping = axisMap[axisName];
        if (!mapping) return false;

        const value = axes[mapping.idx] || 0;
        const prevValue = prevAxes[mapping.idx] || 0;
        const pressed = mapping.dir === -1 ? value < -threshold : value > threshold;
        const prevPressed = mapping.dir === -1 ? prevValue < -threshold : prevValue > threshold;

        return pressed && !prevPressed;
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emitKeyEvent(type, key) {
        const event = `key:${type}:${key}`;
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb());
        }
    }
}

/**
 * Gestiona la cámara
 */
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.zoom = 1;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothness = 0.1;
    }

    follow(target) {
        this.targetX = target.x - this.width / 2;
        this.targetY = target.y - this.height / 2;
    }

    update() {
        this.x = lerp(this.x, this.targetX, this.smoothness);
        this.y = lerp(this.y, this.targetY, this.smoothness);
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}

/**
 * Gestiona las partículas para efectos visuales
 */
class Particle {
    constructor(x, y, vx = 0, vy = 0, color = '#00ff88', life = 1, gravity = 0.1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 3;
        this.gravity = gravity;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.vy += this.gravity;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Falso Glow (Círculo extra transparente)
        ctx.globalAlpha = (this.life / this.maxLife) * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = '#ffffff'; // Núcleo brillante
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Sistema de partículas
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count = 10, color = '#00ff88') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const vx = Math.cos(angle) * random(2, 5);
            const vy = Math.sin(angle) * random(2, 5);
            this.particles.push(new Particle(x, y, vx, vy, color, random(0.3, 0.8)));
        }
    }

    emitDirectional(x, y, count = 10, color = '#00ff88', angle = 0, spread = Math.PI / 6, speedMin = 2, speedMax = 5, lifeMin = 0.2, lifeMax = 0.6, gravity = 0) {
        for (let i = 0; i < count; i++) {
            const particleAngle = angle + random(-spread / 2, spread / 2);
            const speed = random(speedMin, speedMax);
            const vx = Math.cos(particleAngle) * speed;
            const vy = Math.sin(particleAngle) * speed;
            const life = random(lifeMin, lifeMax);
            this.particles.push(new Particle(x, y, vx, vy, color, life, gravity));
        }
    }

    emitExplosion(x, y, color = '#ffaa00', count = 30) {
        for (let i = 0; i < count; i++) {
            const angle = random(0, Math.PI * 2);
            const speed = random(60, 220);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = random(0.3, 0.8);
            // Si el color no es naranja (ej es un enemigo), meter colores sintéticos
            const isNeon = color !== '#ffaa00';
            let explosionColor = color;
            if (isNeon) {
                explosionColor = i % 3 === 0 ? color : (i % 3 === 1 ? '#ffffff' : '#00ffff');
            } else {
                explosionColor = i % 2 === 0 ? color : '#ffffff';
            }
            this.particles.push(new Particle(x, y, vx, vy, explosionColor, life, 0.05));
        }
    }

    emitSparks(x, y, direction, count = 8, color = '#ffff88') {
        for (let i = 0; i < count; i++) {
            const spread = Math.PI / 3;
            const angle = direction + random(-spread / 2, spread / 2);
            const speed = random(80, 150);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = random(0.2, 0.4);
            this.particles.push(new Particle(x, y, vx, vy, color, life, 0.1));
        }
    }

    emitShockwave(x, y, color = '#ffffff', radius = 50) {
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const vx = Math.cos(angle) * 100;
            const vy = Math.sin(angle) * 100;
            this.particles.push(new Particle(x, y, vx, vy, color, 0.3, 0));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => !p.isDead());
        this.particles.forEach(p => p.update(dt));
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

console.log('✓ Utils cargado');
