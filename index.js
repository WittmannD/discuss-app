const express = require('express');
const http = require('http');
const socket = require('socket.io');

const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);

const io = socket(server);
const path = require('path');

const port = process.env.PORT || 5000;
app.set('port', port);

app.use('/public', express.static(path.join(__dirname, '/public')));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '/index.html'));
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

app.get('/db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        const results = { 'results': (result) ? result.rows : null};
        console.log(results);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
});

class Record {
    constructor(data) {
        this.id =       data.id;
        this.parent =   data.parent;
        this.createTime = data.createTime;
        this.updateTime = data.createTime;
        this.autor =    data.autor;
        this.message =  data.message;
    }
}

class RecordsSystem {
    constructor(data) {
        this.records = new Map();
    }

    getAllRecords() {
        return this.records.values();
    }

    addRecord(data) {
        const record = new Record(data);
        this.records.set(data.id, record);
    }

    updateRecord(data) {
        this.records.set(data.id, new Record(data));
    }

    deleteRecord(data) {
        this.records.delete(data.id);
    }
}

const recordsSystem = new RecordsSystem();

io.sockets.on('connection', function(socket) {
    socket.emit('comment', [...recordsSystem.getAllRecords()]);

    socket.on('record', function(record) {
        recordsSystem.addRecord(record);
        io.sockets.emit('comment', [record]);
    });
});
//
// io.sockets.on('record', function(record) {
//     console.log(record);
//     recordsSystem.addRecord(record);
//     io.sockets.emit('comment', [record]);
// });
//
// io.sockets.on('updateRecord', function(record) {
//     recordsSystem.updateRecord(record);
//     io.sockets.emit('updateComment', record);
// });
//
// io.sockets.on('deleteRecord', function(record) {
//     recordsSystem.deleteRecord(record);
// });

server.listen(port, function() {
    console.log('listening on *:' + port);
});