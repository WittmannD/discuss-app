const constants = {
	TIME_FOR_EDITING: 1000 * 60 * 5, // ms
    
    USERNAME_PATTERN: /^[A-ZА-Я0-9]([A-ZА-Я0-9]|[-_](?![-_])){2,13}[A-ZА-Я0-9]$/i,
    MESSAGE_PATTERN: /^[\s\S]{1,200}$/i,

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
    }
};

module.exports = constants; 