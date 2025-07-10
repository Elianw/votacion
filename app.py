import gspread
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CONFIGURACIÓN ---
app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE EMAIL ---
EMAIL_REMITENTE = "tu_email@gmail.com"
CONTRASENA_APLICACION = "xxxxxxxxxxxxxxxx"

# --- Conexión con Google Sheets ---
try:
    # CAMBIO: Volvemos a usar el nombre del archivo, ya que Render lo pondrá en la misma carpeta
    gc = gspread.service_account(filename='votacion-espi.json')
    
    spreadsheet = gc.open("Base de Datos de Votación")
    sheet_usuarios = spreadsheet.sheet1
    sheet_candidatos = spreadsheet.worksheet("Candidatos")
    sheet_votos = spreadsheet.worksheet("Votos")
except Exception as e:
    print(f"\n❌ ERROR: Fallo durante la configuración de Google Sheets: {e}\n")
    exit()

# ... (El resto del archivo no necesita cambios) ...

def enviar_email_confirmacion(destinatario, lote_votante, voto_nombres, voto_lotes):
    if not destinatario: return
    message = MIMEMultipart("alternative")
    message["Subject"] = "Confirmación de tu Voto - Votación Vecinal"
    message["From"] = EMAIL_REMITENTE
    message["To"] = destinatario
    lista_candidatos_html = ""
    for i in range(len(voto_nombres)):
        lista_candidatos_html += f"<li><b>Candidato:</b> {voto_nombres[i]} - <b>Lote:</b> {voto_lotes[i]}</li>"
    html = f"""
    <html><body style="font-family: sans-serif;">
    <h2>¡Gracias por participar en la votación!</h2><p>Este es un comprobante de tu voto.</p>
    <p><b>Tu Lote:</b> {lote_votante}</p><p><b>Selección:</b></p>
    <ul>{lista_candidatos_html}</ul><hr><p>Este es un correo automático.</p>
    </body></html>"""
    message.attach(MIMEText(html, "html"))
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(EMAIL_REMITENTE, CONTRASENA_APLICACION)
            server.sendmail(EMAIL_REMITENTE, destinatario, message.as_string())
        print(f"Email de confirmación enviado a {destinatario}")
    except Exception as e:
        print(f"Error al enviar el email a {destinatario}: {e}")

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    lote_ingresado, codigo_ingresado = data.get('lote'), data.get('codigo')
    if not lote_ingresado or not codigo_ingresado:
        return jsonify({'exito': False, 'mensaje': 'Faltan datos.'}), 400
    try:
        celda_lote = sheet_usuarios.find(lote_ingresado, in_column=1)
        if not celda_lote: return jsonify({'exito': False, 'mensaje': 'Número de lote o código incorrecto.'})
        fila = sheet_usuarios.row_values(celda_lote.row)
        utilizado = fila[2] if len(fila) > 2 else ""
        if utilizado.upper() == "SI": return jsonify({'exito': False, 'mensaje': 'Este código ya ha sido utilizado para votar.'})
        if fila[1].lower() == codigo_ingresado.lower(): return jsonify({'exito': True, 'mensaje': 'Acceso concedido. Redirigiendo...'})
        else: return jsonify({'exito': False, 'mensaje': 'Número de lote o código incorrecto.'})
    except: return jsonify({'exito': False, 'mensaje': 'Ocurrió un error'}), 500

@app.route('/candidatos', methods=['GET'])
def obtener_candidatos():
    try: return jsonify(sheet_candidatos.get_all_records())
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/votar', methods=['POST'])
def emitir_voto():
    data = request.get_json()
    lote, codigo, voto_ids = data.get('lote'), data.get('codigo'), data.get('votoIds')
    voto_nombres, voto_lotes, email = data.get('votoNombres'), data.get('votoLotes'), data.get('email', '')
    if not isinstance(voto_ids, list) or not (1 <= len(voto_ids) <= 5):
        return jsonify({'exito': False, 'mensaje': 'Debes seleccionar entre 1 y 5 candidatos.'}), 400
    try:
        if sheet_votos.find(lote, in_column=2): return jsonify({'exito': False, 'mensaje': 'Ya has emitido un voto anteriormente.'})
    except gspread.exceptions.CellNotFound: pass
    try:
        votos_formateados = [f"{voto_nombres[i]} - Lote: {voto_lotes[i]}" for i in range(len(voto_ids))]
        votos_formateados.extend([''] * (5 - len(votos_formateados)))
        fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        nuevo_voto = [fecha_actual, lote, codigo] + votos_formateados + [email]
        sheet_votos.append_row(nuevo_voto)
        try:
            celda_usuario = sheet_usuarios.find(lote, in_column=1)
            if celda_usuario: sheet_usuarios.update_cell(celda_usuario.row, 3, 'SI')
        except Exception as e: print(f"Advertencia: No se pudo marcar el código para el lote {lote}. Error: {e}")
        if email:
            enviar_email_confirmacion(destinatario=email, lote_votante=lote, voto_nombres=voto_nombres, voto_lotes=voto_lotes)
        return jsonify({'exito': True, 'mensaje': '¡Gracias! Tu voto ha sido registrado.'})
    except Exception as e: return jsonify({'exito': False, 'mensaje': f'Ocurrió un error al registrar el voto: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
