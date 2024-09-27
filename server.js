// Importing required modules
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

// Initializing Express app
const app = express();

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'urban_wheels'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session management
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Setting up static files (HTML, CSS)
app.use(express.static('public'));

// Route for Home Page (before login)
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'public', 'uw_home.html'));  //home_logged_in.html
    } else {
        res.sendFile(path.join(__dirname, 'public', 'uw_home.html'));
    }
});

// Route for Signup Page
app.get('/uw_signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'uw_signup.html'));
});

// Route for Login Page
app.get('/uw_login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'uw_login.html'));
});

// Signup POST route
app.post('/uw_signup', async (req, res) => {
    const { name, email, mobile, password, confirmPassword } = req.body;

    // Password validation
    if (password !== confirmPassword) {
        return res.json({ success: false, message: 'Passwords do not match' });
        //return res.send(`<script>alert('Passwords do not match'); window.location.href = '/signup';</script>`);
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const query = 'INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, mobile, hashedPassword], (err, result) => {
        if (err) throw err;
        res.json({ success: true, message: 'Signup successful! Please login.' });
        //return res.send(`<script>alert('Account created successfully!'); window.location.href = '/login';</script>`);
        //res.redirect('/login');
    });
});

// Login POST route
app.post('/uw_login', (req, res) => {
    const { name, password } = req.body;

    const query = 'SELECT * FROM users WHERE name = ?';
    db.query(query, [name], async (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            // Comparing the password with the hashed password in DB
            const validPass = await bcrypt.compare(password, results[0].password);
            if (validPass) {
                req.session.loggedin = true;
                req.session.name = name;
                return res.json({ success: true, message: 'Login Successful!' });
                //return res.redirect('/');
            }
            else {
                return res.json({ success: false, message: 'Entered Incorrect Password' });
            }
        }
        else {
            return res.json({ success: false, message: 'User not found' });
        }
        //res.send(`<script>alert('Incorrect Username or Password'); window.location.href = '/login';</script>`);
    });
});

//Route for booking info
app.post('/uw_book', (req, res) => {
    const { pickupDate, pickupTime, dropDate, dropTime, name, email, phone } = req.body;

    const query = `INSERT INTO bookings (pickup_date, pickup_time, drop_date, drop_time, name, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [pickupDate, pickupTime, dropDate, dropTime, name, email, phone], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send({ message: 'Error booking car' });
        } else {
            res.send({ message: 'Car booked successfully' });
        }
    });
});

//Route to session info
app.get('/session-info', (req, res) => {
    if (req.session.loggedin) {
        res.json({
            loggedin: true,
            name: req.session.name
        });
    } else {
        res.json({ loggedin: false });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Starting the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
