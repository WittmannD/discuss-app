function getTimeDifference(datetime) {
    const diff = Date.now() - new Date(datetime);
    const minutes = Math.floor(diff / 60000);
    if (minutes <= 5) {
        return 'just now';
    }

    const hours = Math.floor(minutes / 60);
    if (hours <= 0) {
        return `${Math.ceil(minutes / 5) * 5} minutes ago`;
    }
    if (hours < 24) {
        return `${hours} hours ago`;
    }

    return `${Math.floor(hours / 24)} days ago`;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getUniqueId(length) {
    return new Array(length).fill(0).map(t => { return getRandomInt(255).toString(16) }).join('');
}

module.exports = {
    getTimeDifference,
    getRandomInt,
    getUniqueId
};