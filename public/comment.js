const io = require('socket.io-client');
const { CommentPage } = require('./js/commentsSystem');

document.addEventListener('DOMContentLoaded', () => {
    const commentId = parseInt(new URL(window.location.href).searchParams.get('id'));
    if (commentId) {
        const socket = io('/comment-' + commentId);
        const wrapper = document.getElementById('commentPage');
        
        const commentsCounter = {
            element: document.getElementById('commentsCount'),
            update: function (commentsCount) { this.element.innerText = `${commentsCount} comments`; }
        };
        const clientsCounter = {
            element: document.getElementById('usersCount'),
            update: function (clientsCount) { this.element.innerText = `${clientsCount} online`; }
        };
        
        let commentPage;

        socket.on('session start', function (data, clientsCount, commentsCount) {
            commentPage = new CommentPage(wrapper, socket, data);
            
            clientsCounter.update(clientsCount);
            commentsCount && commentsCounter.update(commentsCount);
        });
        
        socket.emit('getRecord', commentId);

        socket.on('comment', function (comments) {
            commentPage.initComment(comments[0]);
        });

        socket.on('err', (err) => {
            document.write(err)
        })
    }
});