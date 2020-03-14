const cookie = require("cookie");
const requests = require("./requests");

module.exports = function(socket) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const data = JSON.parse(Buffer.from(cookies["commentSystemClient"], 'base64').toString());
    const io = this;
	
    socket.emit('session start', data);
	
    requests.getAll(function (result) {
        if (result) {
            socket.emit('comment', result);
        } else {
            socket.emit('err');
        }
    });
	
    socket.on('record', function (recordData) {
        requests.addRecord(recordData, data.clientId, function (result) {
            if (result) {
                io.of(socket.nsp.name).emit('comment', result);
            } else {
                socket.emit('err');
            }
        })
    });
	
    socket.on('deleteRecord', function (commentId) {
        requests.deleteRecord(commentId, function (result) {
            if (result) {
                io.of(socket.nsp.name).emit('deleteComment', result);
				socket.emit('err');
            } else {
                socket.emit('err')
            }
        })
	
    })
};