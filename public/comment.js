const io = require('socket.io-client');
const { CommentPage } = require('./js/commentsSystem');

document.addEventListener('DOMContentLoaded', () => {
    const commentId = parseInt(new URL(window.location.href).searchParams.get('id'));
    if (commentId) {
        const socket = io('/comment-' + commentId);
        const wrapper = document.getElementById('commentPage');
        let commentPage;

        socket.on('session start', function (data) {
            commentPage = new CommentPage(wrapper, socket, data);
        });

        socket.on('comment', function (comments) {
            commentPage.initComment(comments[0]);
        });

        socket.on('err', (err) => {
            document.write(err)
        })
    }
});