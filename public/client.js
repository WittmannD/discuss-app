const io = require('socket.io-client');
const util = require('../lib/util');

class Comment {
    constructor(commentData, clientId) {
        this.commentId = commentData.comment_id;
        this.parentId = commentData.parent_id;
        this.createdAt = commentData.created_at;
        this.author = commentData.author;
        this.message = commentData.message;
        this.owner = commentData.owner;

        const entry = `
            <div class="comment-content">
                <div class="comment-header">
                    <p class="author">${this.author}</p>
                    <span class="created-at">${util.getTimeDifference(this.createdAt)}</span>
                </div>
                <p class="message">${this.message}</p>
                <div class="comment-footer">
                    <a href="#" class="reply">reply</a>
                    ${this.owner === clientId ? '<a href="#" class="edit">edit</a>' : ''}
                    ${this.owner === clientId ? '<a href="#" class="delete">delete</a>' : ''}
                </div>
            </div>
        `;

        this.entity = document.createElement('div');
        this.entity.className = 'comment';
        this.entity.id = this.commentId;
        this.entity.innerHTML = entry;
    }

    remove() {
        this.entity.parentNode.removeChild(this.entity);
    }
}

class CommentForm {
    constructor(mode, socket, parentId=0) {
        this.mode = mode;
        this.socket = socket;
        this.parentId = parentId;
        this.form = document.createElement('form');
        this.form.className = 'comment-form';
        this.form.innerHTML = `
            ${document.cookie}
            ${mode !== 'editing' ? '<div contenteditable="true" class="form-author"></div>' : ''}
            <div contenteditable="true" class="form-message"></div>
            <button class="form-submit">Send</button> 
            ${mode !== 'creating' ? '<button class="form-reset">Reset</button>' : ''}
       `;
    }

    getFormData() {
        return ({
            parent_id: this.mode === 'replying' ? this.parentId : 0,
            author: this.form.querySelector('.form-author').textContent,
            message: this.form.querySelector('.form-message').textContent
        })
    }

    remove() {
        this.form.parentNode && this.form.parentNode.removeChild(this.form);
    }

    clear() {
        this.form.querySelector('.form-message').textContent = '';
    }

    init(wrapper) {
        this.form.querySelector('.form-submit').addEventListener('click', (e) => {
            e.preventDefault();
            switch (this.mode) {
                case 'creating':
                    this.socket.emit('record', this.getFormData());
                    this.clear();
                    break;

                case 'replying':
                    this.socket.emit('record', this.getFormData());
                    this.remove();
                    break;

                case 'editing':
                    this.socket.emit('updateRecord', this.getFormData());
                    break;
            }
        });

        const resetButton = this.form.querySelector('.form-reset');
        resetButton && resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.clear();
            this.remove();
        });

        wrapper.insertBefore(this.form, wrapper.children[1]);
        this.form.querySelector('.form-message').focus();

        return this;
    }
}

class CommentsSystem {
    constructor(data, socket) {
        this.socket = socket;
        this.data = data;
        this.comments = new Map();
        this.commentForm = new CommentForm('creating', socket).init(document.getElementById('commentForm'));
        this.replyForm = null;
        this.wrapper = document.querySelector('#commentWrapper');
    }

    addComment(comments) {
        console.log(comments);
        comments.forEach(commentData => {
            const parentId = commentData.parent_id;
            const wrapper = parentId ? this.comments.get(parentId).entity : this.wrapper;
            const comment = new Comment(commentData, this.data.clientId);

            wrapper.appendChild(comment.entity);
            this.comments.set(commentData.comment_id, comment);

            comment.entity.querySelector('a.reply').addEventListener('click', (e) => {
                e.preventDefault();
                this.replyClickHandler(commentData.comment_id);
            });

            if (this.data.clientId === commentData.owner) {

                comment.entity.querySelector('a.delete').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.deleteClickHandler(commentData.comment_id);
                });

            }
        })
    }

    deleteComment(comments) {
        console.log(comments);
        comments.forEach(({comment_id, ...tmp}) => {
            this.comments.get(comment_id).remove();
            this.comments.delete(comment_id);
        })
    }

    replyClickHandler(commentId) {
        const wrapper = this.comments.get(commentId).entity;
        if (this.replyForm) {
            this.replyForm.remove();
        }
        this.replyForm = new CommentForm('replying', this.socket, commentId).init(wrapper);
    }

    editClickHandler(commentId) {

    }

    deleteClickHandler(commentId) {
        this.socket.emit('deleteRecord', commentId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let commentSystem;

    socket.on('session start', function (data) {
        commentSystem = new CommentsSystem(data, socket);
    });

    socket.on('comment', function (comments) {
        commentSystem.addComment(comments);
    });

    socket.on('deleteComment', function (comments) {
        commentSystem.deleteComment(comments);
    });

    socket.on('error', () => {document.write('SOMETHING WENT WRONG')})
});