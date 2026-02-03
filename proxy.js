const http = require('http');
const net = require('net');
const url = require('url');

const PORT = 8080;

/**
 * HTTP PROXY
 */
const server = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: req.method,
      headers: req.headers
    };

    console.log(`[HTTP] ${req.method} ${req.url}`);

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    req.pipe(proxyReq);

    proxyReq.on('error', (err) => {
      console.error('HTTP Proxy Error:', err.message);
      res.writeHead(500);
      res.end('Proxy Error');
    });

  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal Error');
  }
});

/**
 * HTTPS (CONNECT) PROXY
 */
server.on('connect', (req, clientSocket, head) => {
  const [host, port] = req.url.split(':');

  console.log(`[HTTPS] CONNECT ${host}:${port}`);

  const serverSocket = net.connect(port || 443, host, () => {
    clientSocket.write(
      'HTTP/1.1 200 Connection Established\r\n\r\n'
    );

    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', () => clientSocket.end());
  clientSocket.on('error', () => serverSocket.end());
});

server.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});