const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ host: 'aws-1-us-west-1.pooler.supabase.com', port: port }, () => {
      console.log(`✅ Port ${port} is OPEN!`);
      client.end();
      resolve(true);
    });

    client.on('error', (err) => {
      console.log(`❌ Port ${port} is CLOSED (Refused: ${err.message})`);
      resolve(false);
    });
  });
}

(async () => {
  await checkPort(6543);
  await checkPort(5432);
})();
