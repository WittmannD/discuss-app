class UserError {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.timer = null;
        
        this.entity = document.createElement('div');
        this.message = document.createElement('p');
        this.closeButton = document.createElement('span');
        
        this.entity.className = 'error-message';
        this.closeButton.className = 'close-button';
        this.closeButton.innerText = 'X';
    }
    
    init() {
        this.closeButton.addEventListener('click', this.close.bind(this));
        return this;
    }
    
    close() {
        this.entity.parentElement.removeChild(this.entity);
        clearTimeout(this.timer);
    }
    
    show(text) {
        this.entity.appendChild(this.message);
        this.entity.appendChild(this.closeButton);
        this.wrapper.appendChild(this.entity);

        this.message.innerText = text;
        clearTimeout(this.timer);
        this.timer = setTimeout(this.close.bind(this), 1000 * 10)
    }
}

module.exports = UserError;