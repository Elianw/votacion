document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    const candidatosContainer = document.getElementById('candidatos-container');
    const lote = localStorage.getItem('userLote'), codigo = localStorage.getItem('userCodigo');
    if (!lote || !codigo) { window.location.replace('index.html'); return; }

    function actualizarVisuales() {
        // ... (sin cambios)
    }

    fetch('http://votacion-consejo-espinillo.onrender.com/candidatos')
        .then(response => response.json())
        .then(candidatos => {
            
            // --- NUEVO: Lógica para barajar los candidatos ---
            // Se usa el algoritmo Fisher-Yates para un orden aleatorio profesional
            for (let i = candidatos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
            }
            // --- FIN DE LA LÓGICA DE BARAJADO ---

            const form = document.createElement('form');
            form.id = 'votoForm';
            const grillaDiv = document.createElement('div');
            grillaDiv.className = 'grilla-candidatos';
            
            candidatos.forEach(candidato => {
                // ... (El resto del código que crea las tarjetas es igual)
            });

            // ... (El resto del archivo sigue igual)
        });
});

// Nota: Para no extender la respuesta, he omitido el resto del código que no cambia.
// Solo necesitas añadir esas 5 líneas de la lógica de barajado en tu archivo existente.
// Si prefieres el archivo completo, avísame y te lo paso.
