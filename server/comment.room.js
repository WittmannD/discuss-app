const cookie = require("cookie");

const requests = require("./requests");
const constants = require("../lib/constants.js")

module.exports = function(io, socket) {
    const commentId = parseInt(socket.nsp.name.match(/^\/comment-(\d+)$/)[1]);
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const data = JSON.parse(Buffer.from(cookies["commentSystemClient"], 'base64').toString());
    
    requests.getCount(function (result) {
        socket.emit('session start', data, io.engine.clientsCount, result[0].count);
    });

    socket.on('getRecord', function(commentId) {
        requests.getById(commentId, data.clientId, function (result, err) {
            if (result) {
                socket.emit('comment', result);
                
            } else {
                socket.emit('err', err);
            }
        });
    });

    socket.on('updateRecord', function (recordData) {
        if (
            recordData.message === '' ||
            recordData.message.match(constants.MESSAGE_PATTERN) === null
        ) { socket.emit('err', 'Input correct comment data!'); }
        else {
            requests.updateRecord(recordData, commentId, data.clientId, function (result, err) {
                if (result) {
                    io.to('/').emit('comment', result);
                } else {
                    socket.emit('err', err);
                }
            })
        }
    });
};