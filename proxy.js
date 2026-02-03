const http = require('http');
const url = require('url');

const PORT = 8080;

const server = http.createServer((req, res) => {
    const parseUrl = url.parse(req.url);

    const options = {
        hostname: parseUrl.hostname,
        port: parseUrl.port || 80,
        path: parseUrl.path,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    req.pipe(proxyReq);

    proxyReq.on('error', (err) => {
        res.writeHead(500);
        res.end('Proxy Error');
        console.log(err);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});