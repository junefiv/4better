const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const apkName = '4better-dev-arm64.apk';
const apkPath = path.resolve(__dirname, '..', 'dist', apkName);

http.createServer((request, response) => {
  if (request.url !== `/${apkName}`) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const stat = fs.statSync(apkPath);
  response.writeHead(200, {
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${apkName}"`,
  });
  fs.createReadStream(apkPath).pipe(response);
}).listen(8000, '0.0.0.0', () => {
  console.log(`Serving ${apkName} on port 8000`);
});
