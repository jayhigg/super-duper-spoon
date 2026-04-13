import https from 'https';

const data = JSON.stringify({ public_metadata: { isPro: true } });

const options = {
  hostname: 'api.clerk.com',
  path: '/v1/users/user_3CHTg2OLfcB7WYpfDcErTYVOHxW/metadata',
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer sk_test_gRdIl7zd9BS4gJgrPZQuox8J900IeMnHCMl1yIBXs0',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const parsed = JSON.parse(body);
    console.log('Status:', res.statusCode);
    console.log('isPro set to:', parsed.public_metadata?.isPro);
    if (res.statusCode !== 200) console.log('Full response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
