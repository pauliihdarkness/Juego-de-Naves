// ===========================
// SISTEMA DE IA AVANZADO
// ===========================

/**
 * Sistema de IA para enemigos adaptativos
 */
class AISystem {
    constructor() {
        this.learningRate = 0.1;
        this.playerPatterns = {};
        this.enemyMemory = {};
        this.difficultyMultiplier = 1;
    }

    // Analizar patrones del jugador para adaptarse
    analyzePlayerBehavior(player, dt) {
        if (!this.playerPatterns[player.id]) {
            this.playerPatterns[player.id] = {
                avgSpeed: 0,
                preferredDirection: 0,
                attackFrequency: 0,
                firePattern: []
            };
        }

        const pattern = this.playerPatterns[player.id];
        
        // Calcular velocidad promedio
        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        pattern.avgSpeed = lerp(pattern.avgSpeed, currentSpeed, this.learningRate);
        
        // Detectar dirección preferida
        if (player.vx !== 0 || player.vy !== 0) {
            pattern.preferredDirection = Math.atan2(player.vy, player.vx);
        }
        
        // Registrar disparo
        if (pattern.firePattern.length < 10) {
            pattern.firePattern.push(Date.now());
        }
    }

    // Predecir posición del jugador para "Lead Aiming"
    predictPlayerPosition(player, enemy, projectileSpeed) {
        const dist = Math.sqrt(Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2));
        // Tiempo estimado de impacto
        const timeToReach = dist / projectileSpeed;
        
        // Agregar pequeña imperfección basada en velocidad de rotación real
        const predictionFactor = 0.85; 
        
        return {
            x: player.x + player.vx * timeToReach * predictionFactor,
            y: player.y + player.vy * timeToReach * predictionFactor
        };
    }

    // Calcular vector de evasión frente a amenazas (balas de los jugadores)
    calculateEvasionVector(enemy, bullets, agility = 1) {
        let evasionVx = 0;
        let evasionVy = 0;
        
        if (!bullets) return { vx: 0, vy: 0 };

        bullets.forEach(bullet => {
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Radio de detección de amenaza
            if (dist < 150 && dist > 0) {
                const bulletSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                if (bulletSpeed === 0) return;
                
                // Producto punto para ver si se dirige frontalmente hacia el enemigo
                const dot = (bullet.vx * dx + bullet.vy * dy) / (bulletSpeed * dist);
                if (dot > 0.4) { 
                    // Vector perpendicular a la trayectoria de la bala
                    const perpX = -bullet.vy / bulletSpeed;
                    const perpY = bullet.vx / bulletSpeed;
                    
                    // Decidir hacia qué lado salir
                    const side = (dx * perpX + dy * perpY) > 0 ? 1 : -1;
                    
                    // Intensidad de reacción
                    const force = (150 - dist) * 1.5 * agility;
                    
                    evasionVx += perpX * side * force;
                    evasionVy += perpY * side * force;
                }
            }
        });
        
        return { vx: evasionVx, vy: evasionVy };
    }

    // Calcular dificultad basada en desempeño
    calculateDifficulty(players, enemies) {
        let playerScore = 0;
        let enemyScore = 0;

        players.forEach(p => {
            playerScore += p.score;
        });

        enemies.forEach(e => {
            if (e.isAlive) {
                enemyScore += e.health;
            }
        });

        // Equilibrar si es necesario
        if (playerScore > enemyScore * 2 && this.difficultyMultiplier < 2) {
            this.difficultyMultiplier += 0.01;
        } else if (playerScore < enemyScore * 0.5 && this.difficultyMultiplier > 1) {
            this.difficultyMultiplier -= 0.01;
        }

        return this.difficultyMultiplier;
    }

    // Coordinar ataques entre enemigos
    coordinateEnemyAttack(enemies, players) {
        const groups = this.groupEnemies(enemies, 150);
        
        groups.forEach(group => {
            if (group.length > 1 && players.length > 0) {
                // Determinar objetivo común
                const target = players[0];
                const centerX = group.reduce((sum, e) => sum + e.x, 0) / group.length;
                const centerY = group.reduce((sum, e) => sum + e.y, 0) / group.length;
                
                // Coordinar formación
                group.forEach((enemy, index) => {
                    const offsetAngle = (Math.PI * 2 * index) / group.length;
                    const formationDistance = 60;
                    enemy.targetX = centerX + Math.cos(offsetAngle) * formationDistance;
                    enemy.targetY = centerY + Math.sin(offsetAngle) * formationDistance;
                });
            }
        });
    }

    // Agrupar enemigos cercanos
    groupEnemies(enemies, maxDistance) {
        const groups = [];
        const used = new Set();

        enemies.forEach((enemy, i) => {
            if (!used.has(i)) {
                const group = [enemy];
                used.add(i);

                for (let j = i + 1; j < enemies.length; j++) {
                    if (!used.has(j) && 
                        distance(enemy.x, enemy.y, enemies[j].x, enemies[j].y) < maxDistance) {
                        group.push(enemies[j]);
                        used.add(j);
                    }
                }

                groups.push(group);
            }
        });

        return groups;
    }

    // Algoritmo de pathfinding simple (evitar obstáculos)
    findPath(startX, startY, endX, endY, obstacles = []) {
        // Implementación simplificada
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return { x: startX, y: startY };

        // Búsqueda simple con obstáculos
        let nextX = startX + (dx / distance) * 10;
        let nextY = startY + (dy / distance) * 10;

        // Verificar colisiones con obstáculos
        for (let obstacle of obstacles) {
            if (checkCircleCollision(
                { x: nextX, y: nextY, radius: 5 },
                { x: obstacle.x, y: obstacle.y, radius: obstacle.radius }
            )) {
                // Evitar obstáculo
                const perpX = -dy / distance;
                const perpY = dx / distance;
                nextX += perpX * 10;
                nextY += perpY * 10;
            }
        }

        return { x: nextX, y: nextY };
    }

    // Estrategia de ataque basada en situación
    getAttackStrategy(enemy, player) {
        const dist = distance(enemy.x, enemy.y, player.x, player.y);
        const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);

        if (dist > 400) return 'approach';
        if (dist < 100) return 'evade';
        if (playerSpeed > 200) return 'intercept';
        return 'direct_fire';
    }

    // Actualizar memoria de enemigos
    recordEnemyDeath(enemy, causeOfDeath) {
        if (!this.enemyMemory[enemy.type]) {
            this.enemyMemory[enemy.type] = {
                deathCount: 0,
                lastDeathCause: null,
                avgDurationAlive: 0
            };
        }

        const memory = this.enemyMemory[enemy.type];
        memory.deathCount++;
        memory.lastDeathCause = causeOfDeath;
    }
}

console.log('✓ AI System cargado');
