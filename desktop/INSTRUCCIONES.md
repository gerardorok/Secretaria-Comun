# 📥 Cómo obtener el instalador "Secretaría Común" para Windows

Esta guía paso a paso te explica cómo conseguir el archivo `.exe` que se instala
en cada PC. **No necesitas saber programación** — la compilación se hace
automáticamente en la nube.

---

## ✅ Lo que vas a obtener al final

Un archivo llamado algo como `Secretaria-Comun-Setup-1.0.0.exe` (~150–200 MB)
que:

- Funciona **100% sin internet**.
- Se instala como cualquier programa de Windows (doble clic en el `.exe`).
- Crea un acceso directo en el escritorio con el nombre **"Secretaria Comun"**.
- Incluye los 3 módulos: Notificación por Aviso, Notificación Electrónica y
  Citación a Notificación Personal.
- No necesita base de datos ni servidor — todo corre en el mismo equipo.

---

## 🛠️ Pasos para conseguirlo (única vez)

### Paso 1 · Guarda el código en GitHub

1. Dentro de **Emergent**, busca la opción **"Save to GitHub"** (suele estar
   en el menú lateral o superior).
2. Si es tu primera vez, te pedirá conectar tu cuenta de **GitHub**. Si no
   tienes cuenta, regístrate gratis en <https://github.com> (es como un
   "Google Drive para código").
3. Acepta los permisos y deja que Emergent suba el código a un repositorio
   nuevo. Anota el nombre del repositorio (ej: `tu-usuario/aviso-generador`).

### Paso 2 · Compila el instalador automáticamente

1. Entra a tu repositorio en <https://github.com> → pestaña **"Actions"**.
2. En la lista de la izquierda elige **"Build Desktop App (Windows)"**.
3. Haz clic en el botón **"Run workflow"** (arriba a la derecha) → confirma
   con otro **"Run workflow"**.
4. Espera **~10 minutos**. Cuando aparezca un ✅ verde, está listo.

### Paso 3 · Descarga el `.exe`

1. En la misma pestaña **Actions**, abre la ejecución que acaba de terminar.
2. Hasta abajo verás la sección **"Artifacts"**. Descarga
   **`SecretariaComun-Windows-Installer`**.
3. Es un `.zip` — al abrirlo encontrarás el archivo
   `Secretaria-Comun-Setup-1.0.0.exe`.

### Paso 4 · Instala en cada PC

1. Doble clic en el `.exe`.
2. Sigue el asistente (siguiente, siguiente, instalar).
3. Aparece el acceso directo **"Secretaria Comun"** en el escritorio.

> 💡 **Nota**: La primera vez Windows puede mostrar una advertencia "Windows
> protegió tu PC". Es normal porque el `.exe` no está firmado con un certificado
> comercial. Haz clic en **"Más información"** → **"Ejecutar de todas formas"**.

---

## 🔄 ¿Cómo actualizo la app cuando hagamos un cambio?

Cada vez que yo (o tú) actualicemos el código en Emergent y le des "Save to
GitHub" otra vez, GitHub Actions **vuelve a compilar el `.exe` automáticamente**.
Solo repites el **Paso 3** y **Paso 4** para reinstalar.

---

## 🆘 Si algo sale mal

- ❌ El workflow falla en GitHub Actions → mándame una captura del error y lo
  arreglo desde Emergent.
- ❌ El `.exe` no se ejecuta → asegúrate de que el equipo sea Windows 10/11
  de 64 bits.
- ❌ La app se abre pero los módulos no responden → reinicia la app; si
  persiste, desinstala y vuelve a instalar.
