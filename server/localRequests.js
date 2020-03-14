const records = new Map();
let uuid = 233;

function getAll (callback) {
    callback([...records.values()]);
}

function getById (id, clientId, callback) {
    callback([records.get(id)]);
}

function addRecord (data, clientId, callback) {
    records.set(++uuid, {
        'comment_id': uuid,
        'created_at': Date.now(),
        'parent_id': data.parent_id,
        'author': data.author,
        'message': data.message,
        'owner': clientId
    });

    callback([records.get(uuid)]);
}


function updateRecord (data, commentId, clientId, callback) {
    records.get(commentId).message = data.message;

    callback([records.get(commentId)]);
}

function deleteRecord (id, callback) {
    const res = [records.get(id)];
    function del(id) {
        for (let record of records.values()) {
            if (record.parent_id === id) {
                res.push(record);
                del(record.comment_id)
            }
        }
        records.delete(id);
    }
    del(id);
    callback(res);
}

module.exports = {
    getAll,
    getById,
    addRecord,
    updateRecord,
    deleteRecord
};