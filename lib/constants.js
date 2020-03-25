const constants = {
    TIME_FOR_EDITING: 1000 * 60 * 30, // ms
    
    CREATING_FORM_MODE: 'creating',
    UPDATING_FORM_MODE: 'editing',
    REPLYING_FORM_MODE: 'replying',
    
    USERNAME_MAX_LENGTH: 14,
    MESSAGE_MAX_LENGTH: 300,
    USERNAME_PATTERN: /^[A-ZА-Я0-9]([A-ZА-Я0-9]|[-_](?![-_])){2,13}[A-ZА-Я0-9]$/i,
    MESSAGE_PATTERN: /^[\s\S]{1,300}$/i,

    SPECIAL_KEYS: {
      'backspace': 8,
      'shift': 16,
      'ctrl': 17,
      'alt': 18,
      'delete': 46,
      'enter': 13,
      // 'cmd':
      'leftArrow': 37,
      'upArrow': 38,
      'rightArrow': 39,
      'downArrow': 40,
    },
    
    COMMENTS_UPLOADING_SIZE: 10
};

module.exports = constants; 