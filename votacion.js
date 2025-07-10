document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    const candidatosContainer = document.getElementById('candidatos-container');
    const preseleccionSlots = document.getElementById('preseleccion-slots');
    const contadorEl = document.getElementById('contador-seleccion');
    const lote = localStorage.getItem('userLote'), codigo = localStorage.getItem('userCodigo');
    
    if (!lote || !codigo) { window.location.replace('index.html'); return; }

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

    function actualizarUI() {
        const seleccionados = document.querySelectorAll('input[name="candidato"]:checked');
        contadorEl.textContent = `Seleccionados: ${seleccionados.length} de 5`;
        preseleccionSlots.innerHTML = '';

        seleccionados.forEach(checkbox => {
            const card = checkbox.closest('.candidato-card');
            const foto = card.querySelector('.candidato-foto').src;
            const nombre = card.querySelector('.candidato-nombre').innerText;
            const loteCandidato = card.querySelector('.candidato-lote').innerText;
            const slotHTML = `<div class="candidato-slot">
                                <img src="${foto}" alt="${nombre.replace('\n', ' ')}">
                                <p>${nombre.replace('\n', ' ')}</p>
                                <span>${loteCandidato}</span>
                              </div>`;
            preseleccionSlots.innerHTML += slotHTML;
        });

        for (let i = seleccionados.length; i < 5; i++) {
            preseleccionSlots.innerHTML += '<div class="candidato-slot slot-vacio">Vacío</div>';
        }
        
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

    fetch('https://votacion-consejo-espinillo.onrender.com/candidatos')
        .then(response => response.json())
        .then(candidatos => {
            for (let i = candidatos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
            }

            const form = document.createElement('form');
            form.id = 'votoForm';
            const grillaDiv = document.createElement('div');
            grillaDiv.className = 'grilla-candidatos';
            
            candidatos.forEach(candidato => {
                const candidatoDiv = document.createElement('div');
                candidatoDiv.className = 'candidato-card';
                const checkboxId = `candidato-${candidato.ID}`;
                const partesNombre = String(candidato.Nombre).split(/\s+/);
                const primerNombre = partesNombre.shift() || '';
                const apellido = partesNombre.join(' ');
                const nombreHTML = `<span class="nombre-linea">${primerNombre}</span><span class="nombre-linea">${apellido}</span>`;
                candidatoDiv.innerHTML = `<img src="${candidato.FotoURL}" alt="Foto de ${candidato.Nombre}" class="candidato-foto"><div class="candidato-info"><h3 class="candidato-nombre">${nombreHTML}</h3><p class="candidato-lote">Lote: ${candidato.Lote || ''}</p><p class="candidato-propuesta">${candidato.Propuesta || 'Sin propuesta.'}</p><input type="checkbox" name="candidato" value="${candidato.ID}" data-nombre="${candidato.Nombre}" data-lote="${candidato.Lote || ''}" id="${checkboxId}" class="hidden-checkbox"><label class="checkbox-label" for="${checkboxId}">Seleccionar</label></div>`;
                grillaDiv.appendChild(candidatoDiv);
            });
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
            actualizarUI();

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const seleccionados = document.querySelectorAll('input[name="candidato"]:checked');
                const mensajeVotacion = document.getElementById('mensaje-votacion');
                
                if (seleccionados.length === 0) {
                    modal.mostrar({titulo: 'Selección Vacía', mensaje: 'Debes elegir al menos un candidato.', botones: [{texto: 'Aceptar'}]});
                    return;
                }
                
                const enviarVoto = () => {
                    const votoIds = Array.from(seleccionados).map(cb => cb.value);
                    const votoNombres = Array.from(seleccionados).map(cb => cb.getAttribute('data-nombre'));
                    const votoLotes = Array.from(seleccionados).map(cb => cb.getAttribute('data-lote'));
                    const email = document.getElementById('emailInput').value;
                    mainContainer.innerHTML = '<h2>Procesando tu voto...</h2><p>Por favor, esperá un momento.</p>';
                    fetch('https://votacion-consejo-espinillo.onrender.com/votar', {
                        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lote, codigo, votoIds, votoNombres, votoLotes, email })
                    }).then(response => response.json()).then(resultado => {
                        if (resultado.exito) {
                            const mensajeWhatsapp = `Hola, quiero mi comprobante de voto para el Lote ${lote}.`;
                            const numeroWhatsapp = "5491121780900";
                            const whatsappLink = `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensajeWhatsapp)}`;
                            mainContainer.innerHTML = `
                                <h2 style="font-size: 2em;">¡Gracias!</h2>
                                <p style="font-size: 1.2em; color: #666;">Tu voto ha sido registrado.</p>
                                <div class="botones-finales">
                                    <a href="${whatsappLink}" target="_blank" class="whatsapp-button">Pedí tu comprobante por WhatsApp</a>
                                </div>
                                <p class="texto-final">Ya podés cerrar esta ventana.</p>`;
                            localStorage.clear();
                            history.replaceState(null, '', 'gracias.html');
                        } else {
                           modal.mostrar({titulo: 'Error', mensaje: resultado.mensaje || 'Ocurrió un error al procesar el voto.', botones: [{texto: 'Entendido'}]})
                        }
                    }).catch(err => {
                        modal.mostrar({titulo: 'Error de Conexión', mensaje: 'No se pudo comunicar con el servidor. Intentá de nuevo más tarde.', botones: [{texto: 'Cerrar'}]})
                    });
                };

                let confirmacionHTML = '<p>Vas a emitir tu voto por los siguientes candidatos:</p><ul style="text-align: left; display: inline-block; margin-top: 10px;">';
                seleccionados.forEach(cb => {
                    confirmacionHTML += `<li>${cb.getAttribute('data-nombre')}</li>`;
                });
                confirmacionHTML += '</ul><p style="font-weight: bold; margin-top: 15px;">¿Estás seguro?</p>';

                modal.mostrar({
                    titulo: 'Confirmar Voto',
                    mensaje: confirmacionHTML,
                    botones: [
                        { texto: 'Confirmar', clase: 'btn-primario', callback: enviarVoto },
                        { texto: 'Cancelar', clase: 'btn-secundario' }
                    ]
                });
            });
        })
        .catch(error => {
            console.error("Error al cargar candidatos:", error);
            document.getElementById('candidatos-container').innerHTML = '<p class="mensaje error">No se pudieron cargar los candidatos.</p>';
        });
});
