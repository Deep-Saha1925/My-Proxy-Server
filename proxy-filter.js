const http = require('http');
const net = require('net');
const url = require('url');

const ALLOWED_DOMAINS = [
  'google.com',
  'github.com',
  'stackoverflow.com'
];

function isAllowed(hostname) {
  return ALLOWED_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );
}


const PORT = 8080;

/**
 * HTTP PROXY
 */
const server = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url);
    const hostname = parsedUrl.hostname;

    if(!hostname || !isAllowed(hostname)){
        console.log(`❌ BLOCKED HTTP: ${req.url}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Blocked by proxy');
    }

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

    if(!isAllowed(host)){
        console.log(`❌ BLOCKED HTTPS: ${host}`);
        clientSocket.write(
        'HTTP/1.1 403 Forbidden\r\n\r\nBlocked by proxy'
        );
        return clientSocket.end();
    }

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