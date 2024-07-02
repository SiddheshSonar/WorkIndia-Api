import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Siddhesh@10',
    database: 'workindia'
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection established');
    connection.query(`SHOW TABLES;`,
        function (err, result) {
            if (err)
                console.log(`Error executing the query - ${err}`)
            else
                console.log("Result: ", result)
        })
});

