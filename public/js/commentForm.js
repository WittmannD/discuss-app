const constants = require('../../lib/constants.js');

class CommentForm {
    constructor(mode, socket, comment={}, placeholder={}) {
        this.mode = mode;
        this.socket = socket;
        this.comment = comment;
        this.parentId = comment.commentId;
        
        this.authorForm = ContentEditable.create(
            constants.USERNAME_MAX_LENGTH, 
            constants.USERNAME_PATTERN, 
            {
                'class': 'form-author',
                'title': 'username'
            }, 
            true, 
            placeholder.author
        );
        this.messageForm = ContentEditable.create(
            constants.MESSAGE_MAX_LENGTH, 
            constants.MESSAGE_PATTERN, 
            {
                'class': 'form-message',
                'title': 'message'
            }, 
            false, 
            placeholder.message
        );
        
        this.submitButton = document.createElement('button');
        this.submitButton.classList.add('form-submit');
        this.submitButton.innerText = 'Send';
        if (mode !== constants.CREATING_FORM_MODE) {
            this.cancelButton = document.createElement('button');
            this.cancelButton.classList.add('form-reset');
            this.cancelButton.innerText = 'Cancel';
        }
        
        if (mode === constants.UPDATING_FORM_MODE) this.authorForm.disable();
        
        this.form = document.createElement('form');
        this.form.appendChild(this.authorForm.entity);
        this.form.appendChild(this.messageForm.entity);
        this.form.appendChild(this.submitButton);
        this.cancelButton && this.form.appendChild(this.cancelButton);
        this.form.classList.add('comment-form');
    }

    getFormData() {
        return ({
            parent_id: this.mode === constants.REPLYING_FORM_MODE ? this.parentId : 0,
            author: this.authorForm.entity.textContent.trim(),
            message: this.messageForm.entity.textContent.trim()
        })
    }

    remove() {
        this.form.parentNode && this.form.parentNode.removeChild(this.form);
    }

    clear() {
        this.messageForm.entity.textContent = '';
    }

    init(wrapper) {
        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            switch (this.mode) {
                case constants.CREATING_FORM_MODE:
                    this.socket.emit('record', this.getFormData());
                    this.clear();
                    break;

                case constants.REPLYING_FORM_MODE:
                    this.socket.emit('record', this.getFormData());
                    this.remove();
                    break;

                case constants.UPDATING_FORM_MODE:
                    this.socket.emit('updateRecord', this.getFormData());
                    history.back();
                    break;
            }
        });

        this.cancelButton && this.cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            switch (this.mode) {
                case constants.REPLYING_FORM_MODE:
                    this.remove();
                    break;

                case constants.UPDATING_FORM_MODE:
                    window.location.href = `${window.location.origin}/#${this.comment.commentId}`
                    break;
            }
        });

        wrapper.insertBefore(this.form, wrapper.children[1]);
        this.messageForm.entity.focus();

        return this;
    }
}

class ContentEditable {
    constructor(maxLength, pattern, attributes={}, inline=false, placeholder='') {
        this.maxLength = maxLength;
        this.pattern = pattern;
        this.attributes = attributes;
        this.inline = inline;

        this.entity = document.createElement('div');
        this.entity.contentEditable = true;
        this.entity.textContent = typeof placeholder !== 'undefined' ? placeholder : '';
        
        this.valid = false;
    }
  
    static create(maxLength, pattern, attributes={}, inline=false, placeholder) {
        const instance = new ContentEditable(maxLength, pattern, attributes, inline, placeholder);
        instance.init();

        return instance;
    }

    keyDownHandler(e) {
        const len = e.target.textContent.trim().length;
        let hasSelection = false;
        let selection = window.getSelection();

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (e.keyCode === 13) {
            e.preventDefault();
            !this.inline && document.execCommand('insertText', false, '\r\n');
            return false;
        }

        if (Object.values(constants.SPECIAL_KEYS).includes(e.keyCode)) {
            return true;
        }

        if (len >= this.maxLength && !hasSelection) {
            e.preventDefault();
            return false;
        }
    }
  
    keyUpHandler(e) {
        if (e.target.textContent.match(this.pattern)) {
            this.entity.classList.remove('invalid');
            this.valid = true;
        } else {
            this.entity.classList.add('invalid');
            this.valid = false;
        }
    }

    init() {
        Object.keys(this.attributes).forEach((attr) => {
            this.entity.setAttribute(attr, this.attributes[attr]);
        });
        this.entity.addEventListener('keydown', this.keyDownHandler.bind(this));
        this.entity.addEventListener('keyup', this.keyUpHandler.bind(this));
    }

    disable() {
        this.entity.contentEditable = false;
    }
  
}

module.exports = CommentForm;