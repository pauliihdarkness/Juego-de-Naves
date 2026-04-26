// ===========================
// CLASE JUGADOR
// ===========================

const xwingSprites = {
    1: new Image(),
    2: new Image()
};
const xwingSpriteLoaded = {
    1: false,
    2: false
};

xwingSprites[1].src = 'assets/sprites/x-wing-player-1.png';
xwingSprites[2].src = 'assets/sprites/x-wing-player-2.png';

xwingSprites[1].onload = () => {
    xwingSpriteLoaded[1] = true;
};

xwingSprites[2].onload = () => {
    xwingSpriteLoaded[2] = true;
};

class Player {
    constructor(x, y, id = 1, audio = null, game = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.audio = audio;
        this.game = game;
        this.width = 24;
        this.height = 32;
        this.vx = 0;
        this.vy = 0;
        this.speed = 300; // píxeles/segundo
        this.rotation = 0;
        
        // Salud
        this.health = 100;
        this.maxHealth = 100;
        this.invincibleTime = 0;
        this.invincibilityDuration = 2; // segundos
        
        // Disparo
        this.bullets = [];
        this.baseFireRate = 0.1; // segundos entre disparos
        this.fireRate = this.baseFireRate;
        this.fireTimer = 0;
        
        // Armas adicionales
        this.secondaryCooldown = 3.0; // Misil (3 seg)
        this.secondaryTimer = 0;
        this.tertiaryCooldown = 1.5; // Escopeta (1.5 seg)
        this.tertiaryTimer = 0;
        
        this.bulletSpeed = 500;
        this.powerup = null;
        this.powerupTime = 0;
        
        // Habilidades
        this.score = 0;
        this.level = 1;
        this.isAlive = true;
        
        // Color del jugador
        this.color = id === 1 ? '#ff0000' : '#0000ff';
        this.accentColor = id === 1 ? '#ff6666' : '#6666ff';
    }

    handleInput(input) {
        if (!this.isAlive) return;
        this.vx = 0;
        this.vy = 0;

        const gamepad = input.getGamepadState(this.id - 1);
        let up = false;
        let down = false;
        let left = false;
        let right = false;
        let fire = false;
        let fireSecondary = false;
        let fireTertiary = false;

        if (this.id === 1) {
            // Jugador 1: WASD + Flechas + gamepad 1
            up = input.isKeyPressed('w') || input.isKeyPressed('arrowup');
            down = input.isKeyPressed('s') || input.isKeyPressed('arrowdown');
            left = input.isKeyPressed('a') || input.isKeyPressed('arrowleft');
            right = input.isKeyPressed('d') || input.isKeyPressed('arrowright');
            fire = input.isKeyPressed(' ') || input.isKeyPressed('m');
            fireSecondary = input.isKeyPressed('shift');
            fireTertiary = input.isKeyPressed('e');
        } else {
            // Jugador 2: IJKL + gamepad 2
            up = input.isKeyPressed('i');
            down = input.isKeyPressed('k');
            left = input.isKeyPressed('j');
            right = input.isKeyPressed('l');
            fire = input.isKeyPressed('p');
            fireSecondary = input.isKeyPressed('o');
            fireTertiary = input.isKeyPressed('u');
        }

        if (gamepad) {
            up = up || gamepad.axes[1] < -0.4 || input.isGamepadButtonPressed(this.id - 1, 'dpadUp');
            down = down || gamepad.axes[1] > 0.4 || input.isGamepadButtonPressed(this.id - 1, 'dpadDown');
            left = left || gamepad.axes[0] < -0.4 || input.isGamepadButtonPressed(this.id - 1, 'dpadLeft');
            right = right || gamepad.axes[0] > 0.4 || input.isGamepadButtonPressed(this.id - 1, 'dpadRight');
            fire = fire || input.isGamepadButtonPressed(this.id - 1, 'fire');
            fireSecondary = fireSecondary || input.isGamepadButtonPressed(this.id - 1, 'fireSecondary');
            fireTertiary = fireTertiary || input.isGamepadButtonPressed(this.id - 1, 'fireTertiary');
        }

        if (up) this.vy -= this.speed;
        if (down) this.vy += this.speed;
        if (left) this.vx -= this.speed;
        if (right) this.vx += this.speed;

        // Normalizar movimiento diagonal
        const moveSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (moveSpeed > 0) {
            this.vx = (this.vx / moveSpeed) * this.speed;
            this.vy = (this.vy / moveSpeed) * this.speed;
            this.rotation = Math.atan2(this.vy, this.vx);
        }

        const aimX = this.x + Math.cos(this.rotation) * 20;
        const aimY = this.y + Math.sin(this.rotation) * 20;

        if (fire) {
            this.fire(aimX, aimY);
        }
        if (fireSecondary) {
            this.fireSecondary(aimX, aimY);
        }
        if (fireTertiary) {
            this.fireTertiary(aimX, aimY);
        }
    }

