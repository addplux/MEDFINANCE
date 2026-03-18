const net = require('net');

const client = net.createConnection({ host: 'aws-1-us-west-1.pooler.supabase.com', port: 6543 }, () => {
  console.log('✅ Connection established successfully');
  client.end();
});

client.on('error', (err) => {
  console.error('❌ Connection failed:', err.message);
});
