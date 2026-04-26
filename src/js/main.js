// ===========================
// ARCHIVO PRINCIPAL
// ===========================

let game = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Juego de Naves...');
    
    const canvas = document.getElementById('gameCanvas');
    
    // Esperar a que el CSS se aplique
    setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;
        
        // Crear instancia del juego
        window.game = new Game(canvas, width, height);
        game = window.game;
        
        // Iniciar bucle de juego
        game.loop();
        
        console.log('✓ Juego iniciado correctamente');
        console.log(`📐 Resolución: ${width}x${height}`);
        
        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => {
            const newRect = canvas.getBoundingClientRect();
            let newWidth = newRect.width;
            let newHeight = newRect.height;
            
            game.width = newWidth;
            game.height = newHeight;
            game.canvas.width = newWidth;
            game.canvas.height = newHeight;
        });
    }, 100);
});

console.log('✓ Main cargado');
