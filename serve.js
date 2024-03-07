import path from 'path';
import fs from 'fs';
import { Transform } from 'stream';
import WebSocket, { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

import express from 'express';
import hijackResponse from 'hijackresponse';
import chokidar from 'chokidar';

const app = express();
const port = 8080;

const reloadScript = fs.readFileSync('./modules/reload.js');

function transformStream() {
  return new Transform({
    transform(chunk, encoding, callback) {
      // Convert the chunk to a string
      let data = chunk.toString();

      // Find the index of the closing body tag
      const index = data.lastIndexOf('</body>');

      // If the closing body tag is found, insert "TEST" before it
      if (index !== -1) {
        const script = `<script>${reloadScript}</script>`;
        data = data.slice(0, index) + script + data.slice(index);
      }

      // Pass the transformed data to the callback
      callback(null, data);
    }
  });
}

app.use((req, res, next) => {
  hijackResponse(res, next).then(({ readable, writable }) => {
    // Only hijack HTML responses:
    if (/^text\/html/.test(res.getHeader("Content-Type"))) {
      res.setHeader("X-Hijacked", "yes!");
      res.removeHeader("Content-Length");
      readable.pipe(transformStream()).pipe(writable);
    } else {
      // Don't hijack
      return readable.pipe(writable);
    }
  });
});

// Middleware to serve files from the views folder
app.use(express.static('public'));

// Start the server
const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const wss = new WebSocketServer({ server, path: '/reload' });

// Listen for incoming connections
wss.on('connection', function connection(ws) {
  console.log('A new client connected');

  // Handle messages from the client
  ws.on('message', function incoming(message) {
    console.log('Received:', message);
  });
});

// Watch for file changes in the public directory
const watcher = chokidar.watch('public');
watcher.on('change', (path) => {
  console.log(`File ${path} has been changed. Notifying page...`);
  // Send a message to all connected clients to refresh the page
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload', file: path.replace(/\\+/g, '/').replace(/^\.?\/*public/g, '') }));
    }
  });
  try {
    //execSync('npm run build:css', { stdio: 'inherit' });
    spawn('npm.cmd', ['run', 'build:css']);
    console.log('called build:css');
  } catch (error) {
    console.error(error);
  }
});

// Watch for file changes in the components directory
const watcher2 = chokidar.watch(['components', 'css', 'js']);
watcher2.on('change', (path) => {
  console.log(`File ${path} has been changed. Rebuilding...`);
  spawn('node', ['./build.js']);
});
