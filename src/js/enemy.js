// ===========================
// CLASE ENEMIGO
// ===========================

class Enemy {
    constructor(x, y, type = 'basic', level = 1, colorVariant = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        this.colorVariant = colorVariant; // Variación de color
        this.vx = 0;
        this.vy = 0;
        this.health = 20;
        this.maxHealth = 20;
        this.score = 50;
        this.isAlive = true;
        this.rotation = 0;
        this.turnRate = Math.PI; // rad/s
        
        // Configurar según tipo
        this.configureByType();
        
        // Disparos
        this.bullets = [];
        this.fireRate = 1.5;
        this.fireTimer = Math.random() * this.fireRate;
        this.bulletSpeed = 300;
        
        // IA
        this.aiState = 'patrol'; // patrol, chase, attack, flee
        this.targetX = x;
        this.targetY = y;
        this.targetPlayer = null; // Jugador objetivo actual
        this.detectionRange = 300;
        this.attackRange = 200;
        this.pathfindingTimer = 0;
        
        this.color = '#00ff00';
        this.accentColor = '#00aa00';
    }

    configureByType() {
        // Multiplicador de dificultad global (basado en la configuración del juego)
        const diffMultiplier = this.getDifficultyMultiplier();
        // Escalamiento por nivel (un pequeño incremento por cada nivel avanzado)
        const levelScale = 1 + (this.level - 1) * 0.15;
        const finalScale = diffMultiplier * levelScale;

        // Variaciones de color por tipo
        const colorVariants = {
            basic: ['#00ff00', '#32cd32', '#00aa00', '#228b22', '#006400'], // Verdes
            scout: ['#00ffff', '#00bfff', '#1e90ff', '#4169e1', '#0000ff'], // Cyans y azules
            tank: ['#ff6600', '#ff8c00', '#ffa500', '#ff4500', '#dc143c'], // Naranjas y rojos
            boss: ['#ff00ff', '#ff1493', '#da70d6', '#ba55d3', '#9932cc']  // Magentas y púrpuras
        };

        // Seleccionar variación de color
        const variants = colorVariants[this.type] || ['#ffffff'];
        if (this.colorVariant === null) {
            this.colorVariant = Math.floor(Math.random() * variants.length);
        }
        const selectedColor = variants[this.colorVariant] || variants[0];

        switch (this.type) {
            case 'basic':
                this.width = 25;
                this.height = 25;
                this.speed = 150 * (1 + (this.level - 1) * 0.05);
                this.health = 20 * finalScale;
                this.maxHealth = this.health;
                this.score = 50;
                this.color = selectedColor;
                this.accentColor = this.adjustBrightness(selectedColor, -0.3);
                this.fireRate = 2 / (1 + (this.level - 1) * 0.08); // Dispara más rápido en niveles altos
                break;
            case 'scout':
                this.width = 20;
                this.height = 20;
                this.speed = 250 * (1 + (this.level - 1) * 0.07);
                this.health = 15 * finalScale;
                this.maxHealth = this.health;
                this.score = 75;
                this.color = selectedColor;
                this.accentColor = this.adjustBrightness(selectedColor, -0.3);
                this.fireRate = 1.5 / (1 + (this.level - 1) * 0.1);
                this.detectionRange = 400;
                break;
            case 'tank':
                this.width = 40;
                this.height = 40;
                this.speed = 100 * (1 + (this.level - 1) * 0.03);
                this.health = 60 * finalScale;
                this.maxHealth = this.health;
                this.score = 150;
                this.color = selectedColor;
                this.accentColor = this.adjustBrightness(selectedColor, -0.3);
                this.fireRate = 0.8 / (1 + (this.level - 1) * 0.05);
                this.attackRange = 250;
                break;
            case 'boss':
                this.width = 70;
                this.height = 70;
                this.speed = 130 * (1 + (this.level - 1) * 0.05);
                this.health = 250 * finalScale * 1.5; // El boss escala más fuerte
                this.maxHealth = this.health;
                this.score = 500;
                this.color = selectedColor;
                this.accentColor = this.adjustBrightness(selectedColor, -0.3);
                this.fireRate = 0.5 / (1 + (this.level - 1) * 0.12);
                this.attackRange = 400;
                this.detectionRange = 1200;
                break;
        }
    }

