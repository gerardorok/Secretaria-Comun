/**
 * Aplicación de escritorio "Secretaría Común" para la Contraloría General
 * de la República (Gerencia Departamental Colegiada del Magdalena).
 *
 * Esta aplicación Electron:
 *   1. Arranca el backend FastAPI empaquetado (`backend.exe` en Windows)
 *      en un puerto libre del equipo (modo local, sin internet).
 *   2. Espera a que el backend responda en /api/.
 *   3. Abre una ventana nativa con la interfaz React servida por el mismo
 *      backend.
 *   4. Al cerrar la ventana, termina el proceso del backend.
 */
const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");
const http = require("http");

let backendProcess = null;
let mainWindow = null;

// --------------------------- Utilidades -----------------------------------
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function waitForBackend(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(`http://127.0.0.1:${port}/api/`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", retry);
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error("El backend no respondió a tiempo."));
        return;
      }
      setTimeout(tryOnce, 300);
    };
    tryOnce();
  });
}

function getBackendExecutable() {
  // Ruta donde electron-builder ubica los recursos extra en producción.
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "backend.exe");
  }
  // Ruta para desarrollo local (no se usa cuando se distribuye el .exe).
  return path.join(__dirname, "..", "..", "dist-backend", "backend.exe");
}

// --------------------------- Arranque del backend -------------------------
async function startBackend() {
  const port = await findFreePort();
  const exe = getBackendExecutable();

  backendProcess = spawn(exe, ["--host", "127.0.0.1", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  backendProcess.stdout.on("data", (d) => {
    console.log(`[backend] ${d.toString().trim()}`);
  });
  backendProcess.stderr.on("data", (d) => {
    console.log(`[backend] ${d.toString().trim()}`);
  });
  backendProcess.on("exit", (code) => {
    console.log(`[backend] proceso finalizado con código ${code}`);
    backendProcess = null;
  });

  await waitForBackend(port);
  return port;
}

// --------------------------- Ventana principal ----------------------------
function createWindow(backendUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    title: "Secretaría Común",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Forzar que los enlaces externos se abran en el navegador del sistema.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(backendUrl);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// --------------------------- Ciclo de vida --------------------------------
app.whenReady().then(async () => {
  try {
    const port = await startBackend();
    createWindow(`http://127.0.0.1:${port}/`);
  } catch (err) {
    console.error("Error iniciando el backend:", err);
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "No se pudo iniciar la aplicación",
      "Ocurrió un error al iniciar el motor interno de la aplicación.\n\n" +
        "Detalle: " +
        (err && err.message ? err.message : String(err))
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (_) {
      /* noop */
    }
  }
  app.quit();
});

app.on("before-quit", () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (_) {
      /* noop */
    }
  }
});