    fire(x, y) {
        if (!this.isAlive) return false;
        if (this.fireTimer <= 0) {
            let shootAngle = this.rotation;
            if (x !== undefined && y !== undefined) {
                shootAngle = Math.atan2(y - this.y, x - this.x);
            }

            const speedX = Math.cos(shootAngle) * this.bulletSpeed;
            const speedY = Math.sin(shootAngle) * this.bulletSpeed;

            const wingOffset = this.width * 1.4;
            const forwardOffset = this.height * 1.0;
            const wingAngle = Math.PI / 2;

            const leftTipX = this.x + Math.cos(shootAngle - wingAngle) * wingOffset + Math.cos(shootAngle) * forwardOffset;
            const leftTipY = this.y + Math.sin(shootAngle - wingAngle) * wingOffset + Math.sin(shootAngle) * forwardOffset;
            const rightTipX = this.x + Math.cos(shootAngle + wingAngle) * wingOffset + Math.cos(shootAngle) * forwardOffset;
            const rightTipY = this.y + Math.sin(shootAngle + wingAngle) * wingOffset + Math.sin(shootAngle) * forwardOffset;

            const leftBullet = {
                x: leftTipX,
                y: leftTipY,
                vx: speedX,
                vy: speedY,
                radius: 3,
                damage: 10,
                playerId: this.id
            };

            const rightBullet = {
                x: rightTipX,
                y: rightTipY,
                vx: speedX,
                vy: speedY,
                radius: 3,
                damage: 10,
                playerId: this.id
            };

            // Mejorar calidad del RapidFire: triple tiro con dispersión y proyectil central pesado
            if (this.powerup === 'rapidFire') {
                const centerBullet = {
                    x: this.x + Math.cos(shootAngle) * (forwardOffset + 5),
                    y: this.y + Math.sin(shootAngle) * (forwardOffset + 5),
                    vx: speedX * 1.2,
                    vy: speedY * 1.2,
                    radius: 4,
                    damage: 15,
                    playerId: this.id
                };
                
                const spreadAngle = 0.15;
                leftBullet.vx = Math.cos(shootAngle - spreadAngle) * this.bulletSpeed;
                leftBullet.vy = Math.sin(shootAngle - spreadAngle) * this.bulletSpeed;
                rightBullet.vx = Math.cos(shootAngle + spreadAngle) * this.bulletSpeed;
                rightBullet.vy = Math.sin(shootAngle + spreadAngle) * this.bulletSpeed;

                this.bullets.push(leftBullet, centerBullet, rightBullet);
            } else {
                this.bullets.push(leftBullet, rightBullet);
            }

            this.fireTimer = this.fireRate;
            if (this.audio) {
                this.audio.playSound('laser');
            }
            return true;
        }
        return false;
    }