    getDifficultyMultiplier() {
        // Si el juego está disponible globalmente, buscamos su configuración
        if (window.game && window.game.difficulty) {
            switch (window.game.difficulty) {
                case 'easy': return 0.7;
                case 'normal': return 1.0;
                case 'hard': return 1.4;
                case 'nightmare': return 2.0;
                default: return 1.0;
            }
        }
        return 1.0;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    worldToLocal(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }

    checkBulletCollision(bullet) {
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const centerRadius = this.width * 0.35 + bullet.radius;
        if (dx * dx + dy * dy <= centerRadius * centerRadius) {
            return { hit: true, wing: false };
        }

        const local = this.worldToLocal(bullet.x, bullet.y);
        const wingHalfHeight = this.height * 0.82 + bullet.radius;
        const leftWingMin = -this.width * 1.45 - bullet.radius;
        const leftWingMax = -this.width * 0.75 + bullet.radius;
        const rightWingMin = this.width * 0.75 - bullet.radius;
        const rightWingMax = this.width * 1.45 + bullet.radius;

        if (local.y >= -wingHalfHeight && local.y <= wingHalfHeight) {
            if (local.x >= leftWingMin && local.x <= leftWingMax) {
                return { hit: true, wing: true };
            }
            if (local.x >= rightWingMin && local.x <= rightWingMax) {
                return { hit: true, wing: true };
            }
        }

        return { hit: false, wing: false };
    }

    rotateTowards(targetAngle, dt) {
        const difference = ((targetAngle - this.rotation + Math.PI) % (Math.PI * 2)) - Math.PI;
        const delta = Math.sign(difference) * Math.min(Math.abs(difference), this.turnRate * dt);
        this.rotation += delta;
    }

    update(dt, players, gameWidth, gameHeight, aiSystem) {
        if (!this.isAlive) {
            // Solo actualizar balas si el enemigo murió
            this.bullets = this.bullets.filter(bullet => {
                bullet.x += bullet.vx * dt;
                bullet.y += bullet.vy * dt;
                return bullet.x > -10 && bullet.x < gameWidth + 10 &&
                       bullet.y > -10 && bullet.y < gameHeight + 10;
            });
            return;
        }

        // Recuperar balas aliadas (para IA evasiva)
        let playerBullets = [];
        players.forEach(p => {
            if (p.isAlive) playerBullets.push(...p.bullets);
        });

        // Actualizar IA
        this.updateAI(players, gameWidth, gameHeight, aiSystem, playerBullets);
        
        // Movimiento
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Velocidad y Rotación
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 10) {
            this.rotateTowards(Math.atan2(this.vy, this.vx), dt);
        }
        else if (this.targetPlayer && this.aiState === 'attack') {
            // Si está muy lento o detenido, rotar hacia su objetivo (jugador o lugar de apuntado predictivo)
            const dx = this.targetPlayer.x - this.x;
            const dy = this.targetPlayer.y - this.y;
            this.rotateTowards(Math.atan2(dy, dx), dt);
        }
        
        // Limitar dentro de los límites
        this.x = clamp(this.x, this.width / 2, gameWidth - this.width / 2);
        this.y = clamp(this.y, this.height / 2, gameHeight - this.height / 2);
        
        // Disparo táctico
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && this.aiState === 'attack') {
            this.fire(aiSystem);
            this.fireTimer = this.fireRate;
        }
        
