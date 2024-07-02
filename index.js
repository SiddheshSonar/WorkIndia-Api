import mysql from 'mysql2';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken'

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DB
});

const connectDB = () => {
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

}

const app = express();

app.use(cors());
app.use(express.json());

const router = express.Router();
app.use('/api', router);

router.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    const userId = crypto.randomInt(1000, 9999);
    const pass = bcrypt.hashSync(password, 10);
    connection.query(`INSERT INTO Users (user_id, username, password, email, type) VALUES ('${userId}', '${username}', '${pass}', '${email}', 'user');`,
        function (err, result) {
            if (err)
                console.log(`Error Occured - `, err)
            else
                console.log("Result: ", result)
        })
    res.status(200).json({ status: 'Account successfully created', status_code: 200, user_id: userId });
});

const loginQuery = (username) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM Users WHERE username = '${username}';`,
            function (err, result) {
                if (err)
                    reject(err)
                else
                    resolve(result)
            })
    })
}

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await loginQuery(username);
    let pass;
    if (user.length > 0) {
        pass = bcrypt.compareSync(password, user[0].password); 
    }
    else {
        pass = null
    }
    if (user && pass) {
        const token = jwt.sign({ id: user[0].user_id }, 'SECRET', { expiresIn: '24h'} )
        res.status(200).json({ status: 'Login successful', status_code: 200, user_id: user[0].user_id, access_token: token });
    } else {
        res.status(401).json({ status: 'Incorrect username/password', status_code: 401 });
    }
});

const addCar = (data) => {
    return new Promise((resolve, reject) => {
        const id = crypto.randomInt(1000, 9999);
        connection.query(`INSERT INTO Cars (category, model, number_plate, current_city, rent_per_hr, rent_history, car_id) VALUES ('${data.category}', '${data.model}', '${data.number_plate}', '${data.current_city}', '${data.rent_per_hr}', '${data.rent_history}, '${id}');`,
            function (err, result) {
                if (err)
                    reject(err)
                else
                resolve(result)
        })
    })
}

router.post('/car/create', async (req, res) => {
    const data = req.body;
    const result = await addCar(data);
    console.log("Result: ", result)
    res.status(200).json({ status: 'Car added successfully', status_code: 200 });
});

const getCar = (origin) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM Cars WHERE current_city = ${origin};`,
            function (err, result) {
                if (err)
                    reject(err)
                else
                    resolve(result)
            })
    })
}

router.get('/car/get-rides?', async (req, res) => {
    const origin = req.query.origin;
    const destination = req.query.destination;
    const category = req.query.category;
    const required_hours = req.query.required_hours;
    // console.log(origin, destination, category, required_hours)
    const cars = await getCar(origin);
    const filteredCars = cars.filter(car => car.category === category);
    const withRent = filteredCars.map(car => {
        const rent = car.rent_per_hr * required_hours;
        return { ...car, total_payable_amt: rent }
    })
    res.status(200).json({ status: 'Cars fetched successfully', status_code: 200, cars: withRent });

});

app.listen(5000, () => {
    console.log('Server started');
    connectDB();
});



