const express = require('express');
const cookieSession = require('cookie-session');
const http = require('http');
const socket = require('socket.io');
const path = require('path');

const indexRoom = require('./server/index.room');
const commentRoom = require('./server/comment.room');
const util = require(path.join(__dirname, '/lib/util'));

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = process.env.PORT || 8080;

app.set('port', port);

app.use('/public', express.static(path.join(__dirname, '/public')));

app.use(cookieSession({
    name: 'commentSystemClient',
    secret: process.env.SECRET,
    maxAge: 24 * 3 * 60 * 60 * 1000
}));

app.use(function(request, response, next) {
    request.session.clientId = request.session.clientId || util.getUniqueId(8);
    next();
});

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/comment', function (request, response) {
    response.sendFile(path.join(__dirname, 'views/comment.html'));
});

io.of('/index').on('connection', function(socket) {
    indexRoom(io, socket);
});

io.of(/^\/comment-\d+$/).on('connection', function(socket) {
    commentRoom(io, socket);
});

server.listen(port, function() {
    console.log('listening on *:' + port);
});