    fireSecondary(x, y) {
        if (!this.isAlive || this.secondaryTimer > 0) return false;

        let shootAngle = this.rotation;
        if (x !== undefined && y !== undefined) {
            shootAngle = Math.atan2(y - this.y, x - this.x);
        }

        const forwardOffset = this.height * 1.0;

        this.bullets.push({
            x: this.x + Math.cos(shootAngle) * forwardOffset,
            y: this.y + Math.sin(shootAngle) * forwardOffset,
            vx: Math.cos(shootAngle) * 350, // Más lento
            vy: Math.sin(shootAngle) * 350,
            radius: 8,      // Proyectil explosivo enorme
            damage: 80,     // Daño masivo
            type: 'missile', 
            playerId: this.id
        });

        this.secondaryTimer = this.secondaryCooldown;

        if (this.audio) {
            this.audio.playSound('missile');
        }
        return true;
    }

    fireTertiary(x, y) {
        if (!this.isAlive || this.tertiaryTimer > 0) return false;

        let shootAngle = this.rotation;
        if (x !== undefined && y !== undefined) {
            shootAngle = Math.atan2(y - this.y, x - this.x);
        }

        const forwardOffset = this.height * 0.8;
        const pCount = 7;
        const spread = Math.PI / 3.5; // Apertura ancha (Escopeta)
        
        for (let i = 0; i < pCount; i++) {
            const angleOffset = -spread/2 + (spread / (pCount - 1)) * i;
            const finalAngle = shootAngle + angleOffset;
            const speedVar = this.bulletSpeed * (0.9 + Math.random() * 0.3); 
            
            this.bullets.push({
                x: this.x + Math.cos(shootAngle) * forwardOffset,
                y: this.y + Math.sin(shootAngle) * forwardOffset,
                vx: Math.cos(finalAngle) * speedVar,
                vy: Math.sin(finalAngle) * speedVar,
                radius: 2,
                damage: 8, // Bajo repetición, altísimo daño conjunto (56 pts max)
                type: 'shotgun',
                playerId: this.id
            });
        }

        this.tertiaryTimer = this.tertiaryCooldown;

        if (this.audio) {
            this.audio.playSound('shotgun');
        }
        return true;
    }

    update(dt, gameWidth, gameHeight) {
        if (!this.isAlive) {
            // Permitir que las balas previas sigan su curso aunque muera
            this.bullets = this.bullets.filter(bullet => {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
                return bullet.x > -10 && bullet.x < gameWidth + 10 &&
                       bullet.y > -10 && bullet.y < gameHeight + 10;
            });
            return;
        }

        // Movimiento
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Limitar el movimiento dentro de los límites
        this.x = clamp(this.x, this.width / 2, gameWidth - this.width / 2);
        this.y = clamp(this.y, this.height / 2, gameHeight - this.height / 2);
        
        // Actualizar invencibilidad
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
        }

        // Efecto visual: chispas si el chasis está gravemente dañado
        if (this.health < this.maxHealth * 0.4 && Math.random() < 0.15) {
            if (this.game && this.game.particles) {
                this.game.particles.emitSparks(this.x, this.y, this.rotation + Math.PI, 1, '#ff3300');
            }
        }
        
        // Actualizar power-up
        if (this.powerupTime > 0) {
            this.powerupTime -= dt;
            if (this.powerupTime <= 0) {
                this.clearPowerUp();
            }
        }
        
        // Actualizar timer de disparo
        this.fireTimer -= dt;
        if (this.secondaryTimer > 0) this.secondaryTimer -= dt;
        if (this.tertiaryTimer > 0) this.tertiaryTimer -= dt;
        
