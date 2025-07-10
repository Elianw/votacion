document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    const candidatosContainer = document.getElementById('candidatos-container');
    const preseleccionSlots = document.getElementById('preseleccion-slots');
    const lote = localStorage.getItem('userLote'), codigo = localStorage.getItem('userCodigo');
    
    if (!lote || !codigo) { window.location.replace('index.html'); return; }

    // --- Sistema de Modal Mejorado ---
    const modal = {
        overlay: document.getElementById('alerta-personalizada'),
        titulo: document.getElementById('alerta-titulo'),
        mensaje: document.getElementById('alerta-mensaje'),
        botones: document.getElementById('alerta-botones'),
        mostrar: function(config) {
            this.titulo.textContent = config.titulo;
            this.mensaje.innerHTML = config.mensaje;
            this.botones.innerHTML = '';
            config.botones.forEach(btnConfig => {
                const button = document.createElement('button');
                button.textContent = btnConfig.texto;
                button.className = btnConfig.clase || '';
                button.addEventListener('click', () => {
                    this.ocultar();
                    if (btnConfig.callback) btnConfig.callback();
                });
                this.botones.appendChild(button);
            });
            this.overlay.style.display = 'flex';
        },
        ocultar: function() { this.overlay.style.display = 'none'; }
    };
    
    // --- Función Principal para Actualizar la UI ---
    function actualizarUI() {
        const seleccionados = document.querySelectorAll('input[name="candidato"]:checked');
        document.getElementById('contador-seleccion').textContent = `Seleccionados: ${seleccionados.length} de 5`;
        preseleccionSlots.innerHTML = ''; // Limpiamos los slots

        // Llenamos los slots con los seleccionados
        seleccionados.forEach(checkbox => {
            const card = checkbox.closest('.candidato-card');
            const foto = card.querySelector('.candidato-foto').src;
            const nombre = card.querySelector('.candidato-nombre').innerText;
            const loteCandidato = card.querySelector('.candidato-lote').innerText;
            const slotHTML = `<div class="candidato-slot">
                                <img src="${foto}" alt="${nombre}">
                                <p>${nombre.replace('\n', ' ')}</p>
                                <span>${loteCandidato}</span>
                              </div>`;
            preseleccionSlots.innerHTML += slotHTML;
            card.classList.add('seleccionado');
        });

        // Llenamos los slots vacíos restantes
        for (let i = seleccionados.length; i < 5; i++) {
            preseleccionSlots.innerHTML += '<div class="candidato-slot slot-vacio">Vacío</div>';
        }
        
        // Actualizamos el estado visual de las tarjetas de la grilla principal
        document.querySelectorAll('.grilla-candidatos .candidato-card').forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            const label = card.querySelector('.checkbox-label');
            if (checkbox.checked) {
                card.classList.add('seleccionado');
                label.textContent = 'Deseleccionar';
            } else {
                card.classList.remove('seleccionado');
                label.textContent = 'Seleccionar';
            }
        });
    }

    // --- Carga Inicial de Candidatos ---
    fetch('https://votacion-consejo-espinillo.onrender.com/candidatos')
        .then(response => response.json())
        .then(candidatos => {
            for (let i = candidatos.length - 1; i > 0; i--) { /* ... barajado ... */ }
            const form = document.createElement('form');
            form.id = 'votoForm';
            const grillaDiv = document.createElement('div');
            grillaDiv.className = 'grilla-candidatos';
            
            candidatos.forEach(candidato => { /* ... creación de tarjetas ... */ });
            form.appendChild(grillaDiv);

            form.addEventListener('change', e => {
                if (e.target.type === 'checkbox') {
                    if (form.querySelectorAll('input[name="candidato"]:checked').length > 5) {
                        e.target.checked = false;
                        modal.mostrar({titulo: 'Límite Alcanzado', mensaje: 'Puedes elegir como máximo 5 candidatos.', botones: [{texto: 'Aceptar'}]});
                    }
                    actualizarUI();
                }
            });

            const emailDiv = document.createElement('div');
            emailDiv.className = 'input-group';
            emailDiv.style.marginTop = '30px';
            emailDiv.innerHTML = `<label for="emailInput">Email (Opcional)</label><input type="email" id="emailInput" placeholder="Recibe una copia de tu voto">`;
            form.appendChild(emailDiv);
            
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Emitir Voto';
            form.appendChild(submitButton);
            
            candidatosContainer.innerHTML = '';
            candidatosContainer.appendChild(form);
            actualizarUI(); // Llamada inicial para mostrar los slots vacíos

            // --- Lógica de Voto en Dos Pasos ---
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const seleccionados = document.querySelectorAll('input[name="candidato"]:checked');
                if (seleccionados.length === 0) {
                    modal.mostrar({titulo: 'Selección Vacía', mensaje: 'Debes elegir al menos un candidato.', botones: [{texto: 'Aceptar'}]});
                    return;
                }
                
                // Función que realmente envía el voto
                const enviarVoto = () => {
                    const votoIds = Array.from(seleccionados).map(cb => cb.value);
                    const votoNombres = Array.from(seleccionados).map(cb => cb.getAttribute('data-nombre'));
                    const votoLotes = Array.from(seleccionados).map(cb => cb.getAttribute('data-lote'));
                    const email = document.getElementById('emailInput').value;
                    
                    document.querySelector('.container').innerHTML = '<h2>Procesando tu voto...</h2>';
                    
                    fetch('https://votacion-consejo-espinillo.onrender.com/votar', { /* ... fetch ... */ })
                        .then(response => response.json())
                        .then(resultado => {
                            if (resultado.exito) {
                                // ... pantalla de éxito ...
                            } else {
                                mainContainer.innerHTML = `<h2>Error</h2><p>${resultado.mensaje}</p>`;
                            }
                        });
                };

                // Construimos el mensaje de confirmación
                let confirmacionHTML = '<p>Vas a emitir tu voto por los siguientes candidatos:</p><ul>';
                seleccionados.forEach(cb => {
                    confirmacionHTML += `<li>${cb.getAttribute('data-nombre')}</li>`;
                });
                confirmacionHTML += '</ul><p>¿Estás seguro?</p>';

                // Mostramos el modal de confirmación
                modal.mostrar({
                    titulo: 'Confirmar Voto',
                    mensaje: confirmacionHTML,
                    botones: [
                        { texto: 'Confirmar', clase: 'btn-primario', callback: enviarVoto },
                        { texto: 'Cancelar', clase: 'btn-secundario' }
                    ]
                });
            });
        });
});