        // Actualizar balas
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            return bullet.x > -10 && bullet.x < gameWidth + 10 &&
                   bullet.y > -10 && bullet.y < gameHeight + 10;
        });
    }

    updateAI(players, gameWidth, gameHeight, aiSystem, playerBullets) {
        // Encontrar jugador más cercano
        let closestPlayer = null;
        let closestDistance = Infinity;

        players.forEach(player => {
            if (player.isAlive) {
                const dist = distance(this.x, this.y, player.x, player.y);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestPlayer = player;
                }
            }
        });

        this.targetPlayer = closestPlayer;

        if (!closestPlayer) {
            this.aiState = 'patrol';
        }

        // Tácticas base por estado
        switch (this.aiState) {
            case 'patrol':
                this.patrolBehavior(gameWidth, gameHeight, closestDistance, closestPlayer);
                break;
            case 'chase':
                this.chaseBehavior(closestPlayer, closestDistance);
                break;
            case 'attack':
                this.attackBehavior(closestPlayer, closestDistance);
                break;
            case 'flee':
                this.fleeBehavior(closestPlayer);
                break;
        }

        // EVASION DINÁMICA (Solo para naves con agilidad)
        if (aiSystem && (this.type === 'scout' || this.type === 'basic' || this.type === 'boss') && closestPlayer) {
            let agility = this.type === 'scout' ? 1.5 : (this.type === 'boss' ? 0.8 : 0.5);
            const evasion = aiSystem.calculateEvasionVector(this, playerBullets, agility);
            this.vx += evasion.vx;
            this.vy += evasion.vy;
        }
    }

    patrolBehavior(gameWidth, gameHeight, closestDistance, closestPlayer) {
        this.pathfindingTimer -= 0.016; 

        if (this.pathfindingTimer <= 0) {
            this.targetX = random(50, gameWidth - 50);
            this.targetY = random(50, gameHeight - 50);
            this.pathfindingTimer = 3; 
        }

        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        if (closestPlayer && closestDistance < this.detectionRange) {
            this.aiState = 'chase';
        }
    }

    chaseBehavior(closestPlayer, closestDistance) {
        // Aprovechar targetX e Y de las formaciones en Basic/Tank, sino ir por el jugador directamente
        let destX = closestPlayer.x;
        let destY = closestPlayer.y;

        // Si es una nave básica en formacion coordenada, prefiere su offset asignado
        if (this.type === 'basic' && this.targetX !== this.x) {
            destX = (destX + this.targetX) / 2;
            destY = (destY + this.targetY) / 2;
        }

        const angle = Math.atan2(destY - this.y, destX - this.x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        if (closestDistance < this.attackRange) {
            this.aiState = 'attack';
        } else if (closestDistance > this.detectionRange * 1.5) {
            this.aiState = 'patrol';
        }
    }

    attackBehavior(closestPlayer, closestDistance) {
        if (this.type === 'boss') {
            // Orbital Boss: gira en torno al jugador
            const orbitSpeed = 0.8; // Velocidad de órbita
            const angleToPlayer = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);
            // El ángulo de movimiento es perpendicular a la vista hacia el jugador
            let moveAngle = angleToPlayer + Math.PI / 2;
            
            // Si está muy lejos se acerca un poco, si está muy cerca se aleja un poco
            if (closestDistance > this.attackRange * 0.8) moveAngle -= 0.5;
            if (closestDistance < this.attackRange * 0.4) moveAngle += 0.5;

            this.vx = Math.cos(moveAngle) * this.speed * orbitSpeed;
            this.vy = Math.sin(moveAngle) * this.speed * orbitSpeed;
        } 
        else if (this.type === 'scout') {
            // Táctica Hit and Run: pasa zumbando para el ataque o huye de lado
            const angle = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);
            if (closestDistance < this.attackRange * 0.5) {
                this.aiState = 'flee';
            } else {
                this.vx = Math.cos(angle) * this.speed * 0.8;
                this.vy = Math.sin(angle) * this.speed * 0.8;
            }
        } 
        else if (this.type === 'tank') {
            // Tank intercepta moviéndose lento en línea frontal
            const angle = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);
            this.vx = Math.cos(angle) * this.speed * 0.4;
            this.vy = Math.sin(angle) * this.speed * 0.4;
        }
        else {
            // Basic
            const angle = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);
            if (closestDistance > this.attackRange) {
                this.vx = Math.cos(angle) * this.speed * 0.5;
                this.vy = Math.sin(angle) * this.speed * 0.5;
            } else if (closestDistance < this.attackRange * 0.5) {
                this.vx = -Math.cos(angle) * this.speed * 0.5;
                this.vy = -Math.sin(angle) * this.speed * 0.5;
            } else {
                // Drift ligero si mantiene distancia
                this.vx = Math.cos(angle + Math.PI/2) * this.speed * 0.2;
                this.vy = Math.sin(angle + Math.PI/2) * this.speed * 0.2;
            }
        }

        if (closestDistance > this.detectionRange) {
            this.aiState = 'patrol';
        }
    }

    fleeBehavior(closestPlayer) {
        // Táctica de retirada / flanqueo de reposicionamiento
        const angle = Math.atan2(closestPlayer.y - this.y, closestPlayer.x - this.x);
        
        // El scout además huye lateralmente
        let escapeAngle = this.type === 'scout' ? angle - (Math.PI * 0.8) : angle + Math.PI;

        this.vx = Math.cos(escapeAngle) * this.speed;
        this.vy = Math.sin(escapeAngle) * this.speed;
        
        const dist = distance(this.x, this.y, closestPlayer.x, closestPlayer.y);
        // Si ya está lejos, volver a atacar
        if (dist > this.attackRange * 1.5) {
            this.aiState = 'chase';
        }
    }

    fire(aiSystem) {
        if (!this.targetPlayer) return; 

        // Usa APUNTADO PREDICTIVO si hay aiSystem y no es un tanque (los tanques disparan lento y sin IA)
        let aimX = this.targetPlayer.x;
        let aimY = this.targetPlayer.y;

        if (aiSystem && this.type !== 'tank') {
            const predictedPos = aiSystem.predictPlayerPosition(this.targetPlayer, this, this.bulletSpeed);
            aimX = predictedPos.x;
            aimY = predictedPos.y;
        }

        // Calcular dirección hacia el jugador objetivo PREDECIDO
        const dx = aimX - this.x;
        const dy = aimY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Disparo en múltiples direcciones si es un BOSS o apuntado normal
        if (this.type === 'boss') {
            const baseAngle = Math.atan2(dy, dx);
            // Triple disparo en abanico
            [-0.2, 0, 0.2].forEach(angleOffset => {
                const finalAngle = baseAngle + angleOffset;
                this.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(finalAngle) * this.bulletSpeed,
                    vy: Math.sin(finalAngle) * this.bulletSpeed,
                    radius: 4, damage: 25
                });
            });
        } else {
            const vx = (dx / distanceToTarget) * this.bulletSpeed;
            const vy = (dy / distanceToTarget) * this.bulletSpeed;

            this.bullets.push({
                x: this.x, y: this.y,
                vx: vx, vy: vy,
                radius: 3, damage: 20
            });
        }
    }

    draw(ctx) {
        // Dibujar balas siempre
        this.bullets.forEach(bullet => {
            drawProjectile(ctx, bullet, 'rgba(255, 160, 64, 0.95)');
        });

        if (!this.isAlive) return;

        ctx.save();

        // Efecto de daño crítico intermitente
        let isCritical = this.health < this.maxHealth * 0.3;
        if (isCritical) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 80) * 0.5;
        } else {
            ctx.globalAlpha = 1.0;
        }

        ctx.translate(this.x, this.y);
        
        // Falso Glow Perimetral
        ctx.fillStyle = isCritical ? '#ff3300' : this.color;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = isCritical ? 0.7 : 1.0;

        // Estructura Oscura
        ctx.fillStyle = '#050510';
        ctx.strokeStyle = this.color; // Color propio tipo tron
        ctx.lineWidth = 2.5;
        
        // Ala izquierda estilo TIE
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.95, -this.height * 0.8);
        ctx.lineTo(-this.width * 1.4, -this.height * 0.55);
        ctx.lineTo(-this.width * 1.4, this.height * 0.55);
        ctx.lineTo(-this.width * 0.95, this.height * 0.8);
        ctx.lineTo(-this.width * 0.75, this.height * 0.8);
        ctx.lineTo(-this.width * 0.75, -this.height * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ala derecha estilo TIE
        ctx.beginPath();
        ctx.moveTo(this.width * 0.95, -this.height * 0.8);
        ctx.lineTo(this.width * 1.4, -this.height * 0.55);
        ctx.lineTo(this.width * 1.4, this.height * 0.55);
        ctx.lineTo(this.width * 0.95, this.height * 0.8);
        ctx.lineTo(this.width * 0.75, this.height * 0.8);
        ctx.lineTo(this.width * 0.75, -this.height * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Núcleo central
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ventana de piloto
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.color;
        
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.18, 0, Math.PI * 2);
        ctx.stroke();

        // Barras de unión
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.75, 0);
        ctx.lineTo(-this.width * 0.35, 0);
        ctx.moveTo(this.width * 0.75, 0);
        ctx.lineTo(this.width * 0.35, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.35);
        ctx.lineTo(0, this.height * 0.35);
        ctx.stroke();

        // Paneles interiores del ala
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = -0.35; i <= 0.35; i += 0.35) {
            ctx.beginPath();
            ctx.moveTo(-this.width * 1.3, this.height * i);
            ctx.lineTo(-this.width * 1.1, this.height * i);
            ctx.moveTo(this.width * 1.3, this.height * i);
            ctx.lineTo(this.width * 1.1, this.height * i);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(-this.width * 1.25, -this.height * 0.55);
        ctx.lineTo(-this.width * 1.25, this.height * 0.55);
        ctx.moveTo(this.width * 1.25, -this.height * 0.55);
        ctx.lineTo(this.width * 1.25, this.height * 0.55);
        ctx.stroke();

        ctx.restore();
    }

    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }

    // Método para ajustar el brillo de un color hex
    adjustBrightness(hex, factor) {
        // Convertir hex a RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        // Ajustar brillo
        const newR = Math.max(0, Math.min(255, Math.round(r * (1 + factor))));
        const newG = Math.max(0, Math.min(255, Math.round(g * (1 + factor))));
        const newB = Math.max(0, Math.min(255, Math.round(b * (1 + factor))));

        // Convertir de vuelta a hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
}

console.log('✓ Enemy cargado');
