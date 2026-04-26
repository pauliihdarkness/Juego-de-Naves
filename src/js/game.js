// ===========================
// CLASE ITEM DE RECUPERACIÓN
// ===========================

class PickupItem {
    constructor(x, y, type = 'health', amount = 25, effect = 'rapidFire') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.amount = amount;
        this.effect = effect;
        this.radius = 14;
        this.life = 12;
        this.maxLife = 12;
        this.angle = 0;
        if (type === 'health') {
            this.color = '#4cff91';
        } else if (type === 'powerup') {
            this.color = effect === 'shield' ? '#5ad3ff' : '#5ac8ff';
        } else {
            this.color = '#ffffff';
        }
    }

    update(dt) {
        this.life -= dt;
        this.angle += dt * 2.5;
    }

    draw(ctx) {
        const pulse = Math.sin(Date.now() / 200) * 0.15 + 0.85;
        const opacity = Math.max(0, this.life / this.maxLife);

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Aura / Resplandor exterior (Glow)
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 0.4 * opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Anillo de energía exterior (Giratorio solo si no es salud)
        ctx.save();
        if (this.type !== 'health') {
            ctx.rotate(-this.angle * 0.5);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 3. Cuerpo de Cristal (Glassmorphism) - Solo rota si no es salud
        if (this.type !== 'health') {
            ctx.rotate(this.angle * 1.5);
        }
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.9 * opacity;
        ctx.beginPath();
        if (this.type === 'health') {
            // Forma hexagonal para salud
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                const px = Math.cos(angle) * this.radius;
                const py = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
        } else {
            // Forma de rombo para powerups
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0);
        }
        ctx.closePath();
        ctx.fill();

        // Borde brillante
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Icono central con brillo propio
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';

        if (this.type === 'health') {
            // Cruz de salud 3D
            ctx.beginPath();
            ctx.rect(-2.5, -7, 5, 14);
            ctx.rect(-7, -2.5, 14, 5);
            ctx.fill();
        } else if (this.effect === 'shield') {
            // Icono de Escudo
            ctx.beginPath();
            ctx.moveTo(0, 7);
            ctx.bezierCurveTo(-6, 5, -6, -2, -6, -5);
            ctx.lineTo(0, -8);
            ctx.lineTo(6, -5);
            ctx.bezierCurveTo(6, -2, 6, 5, 0, 7);
            ctx.fill();
        } else {
            // Rayo de energía (Rapid Fire)
            ctx.beginPath();
            ctx.moveTo(-3, -7);
            ctx.lineTo(1, -1);
            ctx.lineTo(-1, -1);
            ctx.lineTo(3, 7);
            ctx.lineTo(-1, 1);
            ctx.lineTo(1, 1);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// ===========================
// CLASE JUEGO PRINCIPAL
// ===========================

class Game {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width || 1280;
        this.height = height || 720;

        // Configurar canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Jugadores
        this.players = [];
        this.numberPlayers = 2;

        // Sistemas
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.audio.setupDefaultSounds();
        this.createPlayers();

        // Enemigos
        this.enemies = [];
        this.spawnQueue = []; // Cola para aparición progresiva
        this.spawnTimer = 0;
        this.waveCounter = 0;
        this.currentLevel = 1;
        this.items = [];

        this.aiSystem = new AISystem();
        this.particles = new ParticleSystem(300);
        this.thrustParticles = new ParticleSystem(200);
        this.camera = new Camera(this.width, this.height);

        // Efectos de pantalla
        this.screenShake = {
            intensity: 0,
            duration: 0,
            offsetX: 0,
            offsetY: 0
        };
        this.screenFlash = {
            color: null,
            intensity: 0,
            duration: 0
        };

        // Estado del juego
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.isPaused = false; // Estado de pausa del juego
        this.score = 0;
        this.time = 0;
        this.deltaTime = 0;
        this.lastFrameTime = Date.now();

        // Configuración
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.difficulty = 'normal';

        // Timers para optimización
        this.hudUpdateTimer = 0;

        // Monitoreo de FPS
        this.frameCount = 0;
        this.fps = 60;
        this.fpsTimer = 0;

        // Cachear gradientes para rendimiento
        this.backgroundGradient = this.ctx.createLinearGradient(0, this.height - 150, 0, this.height);
        this.backgroundGradient.addColorStop(0, 'rgba(255, 0, 150, 0)');
        this.backgroundGradient.addColorStop(1, 'rgba(255, 0, 150, 0.05)');

        // Navegación de menú con gamepad
        this.menuInteractives = [];
        this.menuSelectionIndex = 0;

        // Setup de eventos
        this.setupEventListeners();
        this.updatePlayerPanels();
        this.updateMenuInteractives();

        // Cargar datos guardados
        this.loadData();

        // Hacer la instancia de juego global
        window.game = this;

        // Iniciar música inicial
        this.audio.playMusic('menu');
    }

    loadData() {
        try {
            // Cargar configuración
            const settings = localStorage.getItem('juegoNaves_settings');
            if (settings) {
                const data = JSON.parse(settings);
                this.soundEnabled = data.soundEnabled ?? true;
                this.musicEnabled = data.musicEnabled ?? true;
                this.difficulty = data.difficulty ?? 'normal';

                // Actualizar UI
                document.getElementById('soundCheck').checked = this.soundEnabled;
                document.getElementById('musicCheck').checked = this.musicEnabled;
                document.getElementById('difficultySelect').value = this.difficulty;

                this.audio.soundEnabled = this.soundEnabled;
                this.audio.musicEnabled = this.musicEnabled;
            }

            // Cargar High Score
            this.highScore = parseInt(localStorage.getItem('juegoNaves_highscore')) || 0;
            document.getElementById('mainHighScore').textContent = this.highScore;
        } catch (e) {
            console.error('Error cargando datos:', e);
        }
    }

    saveSettings() {
        const data = {
            soundEnabled: this.soundEnabled,
            musicEnabled: this.musicEnabled,
            difficulty: this.difficulty
        };
        localStorage.setItem('juegoNaves_settings', JSON.stringify(data));
    }

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('juegoNaves_highscore', this.highScore.toString());
            document.getElementById('mainHighScore').textContent = this.highScore;
            return true;
        }
        return false;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error al intentar activar pantalla completa: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    createPlayers() {
        this.players = [
            new Player(this.width / 4, this.height / 4, 1, this.audio, this)
        ];

        if (this.numberPlayers > 1) {
            this.players.push(new Player((this.width * 3) / 4, (this.height * 3) / 4, 2, this.audio, this));
        }
    }

    setupEventListeners() {
        // Menú principal
        // Menú Principal
        document.getElementById('startBtn').addEventListener('click', () => this.showModeSelection());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());

        // Selección de Modo
        document.getElementById('mode1PBtn').addEventListener('click', () => {
            this.numberPlayers = 1;
            this.createPlayers();
            this.updatePlayerPanels();
            this.startGame();
        });
        document.getElementById('mode2PBtn').addEventListener('click', () => {
            this.numberPlayers = 2;
            this.createPlayers();
            this.updatePlayerPanels();
            this.startGame();
        });
        document.getElementById('backModeBtn').addEventListener('click', () => this.hideModeSelection());

        // Instrucciones
        document.getElementById('backBtn').addEventListener('click', () => this.hideInstructions());

        // Configuración
        document.getElementById('backSettingsBtn').addEventListener('click', () => this.hideSettings());

        // Sonido
        document.getElementById('soundCheck').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.audio.soundEnabled = this.soundEnabled;
            this.saveSettings();
        });

        // Música
        document.getElementById('musicCheck').addEventListener('change', (e) => {
            this.musicEnabled = e.target.checked;
            this.audio.musicEnabled = this.musicEnabled;
            if (this.musicEnabled) this.audio.playMusic(this.gameState === 'playing' ? 'game' : 'menu');
            else this.audio.stopMusic();
            this.saveSettings();
        });

        // Dificultad
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.saveSettings();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('exitBtn').addEventListener('click', () => {
            if (confirm('¿Seguro que quieres salir del juego?')) {
                window.close();
                // Fallback para navegadores que bloquean window.close()
                alert('Si estás en un navegador, cierra la pestaña manualmente. En el ejecutable se cerrará automáticamente.');
            }
        });

        // Evento de cambio de pantalla completa
        document.addEventListener('fullscreenchange', () => {
            const btn = document.getElementById('fullscreenBtn');
            if (btn) {
                if (document.fullscreenElement) {
                    btn.textContent = '📺 SALIR DE PANTALLA COMPLETA';
                } else {
                    btn.textContent = '📺 PANTALLA COMPLETA';
                }
            }
        });

        // Game Over
        document.getElementById('retryBtn').addEventListener('click', () => this.startGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.goToMenu());

        // Disparar
        document.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                this.players.forEach(p => p.fire(mouseX, mouseY));
            }
        });

        // Disparos con teclado
        this.input.on('key:down:space', () => {
            if (this.gameState === 'playing' && !this.isPaused) {
                this.players[0].fire(this.width / 2, this.height / 2);
            }
        });

        this.input.on('key:down:enter', () => {
            if (this.gameState === 'playing' && !this.isPaused && this.players[1]) {
                this.players[1].fire(this.width / 2, this.height / 2);
            }
        });

        // Controles de pausa y volver al menú
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.togglePause();
            }
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.togglePause();
            }
        });

        document.getElementById('pauseSettingsBtn').addEventListener('click', () => {
            if (this.isPaused) {
                this.showSettings();
            }
        });

        document.getElementById('returnMenuBtn').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.goToMenu();
            }
        });

        document.getElementById('hudMenuBtn').addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.goToMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing') {
                if (e.key === 'Escape') {
                    if (this.isPaused) {
                        this.togglePause();
                    } else {
                        this.goToMenu();
                    }
                }
            }
        });
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    addScreenFlash(color, intensity, duration) {
        this.screenFlash.color = color;
        this.screenFlash.intensity = Math.max(this.screenFlash.intensity, intensity);
        this.screenFlash.duration = Math.max(this.screenFlash.duration, duration);
    }

    createImpactEffect(x, y, type = 'hit', color = '#ffffff', direction = 0) {
        switch (type) {
            case 'bulletHit':
                this.particles.emit(x, y, 8, color);
                this.particles.emit(x, y, 4, '#ffffff');
                this.particles.emitSparks(x, y, direction, 6, '#ffff88');
                this.addScreenShake(2, 0.1);
                break;
            case 'wingHit':
                this.particles.emit(x, y, 12, '#ffaa44');
                this.particles.emit(x, y, 6, '#ffffff');
                this.particles.emitSparks(x, y, direction, 10, '#ff8844');
                this.addScreenShake(4, 0.15);
                this.addScreenFlash('#ffaa44', 0.3, 0.1);
                break;
            case 'explosion':
                this.particles.emitExplosion(x, y, color, 40);
                this.particles.emitShockwave(x, y, '#ffffff', 60);
                this.addScreenShake(8, 0.3);
                this.addScreenFlash(color, 0.5, 0.2);
                break;
            case 'playerHit':
                this.particles.emit(x, y, 15, '#ff6666');
                this.particles.emit(x, y, 8, '#ffffff');
                this.particles.emitSparks(x, y, direction, 8, '#ff6666');
                this.addScreenShake(6, 0.2);
                this.addScreenFlash('#ff6666', 0.4, 0.15);
                break;
            case 'collision':
                this.particles.emit(x, y, 20, '#ffaa00');
                this.particles.emitShockwave(x, y, '#ffaa00', 40);
                this.addScreenShake(10, 0.25);
                this.addScreenFlash('#ffaa00', 0.6, 0.2);
                break;
        }
    }

    updateMenuInteractives() {
        // Primero intentamos buscar un menú activo (Ajustes, Instrucciones, etc.)
        let activeContainer = document.querySelector('.menu.active');

        // Si no hay un menú activo pero el juego está en pausa, usamos el overlay de pausa
        if (!activeContainer && this.isPaused) {
            activeContainer = document.getElementById('pauseOverlay');
        }

        if (!activeContainer || (activeContainer.id === 'pauseOverlay' && activeContainer.classList.contains('hidden'))) {
            this.menuInteractives = [];
            this.menuSelectionIndex = 0;
            return;
        }

        this.menuInteractives = Array.from(activeContainer.querySelectorAll('button.menu-btn, select, input[type="checkbox"]'));

        // Añadir listeners de mouse para sincronizar con el gamepad
        this.menuInteractives.forEach((element, index) => {
            // Solo añadir si no tiene ya el listener (usando una propiedad temporal para marcarlo)
            if (!element.dataset.mouseSync) {
                element.addEventListener('mouseenter', () => {
                    this.menuSelectionIndex = index;
                    element.focus();
                });
                element.dataset.mouseSync = 'true';
            }
        });

        if (this.menuSelectionIndex >= this.menuInteractives.length) {
            this.menuSelectionIndex = 0;
        }

        if (this.menuInteractives.length > 0) {
            this.menuInteractives[this.menuSelectionIndex].focus();
        }
    }

    setMenuSelectionIndex(index) {
        if (!this.menuInteractives.length) return;
        this.menuSelectionIndex = ((index % this.menuInteractives.length) + this.menuInteractives.length) % this.menuInteractives.length;
        this.menuInteractives[this.menuSelectionIndex].focus();
    }

    modifySelectValue(selectElement, delta) {
        if (!selectElement || selectElement.tagName !== 'SELECT') return;
        const newIndex = clamp(selectElement.selectedIndex + delta, 0, selectElement.options.length - 1);
        selectElement.selectedIndex = newIndex;
        selectElement.dispatchEvent(new Event('change'));
    }

    activateCurrentMenuItem() {
        const current = this.menuInteractives[this.menuSelectionIndex];
        if (!current) return;

        if (current.tagName === 'BUTTON') {
            current.click();
        } else if (current.tagName === 'SELECT') {
            this.modifySelectValue(current, 1);
        }
    }

    handleMenuBack() {
        if (document.getElementById('settingsScreen').classList.contains('active')) {
            this.hideSettings();
        } else if (document.getElementById('instructionsScreen').classList.contains('active')) {
            this.hideInstructions();
        } else if (this.gameState === 'gameOver' || document.getElementById('mainMenu').classList.contains('active')) {
            this.goToMenu();
        }
    }

    handleMenuGamepadInput() {
        for (let i = 0; i < 4; i++) {
            const movedDown = this.input.isGamepadButtonJustPressed(i, 'dpadDown') || this.input.isGamepadAxisJustPressed(i, 'down');
            const movedUp = this.input.isGamepadButtonJustPressed(i, 'dpadUp') || this.input.isGamepadAxisJustPressed(i, 'up');
            const movedLeft = this.input.isGamepadButtonJustPressed(i, 'dpadLeft') || this.input.isGamepadAxisJustPressed(i, 'left');
            const movedRight = this.input.isGamepadButtonJustPressed(i, 'dpadRight') || this.input.isGamepadAxisJustPressed(i, 'right');

            if (movedDown) {
                this.setMenuSelectionIndex(this.menuSelectionIndex + 1);
                continue;
            }
            if (movedUp) {
                this.setMenuSelectionIndex(this.menuSelectionIndex - 1);
                continue;
            }
            if (movedLeft) {
                const current = this.menuInteractives[this.menuSelectionIndex];
                if (current && current.tagName === 'SELECT') {
                    this.modifySelectValue(current, -1);
                }
                continue;
            }
            if (movedRight) {
                const current = this.menuInteractives[this.menuSelectionIndex];
                if (current && current.tagName === 'SELECT') {
                    this.modifySelectValue(current, 1);
                }
                continue;
            }
            if (this.input.isGamepadButtonJustPressed(i, 'confirm')) {
                this.activateCurrentMenuItem();
                break;
            }
            if (this.input.isGamepadButtonJustPressed(i, 'back')) {
                this.handleMenuBack();
                break;
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        const pauseBtn = document.getElementById('pauseBtn');

        if (pauseOverlay) {
            pauseOverlay.classList.toggle('hidden', !this.isPaused);
        }

        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
        }

        // Si se acaba de pausar, actualizar interactivos para gamepad
        if (this.isPaused) {
            this.menuSelectionIndex = 0;
            this.updateMenuInteractives();
        }
    }

    updatePlayerPanels() {
        // Ya no hay sidebars, pero mantenemos la lógica por si acaso
    }

    startGame() {
        this.gameState = 'playing';
        this.isPaused = false;
        this.time = 0;
        this.currentLevel = 1;
        this.waveCounter = 0;
        this.players.forEach((p, index) => {
            const xPosition = this.width / 4 + index * (this.width / 2);
            p.reset(xPosition, this.height / 2);
        });
        this.enemies = [];
        this.spawnQueue = []; // Limpiar la cola de aparición
        this.particles.clear();
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('gameOverScreen').classList.remove('active');
        document.getElementById('modeSelectionScreen').classList.remove('active');
        this.updatePlayerPanels();
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '⏸️';

        // Iniciar música del juego
        this.audio.playMusic('game');

        this.spawnWave();
    }

    goToMenu() {
        this.gameState = 'menu';
        this.isPaused = false;
        document.getElementById('mainMenu').classList.add('active');
        document.getElementById('gameOverScreen').classList.remove('active');
        document.getElementById('settingsScreen').classList.remove('active');
        document.getElementById('instructionsScreen').classList.remove('active');
        document.getElementById('modeSelectionScreen').classList.remove('active');

        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '⏸️';

        // Iniciar música del menú
        this.audio.playMusic('menu');

        this.updateMenuInteractives();
    }

    showModeSelection() {
        this.menuSelectionIndex = 0;
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('modeSelectionScreen').classList.add('active');
        this.updateMenuInteractives();
    }

    hideModeSelection() {
        this.menuSelectionIndex = 0;
        document.getElementById('modeSelectionScreen').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
        this.updateMenuInteractives();
    }

    showInstructions() {
        this.menuSelectionIndex = 0;
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('instructionsScreen').classList.add('active');
        this.updateMenuInteractives();
    }

    hideInstructions() {
        this.menuSelectionIndex = 0;
        document.getElementById('instructionsScreen').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
        this.updateMenuInteractives();
    }

    showSettings() {
        this.menuSelectionIndex = 0;
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('pauseOverlay').classList.add('hidden'); // Ocultar pausa si estaba abierta
        document.getElementById('settingsScreen').classList.add('active');
        this.updateMenuInteractives();
    }

    hideSettings() {
        this.menuSelectionIndex = 0;
        document.getElementById('settingsScreen').classList.remove('active');

        if (this.isPaused) {
            document.getElementById('pauseOverlay').classList.remove('hidden');
        } else {
            document.getElementById('mainMenu').classList.add('active');
        }

        this.updateMenuInteractives();
    }

    spawnWave() {
        this.waveCounter++;

        // Multiplicador de cantidad de enemigos según dificultad
        let diffMultiplier = 1;
        switch (this.difficulty) {
            case 'easy': diffMultiplier = 0.7; break;
            case 'normal': diffMultiplier = 1.0; break;
            case 'hard': diffMultiplier = 1.4; break;
            case 'nightmare': diffMultiplier = 2.2; break;
        }

        const enemyCount = Math.round((3 + this.currentLevel * 2) * diffMultiplier);

        for (let i = 0; i < enemyCount; i++) {
            let type = 'basic';
            if (Math.random() < this.currentLevel * 0.1) type = 'scout';
            if (Math.random() < this.currentLevel * 0.05) type = 'tank';
            if (this.waveCounter % 10 === 0 && i === 0) type = 'boss';

            const x = Math.random() < 0.5 ? -100 : this.width + 100;
            const y = random(50, this.height - 50);

            // Agregar a la cola en lugar de directamente a la escena
            this.spawnQueue.push({ x, y, type, level: this.currentLevel });
        }
    }

    update() {
        const now = Date.now();
        this.deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.033); // máx 30ms
        this.lastFrameTime = now;
        this.time += this.deltaTime;

        // Monitoreo de FPS
        this.frameCount++;
        this.fpsTimer += this.deltaTime;
        if (this.fpsTimer >= 1) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        // Actualizar entrada de gamepads
        this.input.pollGamepads();

        if (this.gameState !== 'playing' || this.isPaused) {
            this.handleMenuGamepadInput();

            // Si está pausado, solo permitimos alternar pausa con Start
            for (let i = 0; i < 4; i++) {
                if (this.input.isGamepadButtonJustPressed(i, 'start')) {
                    this.togglePause();
                    break;
                }
            }
            return;
        }

        // Pausa/resume con el botón Start del gamepad (cuando no está pausado)
        for (let i = 0; i < 4; i++) {
            if (this.input.isGamepadButtonJustPressed(i, 'start')) {
                this.togglePause();
                break;
            }
        }

        // Actualizar screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= this.deltaTime;
            this.screenShake.offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
            if (this.screenShake.duration <= 0) {
                this.screenShake.offsetX = 0;
                this.screenShake.offsetY = 0;
            }
        }

        // Actualizar screen flash
        if (this.screenFlash.duration > 0) {
            this.screenFlash.duration -= this.deltaTime;
            if (this.screenFlash.duration <= 0) {
                this.screenFlash.color = null;
                this.screenFlash.intensity = 0;
            }
        }

        // Actualizar entrada
        this.players.forEach(p => p.handleInput(this.input));

        // Actualizar jugadores
        this.players.forEach(p => {
            p.update(this.deltaTime, this.width, this.height);
            p.emitThrust(this.thrustParticles);
        });

        // Procesar cola de aparición (Spawning progresivo)
        if (this.spawnQueue.length > 0) {
            this.spawnTimer -= this.deltaTime;
            if (this.spawnTimer <= 0) {
                const data = this.spawnQueue.shift();
                const newEnemy = new Enemy(data.x, data.y, data.type, data.level);
                this.enemies.push(newEnemy);

                // Efecto visual de entrada (warp/teleport)
                this.particles.emitShockwave(data.x, data.y, newEnemy.color, 40);

                // Resetear timer para la siguiente aparición (0.5 a 0.8 segundos entre naves)
                this.spawnTimer = 0.6;
            }
        }

        // Actualizar enemigos
        this.enemies = this.enemies.filter(e => e.isAlive || e.bullets.length > 0);
        this.enemies.forEach(e => {
            e.update(this.deltaTime, this.players, this.width, this.height, this.aiSystem);
            // Efecto visual: si un enemigo está por morir suelta fuego
            if (e.isAlive && e.health < e.maxHealth * 0.4 && Math.random() < 0.1) {
                this.particles.emitSparks(e.x, e.y, e.rotation + Math.PI, 1, '#ffaa00');
            }
        });

        // Actualizar items
        this.items = this.items.filter(item => !item.isDead()).slice(0, 10); // Limitar a 10 items
        this.items.forEach(item => item.update(this.deltaTime));

        // Recoger items
        this.players.forEach(player => {
            this.items = this.items.filter(item => {
                const collided = checkCircleCollision(
                    { x: player.x, y: player.y, radius: 16 },
                    { x: item.x, y: item.y, radius: item.radius }
                );

                if (!collided) {
                    return true;
                }

                if (item.type === 'health' && player.health < player.maxHealth) {
                    player.heal(item.amount);
                    this.particles.emit(item.x, item.y, 12, '#4cff91');
                    this.audio.playSound('powerup');
                    return false;
                }

                if (item.type === 'powerup') {
                    player.applyPowerUp(item.effect || 'rapidFire', item.amount);
                    this.particles.emit(item.x, item.y, 14, '#5ac8ff');
                    this.audio.playSound('powerup');
                    return false;
                }

                return true;
            });
        });

        // IA
        this.aiSystem.coordinateEnemyAttack(this.enemies, this.players);
        this.players.forEach(p => this.aiSystem.analyzePlayerBehavior(p, this.deltaTime));

        // Inteligencia de Misiles (Rastreo)
        this.players.forEach(p => {
            p.bullets.forEach(bullet => {
                if (bullet.type === 'missile' && !bullet.hit) {
                    let closestEnemy = null;
                    let closestDist = Infinity;
                    this.enemies.forEach(e => {
                        if (e.isAlive) {
                            const d = Math.sqrt(Math.pow(e.x - bullet.x, 2) + Math.pow(e.y - bullet.y, 2));
                            if (d < closestDist) {
                                closestDist = d;
                                closestEnemy = e;
                            }
                        }
                    });

                    if (closestEnemy && closestDist < 600) {
                        const targetAngle = Math.atan2(closestEnemy.y - bullet.y, closestEnemy.x - bullet.x);
                        const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                        const rotationSpeed = 5 * this.deltaTime;

                        let angleDiff = targetAngle - currentAngle;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotationSpeed);

                        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) + 8; // Propulsor acelera
                        bullet.vx = Math.cos(newAngle) * Math.min(speed, 800);
                        bullet.vy = Math.sin(newAngle) * Math.min(speed, 800);
                    }

                    // Efecto de estela de humo y fuego denso
                    if (Math.random() < 0.6) {
                        const angle = Math.atan2(bullet.vy, bullet.vx);
                        // Fuego de motor (Naranja/Amarillo)
                        this.particles.emitDirectional(bullet.x, bullet.y, 1, '#ff6600', angle + Math.PI, 0.4, 40, 80, 0.1, 0.3);
                        // Humo pesado (Gris/Azulado)
                        if (Math.random() < 0.3) {
                            this.particles.emitDirectional(bullet.x, bullet.y, 1, '#444466', angle + Math.PI, 0.8, 20, 40, 0.4, 0.8);
                        }
                    }
                }
            });
        });

        // Detectar colisiones entre balas de jugadores y enemigos
        this.players.forEach(player => {
            player.bullets.forEach(bullet => {
                if (bullet.hit) return;
                this.enemies.forEach(enemy => {
                    if (bullet.hit) return;
                    const collision = enemy.checkBulletCollision(bullet);
                    if (collision.hit) {
                        const damage = collision.wing ? bullet.damage * 1.5 : bullet.damage;
                        enemy.takeDamage(damage);
                        player.addScore(10); // Otorga 10 puntos fijos por cada acierto
                        bullet.hit = true;

                        const effectColor = collision.wing ? '#ffcc66' : player.color;
                        const bulletDirection = Math.atan2(bullet.vy, bullet.vx);
                        this.createImpactEffect(bullet.x, bullet.y, collision.wing ? 'wingHit' : 'bulletHit', effectColor, bulletDirection);
                        this.audio.playSound('hit');

                        if (!enemy.isAlive) {
                            player.addScore(enemy.score); // Otorga todo el puntaje base del enemigo al destruirlo
                            this.createImpactEffect(enemy.x, enemy.y, 'explosion', enemy.color);
                            this.particles.emitShockwave(enemy.x, enemy.y, enemy.color, enemy.width * 2);
                            if (Math.random() < 0.25) {
                                this.items.push(new PickupItem(enemy.x, enemy.y, 'health', 30));
                            }
                            if (Math.random() < 0.12) {
                                const effect = Math.random() < 0.55 ? 'rapidFire' : 'shield';
                                this.items.push(new PickupItem(enemy.x, enemy.y, 'powerup', 8, effect));
                            }
                            this.audio.playSound('explosion');
                        }
                    }
                });
            });
        });

        // Detectar colisiones entre balas de enemigos y jugadores
        this.enemies.forEach(enemy => {
            enemy.bullets.forEach(bullet => {
                if (bullet.hit) return;
                this.players.forEach(player => {
                    if (bullet.hit) return;
                    if (checkCircleCollision(bullet, { x: player.x, y: player.y, radius: 15 })) {
                        const bulletDirection = Math.atan2(bullet.vy, bullet.vx);
                        const knockbackForce = 15;
                        player.takeDamage(bullet.damage, bulletDirection, knockbackForce);
                        bullet.hit = true;
                        this.createImpactEffect(bullet.x, bullet.y, 'playerHit', '#ff6666', bulletDirection);
                        this.audio.playSound('hit');
                    }
                });
            });
        });

        // Detectar colisiones entre jugadores y enemigos
        this.players.forEach(player => {
            this.enemies.forEach(enemy => {
                if (checkCircleCollision(
                    { x: player.x, y: player.y, radius: 15 },
                    { x: enemy.x, y: enemy.y, radius: Math.max(28, enemy.width * 0.7) }
                )) {
                    // Calcular dirección del impacto para efectos
                    const impactDirection = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    const knockbackForce = 25;

                    player.takeDamage(45, impactDirection + Math.PI, knockbackForce); // Aumentado a 45 de daño por choque cuerpo a cuerpo
                    enemy.takeDamage(30);
                    this.createImpactEffect((player.x + enemy.x) / 2, (player.y + enemy.y) / 2, 'collision', '#ffaa00', impactDirection);
                }
            });
        });

        // Actualizar partículas
        this.thrustParticles.update(this.deltaTime);
        this.particles.update(this.deltaTime);

        // Limpiar balas manteniendo su trayectoria completa
        this.players.forEach(p => {
            p.bullets = p.bullets.filter(b => {
                return !b.hit &&
                    b.x > -10 && b.x < this.width + 10 &&
                    b.y > -10 && b.y < this.height + 10;
            });
        });

        this.enemies.forEach(e => {
            e.bullets = e.bullets.filter(b => {
                return !b.hit &&
                    b.x > -10 && b.x < this.width + 10 &&
                    b.y > -10 && b.y < this.height + 10;
            });
        });

        // Verificar si necesita nueva ola (Todos muertos y cola vacía)
        if (this.enemies.length === 0 && this.spawnQueue.length === 0 && this.time > 2) {
            this.currentLevel++;
            this.spawnWave();
        }

        // Verificar game over
        const allPlayersDead = this.players.every(p => !p.isAlive);
        if (allPlayersDead) {
            this.endGame();
        }

        // Actualizar HUD cada 0.1 segundos para mejorar rendimiento
        this.hudUpdateTimer += this.deltaTime;
        if (this.hudUpdateTimer >= 0.1) {
            this.updateHUD();
            this.hudUpdateTimer = 0;
        }
    }

    updateHUD() {
        document.getElementById('player1-score').textContent = this.players[0].score;
        const player2Score = document.getElementById('player2-score');
        const player2Health = document.getElementById('player2-health');
        const player2HealthText = document.getElementById('player2-health-text');

        if (this.players[1]) {
            if (player2Score) player2Score.textContent = this.players[1].score;
        }

        document.getElementById('level').textContent = this.currentLevel;

        const health1 = document.getElementById('player1-health');
        const healthText1 = document.getElementById('player1-health-text');

        if (health1 && healthText1) {
            const p1Health = this.players[0].getHealthPercentage();
            health1.style.setProperty('--health-fill', p1Health + '%');
            healthText1.textContent = Math.round(p1Health) + '%';

            // Efecto de vida crítica
            if (p1Health < 30) health1.classList.add('low-health');
            else health1.classList.remove('low-health');
        }

        if (this.players[1] && player2Health && player2HealthText) {
            const p2Health = this.players[1].getHealthPercentage();
            player2Health.style.setProperty('--health-fill', p2Health + '%');
            player2HealthText.textContent = Math.round(p2Health) + '%';

            // Efecto de vida crítica
            if (p2Health < 30) player2Health.classList.add('low-health');
            else player2Health.classList.remove('low-health');
        }

        // Actualizar FPS
        const fpsDisplay = document.getElementById('fps-display');
        if (fpsDisplay) {
            fpsDisplay.textContent = 'FPS: ' + this.fps;
        }
    }

    endGame() {
        this.gameState = 'gameOver';
        this.menuSelectionIndex = 0;

        const s1 = this.players[0].score;
        const s2 = this.players[1] ? this.players[1].score : 0;
        const totalScore = s1 + s2;

        document.getElementById('finalScore1').textContent = s1;
        document.getElementById('finalScore2').textContent = s2;
        document.getElementById('gameOverScreen').classList.add('active');

        // Verificar récord
        const isNewRecord = this.saveHighScore(totalScore);
        const recordMsg = document.getElementById('newRecordMsg');
        if (recordMsg) {
            recordMsg.classList.toggle('hidden', !isNewRecord);
        }

        // Detener música de acción (o cambiarla)
        this.audio.playMusic('menu');

        this.updateMenuInteractives();
    }

    draw() {
        // 1. Dibujar el fondo Synthwave primero (incluye el borrado de pantalla)
        this.drawBackground();

        // 2. Aplicar screen shake y efectos de luz DEBAJO de la UI
        this.ctx.save();
        this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);

        // 3. Aplicar modo aditivo para objetos brillantes solo
        this.ctx.globalCompositeOperation = 'lighter';

        // Dibujar game objects (Partículas debajo de naves)
        this.thrustParticles.draw(this.ctx);
        this.particles.draw(this.ctx);

        // Volver a composición normal para naves (para que bloqueen el brillo detrás)
        this.ctx.globalCompositeOperation = 'source-over';

        // Las naves y los items con opacidad normal
        this.enemies.forEach(e => e.draw(this.ctx));
        this.players.forEach(p => p.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));

        this.ctx.restore();

        // 4. Aplicar screen flash al final para que cubra toda la acción
        if (this.screenFlash.color && this.screenFlash.intensity > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.screenFlash.intensity;
            this.ctx.fillStyle = this.screenFlash.color;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
    }

    drawBackground() {
        // Fondo base super oscuro con ligero tono púrpura/azul
        this.ctx.fillStyle = 'rgb(5, 2, 15)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Estrellas profundas (Capa 1 - Lenta)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 80; i++) {
            const x = (this.time * 5 + i * 87) % this.width;
            const y = (this.time * 10 + i * 43) % this.height;
            this.ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Estrellas rojizas/cyan brillantes (Capa 2 - Rápida)
        for (let i = 0; i < 30; i++) {
            const isCyan = i % 2 === 0;
            this.ctx.fillStyle = isCyan ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 255, 0.5)';
            const x = (this.time * 15 + i * 113) % this.width;
            const y = (this.time * 40 + i * 67) % this.height;
            this.ctx.fillRect(x, y, 2, 2);
        }

        // --- Cuadrícula Synthwave 3D simulada en el suelo ---
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 0, 150, 0.15)'; // Magenta Neon
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();

        // Líneas verticales moviéndose ligeramente con parallax
        const gridSpacingY = 80;
        const gridSpacingX = 80;
        const offsetX = (this.time * 20) % gridSpacingX;
        const offsetY = (this.time * 60) % gridSpacingY;

        for (let x = -gridSpacingX; x < this.width + gridSpacingX; x += gridSpacingX) {
            this.ctx.moveTo(x + offsetX, 0);
            this.ctx.lineTo(x + offsetX, this.height);
        }
        for (let y = -gridSpacingY; y < this.height + gridSpacingY; y += gridSpacingY) {
            this.ctx.moveTo(0, y + offsetY);
            this.ctx.lineTo(this.width, y + offsetY);
        }

        this.ctx.stroke();

        // Un gradiente desde abajo para simular "Horizonte"
        this.ctx.fillStyle = this.backgroundGradient;
        this.ctx.fillRect(0, this.height - 150, this.width, 150);

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

console.log('✓ Game cargado');
