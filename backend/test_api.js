const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('https://medfinance360-backend.onrender.com/api/patients?page=1&limit=15&onlyPrincipals=true', {
      // Just see if we can hit the endpoint or wait, we need auth token. Let's try to login as admin.
    });
    console.log(res.data);
  } catch(e) { console.error('Error:', e.message); }
}
test();
