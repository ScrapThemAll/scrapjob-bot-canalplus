var socket = require('socket.io-client')('http://localhost:3000');

socket.on('poste', (poste) => console.log(poste));