const cookie = require("cookie");

const requests = require("./requests");
const constants = require("../lib/constants.js")

module.exports = function(socket) {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const data = JSON.parse(Buffer.from(cookies["commentSystemClient"], 'base64').toString());
    const io = this;
    
    socket.emit('session start', data, io.engine.clientsCount);
	
    requests.getAll(function (result, err) {
        if (result) {
            socket.emit('comment', result);
        } else {
            socket.emit('err', err);
        }
    });
    
    socket.on('record', function (recordData) {
        if (
            recordData.author === '' ||
            recordData.message === '' ||
            recordData.author.match(constants.USERNAME_PATTERN) === null ||
            recordData.message.match(constants.MESSAGE_PATTERN) === null
        ) { socket.emit('err', 'Input correct comment data!'); }
        else {
            requests.addRecord(recordData, data.clientId, function (result, err) {
                if (result) {
                    io.of(socket.nsp.name).emit('comment', result);
                } else {
                    socket.emit('err', err);
                }
            })
        }
    });
	
    socket.on('deleteRecord', function (commentId) {
        requests.deleteRecord(commentId, data.clientId, function (result, err) {
            if (result) {
                io.of(socket.nsp.name).emit('deleteComment', result);
            } else {
                socket.emit('err', err)
            }
        })
    });
};