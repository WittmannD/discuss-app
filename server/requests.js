const Pool = require('pg').Pool;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const getAll = function (callback) {
	const queryString = `
        SELECT * FROM comment_records
        ORDER BY created_at DESC;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    });
};

const getById = function (id, clientId, callback) {
    const queryString = `
        SELECT * FROM comment_records
        WHERE comment_id = ${id};
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    });
};

const addRecord = function (data, clientId, callback) {
    const queryString = `
        INSERT INTO comment_records
        (parent_id, author, message, owner) 
        VALUES
        (${data.parent_id}, '${data.author}', '${data.message}', '${clientId}') 
        RETURNING *;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    })
};

const updateRecord = function (data, commentId, clientId, callback) {
    const queryString = `
        UPDATE comment_records
        SET message = ${data.message}
        WHERE comment_id = ${commentId}
		AND created_at <= ${Date.now()}
        AND owner = ${clientId}
        RETURNING *;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    })
};

const deleteRecord = function (id, callback) {
    const queryString = `
        WITH RECURSIVE tree AS (
            SELECT comment_id, parent_id
            FROM comment_records
            WHERE comment_id = ${id}
            UNION ALL
            SELECT c.comment_id, c.parent_id
            FROM comment_records c
                JOIN tree p ON p.comment_id = c.parent_id
        )
        DELETE FROM comment_records
        WHERE comment_id IN (SELECT comment_id FROM tree)
        RETURNING *;
    `;
    pool.query(queryString, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    })
};

module.exports = {
    getAll,
    getById,
    addRecord,
    updateRecord,
    deleteRecord
};