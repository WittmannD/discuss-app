const io = require('socket.io-client');
const socket = io();

class Comment {
    constructor(commentData) {
        const entity = document.createElement('div');
        const commentWrapper = document.createElement('div');
        const createTime = document.createElement('span');
        const autor = document.createElement('h3');
        const message = document.createElement('div');

        entity.id = commentData.id;
        createTime.innerText = commentData.createTime;
        autor.innerText = commentData.autor;
        message.innerText = commentData.message;

        commentWrapper.appendChild(createTime);
        commentWrapper.appendChild(autor);
        commentWrapper.appendChild(message);
        entity.appendChild(commentWrapper);

        this.id = commentData.id;
        this.entity = entity;
    }
}

class CommentsSystem {
    constructor() {
        this.comments = new Map();
    }

    add(comments) {
        console.log(comments);
        comments.forEach(commentData => {
            const parentId = commentData.parent;
            const wrapper = parentId ? this.comments.get(parentId).entity : document.querySelector('#commentWrapper');
            const comment = new Comment(commentData);

            wrapper.appendChild(comment.entity);
            this.comments.set(commentData.id, comment);
        })
    }
}

class CommentForm {
    constructor(element) {
        this.entity = element;

        this.form = document.createElement('form');
        this.autorField = document.createElement('input');
        this.messageField = document.createElement('textarea');
        this.submitButton = document.createElement('input');

        this.autorField.setAttribute('name', 'author');
        this.messageField.setAttribute('name', 'message');
        this.submitButton.setAttribute('type', 'submit');

        this.form.appendChild(this.autorField);
        this.form.appendChild(this.messageField);
        this.form.appendChild(this.submitButton);
        this.entity.appendChild(this.form);
    }

    getFormData() {
        console.log(new FormData(this.form));
        return ({
            id: parseInt(Math.random() * 3000),
            parent: 0,
            createTime: Date.now(),
            updateTime: 0,
            autor: this.autorField.value,
            message: this.messageField.value
        })
    }

    submitHandler() {
        socket.emit('record', this.getFormData());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const commentSystem = new CommentsSystem();
    const commentForm = new CommentForm(document.getElementById('commentForm'));
    commentForm.submitButton.addEventListener('click', commentForm.submitHandler.bind(commentForm));

    socket.on('comment', function (comment) {
        commentSystem.add(comment);
    });
});