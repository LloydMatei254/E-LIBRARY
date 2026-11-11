import express, { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const PYTHON_PORT = 5001;
const PYTHON_BASE_URL = `http://127.0.0.1:${PYTHON_PORT}`;

app.use(express.json());

// Spawn Python OOP HTTP Server process
let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  const pythonScript = path.join(__dirname, 'backend', 'api_server.py');
  console.log(`[Server] Starting Python OOP backend daemon on port ${PYTHON_PORT}...`);

  pythonProcess = spawn('python3', [pythonScript, String(PYTHON_PORT)], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  pythonProcess.on('error', (err) => {
    console.error('[Server] Failed to start Python backend:', err);
  });

  pythonProcess.on('exit', (code, signal) => {
    console.warn(`[Server] Python backend exited with code ${code}, signal ${signal}. Restarting in 2s...`);
    setTimeout(startPythonBackend, 2000);
  });
}

startPythonBackend();

// Graceful cleanup on server stop
process.on('SIGINT', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit();
});
process.on('SIGTERM', () => {
  if (pythonProcess) pythonProcess.kill('SIGTERM');
  process.exit();
});

// Proxy all /api/* requests to Python backend
app.all('/api/*', async (req: Request, res: Response) => {
  const targetUrl = `${PYTHON_BASE_URL}${req.originalUrl}`;
  const method = req.method;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method !== 'GET' && method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const pyRes = await fetch(targetUrl, fetchOptions);
    const contentType = pyRes.headers.get('content-type') || 'application/json';
    const textData = await pyRes.text();

    res.status(pyRes.status);
    res.setHeader('Content-Type', contentType);
    res.send(textData);
  } catch (err: any) {
    console.error(`[Proxy Error] Failed to contact Python backend at ${targetUrl}:`, err.message);
    res.status(502).json({
      error: 'Python OOP Backend is initializing or unreachable. Please retry in a moment.',
      details: err.message,
    });
  }
});

// Static / Vite middleware setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express] Berzowanley E-Library server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
