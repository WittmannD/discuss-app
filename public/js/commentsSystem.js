const util = require('../../lib/util');
const constants = require('../../lib/constants');

const CommentForm = require('./commentForm');

class Comment {
    constructor(commentData, clientId, singleComment=false) {
        this.commentId = commentData.comment_id;
        this.parentId = commentData.parent_id;
        this.createdAt = commentData.created_at;
        this.author = commentData.author;
        this.message = commentData.message;
        this.owner = commentData.owner;
		
		this.isCurrentUserComent = clientId === commentData.owner;
		this.isMutable = this.isCurrentUserComent && util.deltatime(commentData.created_at) <= constants.TIME_FOR_EDITING;
        this.childes = [];
		
        const entry = `
            <div class="comment-content">
                <div class="comment-header">
                    <p class="author">${this.author}</p>
                    <span class="created-at">${util.getTimeDifference(this.createdAt)}</span>
					<div class="link-set">
						${
							this.isMutable && !singleComment ? 
								'<a href="/comment?id=' + this.commentId + '" class="edit">edit</a>' +
								'<a href="#" class="delete">delete</a>' 
							: ''
						}
						<a href="#${this.commentId}" class="comment-anchor">#${this.commentId}</a>
					</div>
                </div>
                <div class="message">${this.message}</div>
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

class CommentPage {
    constructor(element, socket, data) {
        this.wrapper = element;
        this.socket = socket;
        this.data = data;

        this.comment = null;
        this.form = null;
    }

    initComment(commentData) {
        if (typeof commentData === 'undefined' || commentData === null)
            return
        
        this.comment = new Comment(commentData, this.data.clientId, true);
        this.wrapper.appendChild(this.comment.entity);
		if (this.comment.isMutable)
			this.form = new CommentForm(
                'editing',
                this.socket,
                this.comment,
                {
                    author: this.comment.author,
                    message: this.comment.message,
                }
            ).init(this.wrapper);
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
        this.commentsCount = this.comments.size;
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
            this.commentsCount++;

            comment.entity.querySelector('a.reply').addEventListener('click', (e) => {
                e.preventDefault();
                this.replyClickHandler(commentData.comment_id);
            });

            if (comment.isMutable) {

                comment.entity.querySelector('a.delete').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.deleteClickHandler(commentData.comment_id);
                });

            }
        });
    }

    deleteComment(comments) {
        console.log(comments);
        comments.forEach(({comment_id}) => {
            this.comments.get(comment_id).remove();
            this.comments.delete(comment_id);
            this.commentsCount--;
        });
    }

    replyClickHandler(commentId) {
        const comment = this.comments.get(commentId);
        if (this.replyForm) {
            this.replyForm.remove();
        }
        this.replyForm = new CommentForm('replying', this.socket, comment).init(comment.entity);
    }

    deleteClickHandler(commentId) {
        this.socket.emit('deleteRecord', commentId);
    }
}

module.exports = {
    CommentsSystem,
    CommentPage
};