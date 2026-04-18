const http = require('http');

const data = JSON.stringify({
  month: "25.01",
  reportText: "Testing",
  insights: []
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/analysis-report',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let chunks = '';
  res.on('data', d => chunks += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', chunks));
});

req.on('error', console.error);
req.write(data);
req.end();
