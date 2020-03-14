const util = require('../../lib/util');
const constants = require('../../lib/constants');

class Comment {
    constructor(commentData, clientId, singleComment=false) {
        this.commentId = commentData.comment_id;
        this.parentId = commentData.parent_id;
        this.createdAt = commentData.created_at;
        this.author = commentData.author;
        this.message = commentData.message;
        this.owner = commentData.owner;
		this.editable = clientId === commentData.owner && util.deltatime(commentData.created_at) <= constants.TIME_FOR_EDITING;
        this.childes = [];
		
        const entry = `
            <div class="comment-content">
                <div class="comment-header">
                    <p class="author">${this.author}</p>
                    <span class="created-at">${util.getTimeDifference(this.createdAt)}</span>
					<div class="link-set">
						${
							this.editable && !singleComment ? 
								'<a href="/comment?id=' + this.commentId + '" class="edit">edit</a>' +
								'<a href="#" class="delete">delete</a>' 
							: ''
						}
						<a href="#${this.commentId}" class="comment-anchor">#${this.commentId}</a>
					</div>
                </div>
                <p class="message">${this.message}</p>
                <div class="comment-footer">
                    ${
                        !singleComment ?
                            '<a href="#' + this.commentId + '" class="reply">reply</a>'
                        : ''
                    }
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
    constructor(mode, socket, comment={}) {
        this.mode = mode;
        this.socket = socket;
        this.comment = comment;
        this.parentId = comment.commentId;

        this.form = document.createElement('form');
        this.form.className = 'comment-form';
        this.form.innerHTML = `
            ${
                mode !== 'editing' ? 
                    '<div contenteditable="true" class="form-author"></div>' 
                : '<div contenteditable="false" class="form-author">' + comment.author + '</div>'
            }
            <div contenteditable="true" class="form-message">${ this.mode === 'editing' ? comment.message : ''}</div>
            <button class="form-submit">Send</button> 
            ${mode !== 'creating' ? '<button class="form-reset">Cancel</button>' : ''}
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
                    history.back();
                    break;
            }
        });

        const resetButton = this.form.querySelector('.form-reset');
        resetButton && resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            switch (this.mode) {
                case 'replying':
                    this.remove();
                    break;

                case 'editing':
                    history.back();
                    break;
            }
        });

        wrapper.insertBefore(this.form, wrapper.children[1]);
        this.form.querySelector('.form-message').focus();

        return this;
    }
}

class CommentPage {
    constructor(element, socket, data) {
        this.wrapper = element;
        this.socket = socket;
        this.data = data;

        this.comment = null;
        this.form = null;
    }

    initComment(commentData) {
        this.comment = new Comment(commentData, this.data.clientId, true);
        this.wrapper.appendChild(this.comment.entity);
		if (this.comment.editable)
			this.form = new CommentForm('editing', this.socket, this.comment).init(this.wrapper);
    }
}

class CommentsSystem {
    constructor(element, socket, data) {
        this.wrapper = element;
        this.socket = socket;
        this.data = data;

        this.comments = new Map();
        this.commentForm = new CommentForm('creating', socket).init(document.querySelector('#commentForm'));
        this.replyForm = null;
    }

    addComment(comments) {
        console.log(comments);
        comments.forEach(commentData => {
            const comment = new Comment(commentData, this.data.clientId, false);
            const parent = commentData.parent_id ? this.comments.get(commentData.parent_id) : false;

            if (parent) {
				parent.entity.insertBefore(comment.entity, parent.entity.children[1]);
                parent.childes.push(commentData.comment_id);

            } else {
                this.wrapper.insertBefore(comment.entity, this.wrapper.children[0]);
            }

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
        comments.forEach(({comment_id}) => {
            this.comments.get(comment_id).remove();
            this.comments.delete(comment_id);
        })
    }

    replyClickHandler(commentId) {
        const comment = this.comments.get(commentId);
        if (this.replyForm) {
            this.replyForm.remove();
        }
        this.replyForm = new CommentForm('replying', this.socket, comment).init(comment.entity);
    }

    editClickHandler(commentId) {

    }

    deleteClickHandler(commentId) {
        this.socket.emit('deleteRecord', commentId);
    }
}

module.exports = {
    CommentsSystem,
    CommentPage
};