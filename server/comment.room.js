const cookie = require("cookie");
const requests = require("./requests");

module.exports = function(socket) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const data = JSON.parse(Buffer.from(cookies["commentSystemClient"], 'base64').toString());
    const commentId = parseInt(socket.nsp.name.match(/^\/comment-(\d+)$/)[1]);
    const io = this;

    socket.emit('session start', data);

    requests.getById(commentId, data.clientId, function (result) {
        if (result) {
            socket.emit('comment', result);
			
        } else {
            socket.emit('error');
        }
    });

    socket.on('updateRecord', function (recordData) {
        requests.updateRecord(recordData, commentId, data.clientId, function (result) {
            if (result) {
                io.to('/').emit('comment', result);
            } else {
                socket.emit('error');
            }
        })
    });
};