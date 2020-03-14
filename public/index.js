const io = require('socket.io-client');
const { CommentsSystem } = require('./js/commentsSystem');
const UserError = require('./js/userError');

document.addEventListener('DOMContentLoaded', () => {
    const socket = io('/index');
	const errorOutput = new UserError(document.querySelector('main')).init();
    const wrapper = document.getElementById('commentWrapper');
    let commentSystem;

    socket.on('session start', function (data) {
        commentSystem = new CommentsSystem(wrapper, socket, data);
    });

    socket.on('comment', function (comments) {
        commentSystem.addComment(comments);
    });

    socket.on('deleteComment', function (comments) {
        commentSystem.deleteComment(comments);
    });

    socket.on('err', () => {
		errorOutput.show('SOMTHING WENT WRONG');
	});
});