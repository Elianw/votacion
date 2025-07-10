// Apuntamos al servidor local de Python (Flask)
const SCRIPT_URL = "http://127.0.0.1:5000/login";

const form = document.getElementById('loginForm');
const mensajeEl = document.getElementById('mensaje');
const submitButton = document.getElementById('submitButton');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Verificando...';
    mensajeEl.textContent = '';
    mensajeEl.className = 'mensaje';

    const data = {
        lote: form.lote.value,
        codigo: form.codigo.value
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
            
            // Guardamos las credenciales y redirigimos
            localStorage.setItem('userLote', form.lote.value);
            localStorage.setItem('userCodigo', form.codigo.value);

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