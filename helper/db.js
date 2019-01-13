const mysql2 = require("mysql2/promise")
const account = require("../config/account")

function createPool() {
    try {
        const mysql = require('mysql2');

        // Initialize MySQL DB
        const pool = mysql2.createPool({
            host: account.MYSQL_HOST,
            user: account.MYSQL_USERID,
            password: account.MYSQL_PASSWORD,
            database: account.MYSQL_DATABASE,
            port: account.MYSQL_PORT,
            connectionLimit: account.MYSQL_CONNECTION_LIMIT,
            dateStrings: ['DATE', 'DATETIMES'],
            waitForConnections: true,
            queueLimit: 0
        })

        return pool;
    } catch (error) {
        return console.log(`Could not connect - ${error}`);
    }
}

const pool = createPool()

module.exports = {
    connection: async() => pool.getConnection()
}