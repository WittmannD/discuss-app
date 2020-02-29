const express = require('express');
const cookieSession = require('cookie-session');
const cookie = require('cookie');
const http = require('http');
const socket = require('socket.io');
const path = require('path');
const Pool = require('pg').Pool;
const util = require(path.join(__dirname, '/lib/util'));
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const port = process.env.PORT || 8080;

app.set('port', port);
app.use('/public', express.static(path.join(__dirname, '/public')));

app.use(cookieSession({
    name: 'commentSystemClient',
    secret: process.env.SECRET || 'ax87gZbDu6g3d86gPOob38d86g7wEEg',
    httpOnly: false,
    maxAge: 24 * 3 * 60 * 60 * 1000
}));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'views/index.html'));
    request.session.clientId = request.session.clientId || util.getUniqueId(8);
});

io.sockets.on('connection', function(socket) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const data = JSON.parse(Buffer.from(cookies["commentSystemClient"], 'base64').toString());

    socket.emit('session start', data);

    getAll(function (result) {
        if (result) {
            socket.emit('comment', result);
        } else {
            socket.emit('error');
        }
    });

    socket.on('record', function (recordData) {
        add(recordData, data.clientId, function (result) {
            if (result) {
                io.sockets.emit('comment', result);
            } else {
                io.sockets.emit('error');
            }
        })
    });

    socket.on('deleteRecord', function (commentId) {
        deleteRecord(commentId, function (result) {
            if (result) {
                io.sockets.emit('deleteComment', result);
            } else {
                io.sockets.emit('error')
            }
        })

    })
});


// TODO: Create module 'request' for connecting to server and functions 'insert', 'select', 'delete', 'update'.

const getAll = function (callback) {
    pool.query('SELECT * FROM comment_records;', (err, res) => {
        if (err) {
            callback(false);
            return;
        }

        callback(res.rows);
    });
};

const add = function (data, clientId, callback) {
    const queryString = `
        INSERT INTO comment_records
        (parent_id, author, message, owner) 
        VALUES
        (${data.parent_id}, '${data.author}', '${data.message}', '${clientId}') 
        RETURNING *;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    })
};

const deleteRecord = function (id, callback) {
    const queryString = `
        WITH RECURSIVE tree AS (
            SELECT comment_id, parent_id
            FROM comment_records
            WHERE comment_id = ${id}
            UNION ALL
            SELECT c.comment_id, c.parent_id
            FROM comment_records c
                JOIN tree p ON p.comment_id = c.parent_id
        )
        DELETE FROM comment_records
        WHERE comment_id IN (SELECT comment_id FROM tree)
        RETURNING *;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    })
};

server.listen(port, function() {
    console.log('listening on *:' + port);
});