        // Actualizar balas
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            return bullet.x > -10 && bullet.x < gameWidth + 10 &&
                   bullet.y > -10 && bullet.y < gameHeight + 10;
        });
    }

    takeDamage(amount, knockbackDirection = null, knockbackForce = 0) {
        if (!this.isAlive) return;

        if (this.invincibleTime <= 0) {
            // El PowerUP de Escudo reduce el daño un 80% y anula el retroceso
            if (this.powerup === 'shield') {
                amount = Math.ceil(amount * 0.2);
                knockbackForce = 0;
            }

            this.health -= amount;
            this.invincibleTime = this.invincibilityDuration;
            
            // Aplicar knockback si se proporciona
            if (knockbackDirection && knockbackForce > 0) {
                const knockbackX = Math.cos(knockbackDirection) * knockbackForce;
                const knockbackY = Math.sin(knockbackDirection) * knockbackForce;
                this.x += knockbackX;
                this.y += knockbackY;
                
                // Limitar el movimiento dentro de los límites después del knockback
                this.x = clamp(this.x, this.width / 2, 1280 - this.width / 2);
                this.y = clamp(this.y, this.height / 2, 720 - this.height / 2);
            }
            
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
                
                // Crear efecto de explosión cuando el jugador muere
                if (this.game) {
                    this.game.createImpactEffect(this.x, this.y, 'explosion', this.color);
                    this.game.audio.playSound('explosion');
                }
            }
        }
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    applyPowerUp(type, duration = 8) {
        this.powerup = type;
        this.powerupTime = duration * 1.5; // Añade 50% de duración a todos (12s aprox)
        
        // Mejoras extremas para rapidFire
        if (type === 'rapidFire') {
            this.fireRate = Math.max(0.04, this.baseFireRate * 0.45); 
        } else if (type === 'shield') {
            this.fireRate = this.baseFireRate;
            this.health = Math.min(this.health + 30, this.maxHealth); // Shield recupera un trozo de vida instantáneamente
        }
    }

    clearPowerUp() {
        this.powerup = null;
        this.powerupTime = 0;
        this.fireRate = this.baseFireRate;
    }

    addScore(points) {
        this.score += points;
        // Aumentar nivel cada 1000 puntos
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }
    }

    draw(ctx) {
        // Las balas deben dibujarse siempre, incluso si el jugador murió
        this.bullets.forEach(bullet => {
            drawProjectile(ctx, bullet, 'rgba(0, 255, 136, 0.95)');
        });

        // No dibujar chasis si el jugador no está vivo
        if (!this.isAlive) return;
        
        const sprite = xwingSprites[this.id] || xwingSprites[1];
        const spriteReady = xwingSpriteLoaded[this.id];
        const thrustPower = clamp(Math.sqrt(this.vx * this.vx + this.vy * this.vy) / this.speed, 0, 1);

        if (spriteReady && sprite.width > 0 && sprite.height > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation + Math.PI / 2);

            const scale = 0.085;
            const spriteWidth = sprite.width * scale;
            const spriteHeight = sprite.height * scale;

            if (this.powerup === 'shield') {
                ctx.strokeStyle = 'rgba(120, 210, 255, 0.72)';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(spriteWidth, spriteHeight) * 0.72, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.powerup === 'rapidFire') {
                ctx.strokeStyle = 'rgba(255, 230, 120, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(spriteWidth, spriteHeight) * 0.65, 0, Math.PI * 1.2);
                ctx.stroke();
            }

            if (thrustPower > 0.05) {
                ctx.fillStyle = `rgba(100, 180, 255, ${0.25 + thrustPower * 0.35})`;
                ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
                ctx.shadowBlur = 12;

                const flameBase = spriteWidth * 0.2;
                const flameLength = spriteHeight * 0.2 * (0.8 + thrustPower * 0.6);
                const flameY = spriteHeight * 0.3;

                ctx.beginPath();
                ctx.moveTo(-flameBase, flameY);
                ctx.lineTo(-flameBase * 1.3, flameY + flameLength);
                ctx.lineTo(0, flameY + flameLength * 1.1);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(flameBase, flameY);
                ctx.lineTo(flameBase * 1.3, flameY + flameLength);
                ctx.lineTo(0, flameY + flameLength * 1.1);
                ctx.closePath();
                ctx.fill();

                ctx.shadowBlur = 0;
            }

            ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.powerup === 'shield') {
                ctx.strokeStyle = 'rgba(120, 210, 255, 0.72)';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, 26, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.powerup === 'rapidFire') {
                ctx.strokeStyle = 'rgba(255, 230, 120, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 26, 0, Math.PI * 1.2);
                ctx.stroke();
            }

            if (thrustPower > 0.05) {
                ctx.fillStyle = `rgba(100, 180, 255, ${0.25 + thrustPower * 0.35})`;
                ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
                ctx.shadowBlur = 12;

                const flameLength = 16 + thrustPower * 12;
                ctx.beginPath();
                ctx.moveTo(-6, 10);
                ctx.lineTo(-10, 10 + flameLength);
                ctx.lineTo(-2, 10 + flameLength * 1.2);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(6, 10);
                ctx.lineTo(10, 10 + flameLength);
                ctx.lineTo(2, 10 + flameLength * 1.2);
                ctx.closePath();
                ctx.fill();

                ctx.shadowBlur = 0;
            }

            // Efecto de invencibilidad
            // Estructura X-wing con Neon Glow
            const isInvincible = this.invincibleTime > 0;
            
            // Falso Glow Perimetral
            ctx.fillStyle = this.color;
            ctx.globalAlpha = isInvincible ? 0.4 : 0.15;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = isInvincible ? 0.7 : 1.0;
            ctx.fillStyle = '#111111'; // Oscuro internamente
            ctx.strokeStyle = this.color; // Líneas Neon del color del jugador
            ctx.lineWidth = 2.5;

            // Alas superiores e inferiores
            ctx.beginPath();
            ctx.moveTo(-12, -18);
            ctx.lineTo(-10, -18);
            ctx.lineTo(-4, -5);
            ctx.lineTo(10, -8);
            ctx.lineTo(10, -4);
            ctx.lineTo(-4, -2);
            ctx.lineTo(-10, -18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-12, 18);
            ctx.lineTo(-10, 18);
            ctx.lineTo(-4, 5);
            ctx.lineTo(10, 8);
            ctx.lineTo(10, 4);
            ctx.lineTo(-4, 2);
            ctx.lineTo(-10, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Fuselaje
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(10, -10);
            ctx.lineTo(16, 0);
            ctx.lineTo(10, 10);
            ctx.lineTo(-6, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cockpit Neon brillante
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(2, 0, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Detalles rojos/azules en alas
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-8, -16);
            ctx.lineTo(8, -10);
            ctx.moveTo(-8, 16);
            ctx.lineTo(8, 10);
            ctx.stroke();

            ctx.restore();
        }

    }

    emitThrust(particleSystem) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 20) return;

        const intensity = clamp(speed / this.speed, 0, 1);
        const backOffset = 8;
        const wingOffset = 12;
        const baseX = this.x + Math.cos(this.rotation + Math.PI) * backOffset;
        const baseY = this.y + Math.sin(this.rotation + Math.PI) * backOffset;

        const leftEngineX = baseX + Math.cos(this.rotation - Math.PI / 2) * wingOffset;
        const leftEngineY = baseY + Math.sin(this.rotation - Math.PI / 2) * wingOffset;
        const rightEngineX = baseX + Math.cos(this.rotation + Math.PI / 2) * wingOffset;
        const rightEngineY = baseY + Math.sin(this.rotation + Math.PI / 2) * wingOffset;

        const engineCount = Math.max(3, Math.round(4 + intensity * 6));
        const isP1 = this.id === 1;
        // Paleta Neón / Plasma
        const colors = isP1 ? ['#ff00ff', '#ff33aa', '#aa00ff'] : ['#00ffff', '#33aaff', '#00ffaa'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const particleAngle = this.rotation + Math.PI;
        const spread = Math.PI / 5;
        const speedMin = 80 + intensity * 20;
        const speedMax = 120 + intensity * 40;
        const lifeMin = 0.12;
        const lifeMax = 0.25;

        particleSystem.emitDirectional(leftEngineX, leftEngineY, engineCount, color, particleAngle, spread, speedMin, speedMax, lifeMin, lifeMax, 0);
        particleSystem.emitDirectional(rightEngineX, rightEngineY, engineCount, color, particleAngle, spread, speedMin, speedMax, lifeMin, lifeMax, 0);
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.score = 0;
        this.health = this.maxHealth;
        this.invincibleTime = this.invincibilityDuration;
        this.powerup = null;
        this.bullets = [];
        this.isAlive = true;
    }
}

console.log('✓ Player cargado');
