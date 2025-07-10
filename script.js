const SCRIPT_URL = "https://votacion-consejo-espinillo.onrender.com/login";

const form = document.getElementById('loginForm');
const mensajeEl = document.getElementById('mensaje');
const submitButton = document.getElementById('submitButton');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Verificando...';
    mensajeEl.textContent = '';
    mensajeEl.className = 'mensaje';

    // CAMBIO: Se usa .trim() para limpiar los espacios
    const data = {
        lote: form.lote.value.trim(),
        codigo: form.codigo.value.trim()
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        mensajeEl.textContent = result.mensaje;

        if (result.exito) {
            mensajeEl.classList.add('exito');
            
            localStorage.setItem('userLote', data.lote); // Usamos el dato ya limpiado
            localStorage.setItem('userCodigo', data.codigo); // Usamos el dato ya limpiado

            setTimeout(() => {
                window.location.href = "votacion.html";
            }, 1500);
        } else {
            mensajeEl.classList.add('error');
            submitButton.disabled = false;
            submitButton.textContent = 'Ingresar';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mensajeEl.textContent = 'Error de conexión. ¿Está el servidor de Python funcionando?';
        mensajeEl.classList.add('error');
        submitButton.disabled = false;
        submitButton.textContent = 'Ingresar';
    });
});
