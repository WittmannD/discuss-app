const Pool = require('pg').Pool;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const getRecords = function (start, count, callback) {
    // const queryString = `
    //     SELECT * FROM comment_records
    //     ORDER BY created_at ASC
    //     LIMIT $1::integer OFFSET $2::integer;
    // `;
    const queryString = `
        WITH RECURSIVE included_childs(comment_id, author, message, owner, parent_id, created_at) AS (
            (SELECT comment_id, author, message, owner, parent_id, created_at 
            FROM comment_records WHERE parent_id = 0
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2)
        UNION ALL 
            SELECT c.comment_id, c.author, c.message, c.owner, c.parent_id, c.created_at
            FROM included_childs ch, comment_records c
            WHERE ch.comment_id = c.parent_id
        )
        SELECT *
        FROM included_childs;
    `;
    const values = [
        parseInt(count),
        parseInt(start)
    ]
    pool.query(queryString, values, (err, res) => {
        if (err) {
            console.log(err);
            callback(false);
            return;
        }

        callback(res.rows);
    });
};

const getById = function (commentId, clientId, callback) {
    const queryString = `
        SELECT * FROM comment_records
        WHERE comment_id = $1::integer;
    `;
    const values = [
        commentId
    ]
    pool.query(queryString, values, (err, res) => {       
        if (err) {
            console.log(err);
            callback(false, err);
            return;
        }
        
        if (res.rows.length === 0) {
            callback(false, 'ERROR 404: Page not found');
        }

        callback(res.rows);
    });
};

const getCount = function(callback) {
    const queryString = `
        SELECT COUNT(*) 
        FROM comment_records;
    `;
    pool.query(queryString, (err, res) => {       
        if (err) {
            console.log(err);
            callback(false, err);
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
        ($1::integer, $2::text, $3::text, $4::text) 
        RETURNING *;
    `;
    const values = [
        data.parent_id,
        data.author,
        data.message,
        clientId
    ]
    pool.query(queryString, values, (err, res) => {
        if (err) {
            console.log(err);
            callback(false, err);
            return;
        }

        callback(res.rows);
    })
};

const updateRecord = function (data, commentId, clientId, callback) {
    const queryString = `
        UPDATE comment_records
        SET message = $1::text
        WHERE comment_id = $2::integer
        AND created_at <= now()
        AND owner = $3::text
        RETURNING *;
    `;
    const values = [
        data.message,
        commentId,
        clientId
    ]
    pool.query(queryString, values, (err, res) => {
        if (err) {
            console.log(err);
            callback(false, err);
            return;
        }

        callback(res.rows);
    })
};

const deleteRecord = function (commentId, clientId, callback) {
    const queryString = `
        WITH RECURSIVE tree AS (
            SELECT comment_id, parent_id
            FROM comment_records
            WHERE comment_id = $1::integer
            AND created_at <= now()
            AND owner = $2::text
            UNION ALL
            SELECT c.comment_id, c.parent_id
            FROM comment_records c
                JOIN tree p ON p.comment_id = c.parent_id
        )
        DELETE FROM comment_records
        WHERE comment_id IN (SELECT comment_id FROM tree)
        RETURNING *;
    `;
    const values = [
        commentId,
        clientId
    ]
    pool.query(queryString, values, (err, res) => {
        if (err) {
            console.log(err);
            callback(false, err);
            return;
        }

        callback(res.rows);
    })
};

module.exports = {
    getRecords,
    getById,
    getCount,
    addRecord,
    updateRecord,
    deleteRecord
};