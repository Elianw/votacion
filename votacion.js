document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    const candidatosContainer = document.getElementById('candidatos-container');
    const lote = localStorage.getItem('userLote'), codigo = localStorage.getItem('userCodigo');
    if (!lote || !codigo) { window.location.replace('index.html'); return; }

    function actualizarVisuales() {
        const seleccionados = document.querySelectorAll('input[name="candidato"]:checked').length;
        document.getElementById('contador-seleccion').textContent = `Seleccionados: ${seleccionados} de 5`;
        document.querySelectorAll('.candidato-card').forEach(card => {
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

    fetch('http://127.0.0.1:5000/candidatos')
        .then(response => response.json())
        .then(candidatos => {
            const form = document.createElement('form');
            form.id = 'votoForm';
            const grillaDiv = document.createElement('div');
            grillaDiv.className = 'grilla-candidatos';
            
            candidatos.forEach(candidato => {
                const candidatoDiv = document.createElement('div');
                candidatoDiv.className = 'candidato-card';
                const checkboxId = `candidato-${candidato.ID}`;
                
                // --- LÓGICA DE NOMBRE ACTUALIZADA Y MÁS ROBUSTA ---
                const partesNombre = String(candidato.Nombre).split(/\s+/); // Divide por cualquier tipo de espacio
                const primerNombre = partesNombre.shift() || '';
                const apellido = partesNombre.join(' ');

                // Se usan spans para forzar el formato de bloque
                const nombreHTML = `<span class="nombre-linea">${primerNombre}</span><span class="nombre-linea">${apellido}</span>`;
                
                candidatoDiv.innerHTML = `
                    <img src="${candidato.FotoURL}" alt="Foto de ${candidato.Nombre}" class="candidato-foto">
                    <div class="candidato-info">
                        <h3 class="candidato-nombre">${nombreHTML}</h3>
                        <p class="candidato-lote">Lote: ${candidato.Lote}</p>
                        <p class="candidato-propuesta">${candidato.Propuesta || 'Sin propuesta.'}</p>
                        <input type="checkbox" name="candidato" value="${candidato.ID}" data-nombre="${candidato.Nombre}" data-lote="${candidato.Lote}" id="${checkboxId}" class="hidden-checkbox">
                        <label class="checkbox-label" for="${checkboxId}">Seleccionar</label>
                    </div>`;
                grillaDiv.appendChild(candidatoDiv);
            });
            form.appendChild(grillaDiv);

            form.addEventListener('change', e => {
                if (e.target.type === 'checkbox') {
                    const seleccionados = form.querySelectorAll('input[name="candidato"]:checked').length;
                    if (seleccionados > 5) {
                        e.target.checked = false;
                        alert('Puedes elegir como máximo 5 candidatos.');
                        const card = e.target.closest('.candidato-card');
                        card.classList.add('error-seleccion');
                        setTimeout(() => card.classList.remove('error-seleccion'), 1000);
                    }
                    actualizarVisuales();
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

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const seleccionados = document.querySelectorAll('input[name="candidato"]:checked');
                const mensajeVotacion = document.getElementById('mensaje-votacion') || document.createElement('p');
                if (seleccionados.length === 0 || seleccionados.length > 5) {
                    mensajeVotacion.textContent = 'Debes elegir entre 1 y 5 candidatos.';
                    mensajeVotacion.className = 'mensaje error';
                    form.appendChild(mensajeVotacion);
                    return;
                }
                const votoIds = Array.from(seleccionados).map(cb => cb.value);
                const votoNombres = Array.from(seleccionados).map(cb => cb.getAttribute('data-nombre'));
                const votoLotes = Array.from(seleccionados).map(cb => cb.getAttribute('data-lote'));
                const email = document.getElementById('emailInput').value;
                submitButton.disabled = true;
                submitButton.textContent = 'Procesando...';
                fetch('http://127.0.0.1:5000/votar', {
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
                            <p class="texto-final">Ya podés cerrar esta ventana.</p>
                        `;
                        localStorage.clear();
                        history.replaceState(null, '', 'gracias.html');
                    } else {
                        mensajeVotacion.textContent = resultado.mensaje || 'Ocurrió un error.';
                        mensajeVotacion.className = 'mensaje error';
                        submitButton.disabled = false;
                        submitButton.textContent = 'Emitir Voto';
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error al cargar candidatos:", error);
            document.getElementById('candidatos-container').innerHTML = '<p class="mensaje error">No se pudieron cargar los candidatos.</p>';
        });
});