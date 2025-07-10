document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    const candidatosContainer = document.getElementById('candidatos-container');
    const preseleccionSlots = document.getElementById('preseleccion-slots');
    const controlesFinalesContainer = document.getElementById('controles-finales');
    const lote = localStorage.getItem('userLote'), codigo = localStorage.getItem('userCodigo');
    
    if (!lote || !codigo) { window.location.replace('index.html'); return; }

    const modal = { /* ...código del modal sin cambios... */ };

    function actualizarUI() { /* ...código de actualizarUI sin cambios... */ }

    fetch('https://votacion-consejo-espinillo.onrender.com/candidatos')
        .then(response => response.json())
        .then(candidatos => {
            for (let i = candidatos.length - 1; i > 0; i--) { /* ...barajado sin cambios... */ }
            
            // --- LÓGICA DE RENDERIZADO ACTUALIZADA ---
            const grillaDiv = document.createElement('div');
            grillaDiv.className = 'grilla-candidatos';
            
            candidatos.forEach(candidato => {
                const candidatoDiv = document.createElement('div');
                candidatoDiv.className = 'candidato-card';
                // ... (código para crear cada tarjeta de candidato, sin cambios) ...
                grillaDiv.appendChild(candidatoDiv);
            });
            
            // Insertamos la grilla de candidatos en su contenedor
            candidatosContainer.innerHTML = '';
            candidatosContainer.appendChild(grillaDiv);

            // Creamos un nuevo formulario solo para el email y el botón
            const formFinal = document.createElement('form');
            formFinal.id = 'formFinal';
            
            const emailDiv = document.createElement('div');
            emailDiv.className = 'input-group';
            emailDiv.innerHTML = `<label for="emailInput">Email (Opcional)</label><input type="email" id="emailInput" placeholder="Recibe una copia de tu voto">`;
            formFinal.appendChild(emailDiv);
            
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Emitir Voto';
            formFinal.appendChild(submitButton);

            // Insertamos el nuevo formulario en su contenedor
            controlesFinalesContainer.appendChild(formFinal);
            
            actualizarUI(); // Llamada inicial para mostrar slots vacíos

            // El listener de la grilla ahora está en el documento para detectar los clics
            grillaDiv.addEventListener('change', e => {
                if (e.target.type === 'checkbox') { /* ...lógica de selección sin cambios... */ }
            });

            // El listener de envío ahora está en el nuevo formulario
            formFinal.addEventListener('submit', function (e) {
                e.preventDefault();
                // ... (toda la lógica de confirmación y envío de voto no necesita cambios) ...
            });
        })
        .catch(error => {
            console.error("Error al cargar candidatos:", error);
            candidatosContainer.innerHTML = '<p class="mensaje error">No se pudieron cargar los candidatos.</p>';
        });
});
// Nota: Para ser breve, he omitido el contenido de las funciones que no cambian.
// Si prefieres el archivo completo y sin abreviar, avísame.
