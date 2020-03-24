const io = require('socket.io-client');
const { CommentsSystem } = require('./js/commentsSystem');
const UserError = require('./js/userError');

document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/index');
	const errorOutput = new UserError(document.querySelector('main')).init();
    const wrapper = document.getElementById('commentWrapper');
    
    const commentsCounter = {
        element: document.getElementById('commentsCount'),
        update: function () { this.element.innerText = `${commentSystem.commentsCount} comments`; }
    };
    const clientsCounter = {
        element: document.getElementById('usersCount'),
        update: function (clientsCount) { this.element.innerText = `${clientsCount} online`; }
    };
    
    let commentSystem;
    
    socket.on('session start', function (data, clientsCount) {
        commentSystem = new CommentsSystem(wrapper, socket, data);
        clientsCounter.update(clientsCount);
    });

    socket.on('comment', function (comments) {
        commentSystem.addComment(comments);
        if (commentSystem.commentsCount)
            commentsCounter.update();
    });

    socket.on('deleteComment', function (comments) {
        commentSystem.deleteComment(comments);
        if (commentSystem.commentsCount)
            commentsCounter.update();
    });

    socket.on('err', (err) => {
		errorOutput.show(err);
	});
});