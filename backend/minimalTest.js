const credentials = {
    apiKey: 'atsk_36054152bf006d016d83d30e51723126a5c141dbac12a16d6cf9fe90c6861137a150650e',
    username: 'sandbox'
};

const africastalking = require('africastalking')(credentials);

console.log('Using API Key length:', credentials.apiKey.length);
console.log('Using Username:', credentials.username);

africastalking.SMS.send({
    to: ['+260977621498'],
    message: 'Hello from MedFinance Sandbox Test!'
})
    .then(response => {
        console.log('SUCCESS:');
        console.log(response);
    })
    .catch(error => {
        console.log('ERROR:');
        if (error.response && error.response.data) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    });
