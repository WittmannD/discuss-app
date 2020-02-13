const express = require('express');
const http = require('http');
const socket = require('socket.io');

const { Client } = require('pg');

const app = express();
const server = http.createServer(app);

const io = socket(server);
const path = require('path');

const port = process.env.PORT || 5000;
app.set('port', port);

app.use('/public', express.static(path.join(__dirname, '/public')));

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/index.html'));
});

io.on('connection', function(socket) {
    console.log('A user is connected');
    getAll(function (res) {
        if (res) {
            io.emit('comment', res);
        } else {
            io.emit('error');
        }
    });
});

const getAll = function (callback) {
    client.connect();
    client.query('SELECT * FROM comment_records;', (err, res) => {
        if (err) {
            callback(false);
            return;
        }

        callback(res.rows);
        client.end();
    });
};

server.listen(port, function() {
    console.log('listening on *:' + port);
});