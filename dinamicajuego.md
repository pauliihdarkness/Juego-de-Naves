# Dinámica del Juego de Naves

Este documento describe paso a paso la dinámica y mecánicas del juego "Juego de Naves", un shooter espacial con estilo Synthwave desarrollado en Electron.

## 1. Inicio del Juego

- **Pantalla de Inicio**: El juego comienza en un estado de menú (`gameState = 'menu'`).
- **Configuración Inicial**: Se crea una instancia de la clase `Game` con un canvas de 1280x720 píxeles (por defecto).
- **Sistemas Inicializados**:
  - `InputManager`: Maneja controles de teclado y gamepad.
  - `AudioManager`: Gestiona sonidos y música.
  - `ParticleSystem`: Para efectos visuales.
  - `Camera`: Para seguimiento de la acción.
- **Creación de Jugadores**: Se crean hasta 2 jugadores (X-Wing rojas y azules) en posiciones iniciales.

## 2. Bucle Principal del Juego

El juego ejecuta un bucle continuo (`game.loop()`) que actualiza y dibuja el estado del juego a ~60 FPS.

### 2.1 Actualización (`update(dt)`)

- **Delta Time**: Calcula el tiempo transcurrido entre frames para movimientos suaves.
- **Estado del Juego**:
  - `menu`: Espera input para iniciar.
  - `playing`: Lógica principal activa.
  - `paused`: Juego detenido.
  - `gameOver`: Fin del juego.

### 2.2 Entrada del Jugador

- **Controles**:
  - Jugador 1: WASD (movimiento), Espacio/M (disparo principal), Shift (misil), E (escopeta).
  - Jugador 2: IJKL (movimiento), P (disparo), O (misil), U (escopeta).
  - Soporte para gamepads (ejes y botones).
- **Movimiento**: Velocidad de 300 píx/s, normalizado para diagonales.
- **Rotación**: La nave apunta hacia la dirección de movimiento.

### 2.3 Disparos del Jugador

- **Disparo Principal**: Balas dobles desde las alas, cadencia base de 0.1s.
- **Powerups**:
  - `rapidFire`: Triple disparo con dispersión y proyectil central más poderoso.
  - `shield`: Protección temporal contra daño.
- **Armas Secundarias**:
  - Misil: Cooldown de 3s, daño alto.
  - Escopeta: Cooldown de 1.5s, disparo múltiple.

### 2.4 Sistema de Enemigos

- **Tipos de Enemigos**:
  - `basic`: Verde, velocidad media, salud 20.
  - `scout`: Cian, rápido, detección extendida.
  - `tank`: Naranja, lento pero resistente (salud 60).
  - `boss`: Magenta, muy resistente (salud 250+), detección amplia.
- **Escalado**: Salud y velocidad aumentan con el nivel y dificultad.

### 2.5 Inteligencia Artificial (IA)

- **Estados de IA**:
  - `patrol`: Movimiento aleatorio.
  - `chase`: Perseguir al jugador más cercano.
  - `attack`: Disparar cuando en rango.
  - `flee`: Evadir cuando bajo en salud.
- **Comportamiento Adaptativo**:
  - Análisis de patrones del jugador (velocidad, dirección preferida).
  - Predicción de posición para apuntado anticipado.
  - Evasión de balas enemigas.
- **Dificultad Dinámica**: Ajusta basado en desempeño del jugador.

### 2.6 Sistema de Olas

- **Aparición Progresiva**: Enemigos aparecen en cola (`spawnQueue`) para evitar picos de rendimiento.
- **Contador de Olas**: Incrementa con cada oleada completada.
- **Escalado por Nivel**: Más enemigos, tipos más difíciles en niveles superiores.

### 2.7 Items de Recuperación (Pickups)

- **Tipos**:
  - `health`: Restaura 25 de salud, forma hexagonal.
  - `powerup`: Efectos como `shield` (escudo azul) o `rapidFire` (rayo amarillo).
- **Comportamiento**: Flotan, rotan, tienen vida limitada (12s).
- **Efectos Visuales**: Glow, aura pulsante, iconos centrales.

### 2.8 Sistema de Partículas

- **Tipos**:
  - `particles`: Explosiones, impactos (300 partículas).
  - `thrustParticles`: Propulsión de naves (200 partículas).
- **Efectos de Pantalla**:
  - `screenShake`: Vibración en impactos.
  - `screenFlash`: Flash de color en eventos.

### 2.9 Colisiones y Daño

- **Detección**: Círculos para balas, rectángulos para naves.
- **Daño**:
  - Jugador: Pierde salud, invencibilidad temporal (2s).
  - Enemigos: Pierden salud, mueren al llegar a 0.
- **Puntuación**: Otorga puntos por enemigos derrotados.

### 2.10 Cámara y Visuales

- **Seguimiento**: La cámara sigue a los jugadores activos.
- **Efectos Synthwave**: Colores neón, gradientes, sombras.

## 3. Estados Especiales

### 3.1 Pausa
- Detiene todas las actualizaciones excepto input.
- Permite reanudar o salir.

### 3.2 Game Over
- Se activa cuando todos los jugadores pierden toda su salud.
- Muestra puntuación final.

## 4. Configuración y Opciones

- **Dificultad**: `easy`, `normal`, `hard` - afecta escalado de enemigos.
- **Audio**: Música y sonidos activables/desactivables.
- **Múltiples Jugadores**: Hasta 2 jugadores simultáneos.

## 5. Fin del Juego

- **Condición de Victoria**: Sobrevivir indefinidamente (olas infinitas).
- **Reinicio**: Vuelve al menú para nueva partida.

Esta dinámica crea un shooter desafiante con elementos de estrategia, donde la IA adaptativa y los powerups añaden profundidad al gameplay.</content>
<parameter name="filePath">dinamicajuego.md