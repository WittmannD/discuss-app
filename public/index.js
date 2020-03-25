const io = require('socket.io-client');
const { CommentsSystem } = require('./js/commentsSystem');
const UserError = require('./js/userError');

document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/index');
    
	const errorOutput = new UserError(document.querySelector('main')).init();
    const wrapper = document.getElementById('commentWrapper');
    
    const commentsCounter = {
        element: document.getElementById('commentsCount'),
        update: function (commentsCount) { this.element.innerText = `${commentsCount} comments`; }
    };
    const clientsCounter = {
        element: document.getElementById('usersCount'),
        update: function (clientsCount) { this.element.innerText = `${clientsCount} online`; }
    };
    
    let commentSystem;
    
    socket.on('session start', function (data, clientsCount, commentsCount) {
        commentSystem = new CommentsSystem(wrapper, socket, data);
        commentSystem.getComments();
        console.log(commentsCount);
        clientsCounter.update(clientsCount);
        commentsCount && commentsCounter.update(commentsCount);
    });

    socket.on('comment', function (comments, isNew) {
        commentSystem.addComment(comments, isNew);
            
    });

    socket.on('deleteComment', function (comments) {
        commentSystem.deleteComment(comments);
    });

    socket.on('err', (err) => {
		errorOutput.show(err);
	});
});