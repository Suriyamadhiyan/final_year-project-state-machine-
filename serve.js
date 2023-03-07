const express = require('express');
const app = express();
const CircularJSON = require('circular-json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql2');
var PropertiesReader = require('properties-reader');
//getting the db properties
var database = PropertiesReader('config/db.properties');
//getting the roles and permissions
const properties = PropertiesReader('config/authorization.properties')._properties;
app.set('view engine', 'ejs');
app.use(express.json());
var session = require('express-session');
const { json } = require('body-parser');



//create session
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 10 * 60 * 1000 // 10 minutes
  }
}));

//connection query
const db = mysql.createConnection({
    host: database.get("hostname"),
    port:database.get("port"),
    user: database.get("username"),
    password: database.get("password"),
    database: database.get("database"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
db.connect();

//routes
app.get('/routes', (req, res) => {
  db.query('SELECT * FROM route', (err, results) => {
    if(err){
      console.log(err);
    }
    else if(results==0){
      console.log('no results found');
    }
    else{
      console.log(results);
    }
  });
  });

//function rename key is an userdefined to change that tolocation-to
function renameKey(obj, oldKey, newKey) {
  if (obj.hasOwnProperty(oldKey)) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
  return obj;
}
//home page
app.get('/home', (req, res) => {
if (req.session.token){
  app.use(express.static('home/demo'));
  const user = jwt.verify(req.session.token, 'secret');//decrypt the token 
  const userRole= user.role;//getting the role from the token
  //set the user rights 
  const home = properties[`${userRole}.home`];
  const input = properties[`${userRole}.input`];
  const logout = properties[`${userRole}.logout`];
//get the data
let data = null; 
db.query("SELECT t1.x, t1.y, t1.city as id,t1.tolocation,GROUP_CONCAT(t2.distance ORDER BY t2.destination SEPARATOR ' ') AS distance FROM map_main t1 JOIN map_sub t2 ON t1.id = t2.id AND t1.city = t2.from_location GROUP BY t1.id, t1.city", (err, results) => {
  if(err){
    console.log(err);
  }
  else if(results==0){
    console.log('no results found');
  }
  else{
    for (let i = 0; i < results.length; i++) {
      renameKey(results[i], "tolocation", "to");//rename the key name tolocation-to
    }
    data =JSON.stringify(results);
  }

  
  //render the index.html file and also sen the user rights 
  
  res.render(path.join(__dirname, 'home/demo', 'index.ejs'), { home, input, logout,data});
});
}

else{
  res.redirect('/');
}  
  }); 

//login page
app.get('/', (req, res) => {
  if (req.session.token){
    res.redirect('/home');
  }
  else{
    app.use('/template', express.static('template'));
    const filePath = path.join(__dirname, 'template', 'index.html');
    res.sendFile(filePath);
  }
  });  
 
  
//register the data 
app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    
    // hash the password
   bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            else{
              if(db.query('SELECT * FROM users WHERE username = ?', username)){
                // send the status to the client as 300
               res.status(300).json("alredy_exist");
              }
              else{
                // insert the username and has into the database
                db.query('INSERT INTO users (username, password,email,role) VALUES (?, ?, ?,?)', [username, hash,email,'user'], (err, results) => {
                  if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal server error' });
                  }

                  res.status(201).json("OK");
                });
              }
              
            }
        });
    });
  });
  
// login
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Find the user in the database
  db.query('SELECT * FROM users WHERE username = ?', username, (err, results) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
      return;
    }

    // If the user doesn't exist, return a 401 Unauthorized status code
    if (results.length === 0) {
      res.sendStatus(401);
      return;
    }

    // Compare the hashed password with the provided password using bcrypt
    bcrypt.compare(password, results[0].password, (err, match) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }

      // If the passwords don't match, return a 401 Unauthorized status code
      if (!match) {
        res.sendStatus(401);
        return;
      }

     // Generate a JWT token
      const token = jwt.sign({ username: results[0].username,role:results[0].role }, 'secret');
      req.session.token=token;//add token into the session
      res.redirect('/home');//redirct to the home page
    });
  });
});

//logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});
app.get('/input', (req, res) => {
  if (req.session.token){
    const user = jwt.verify(req.session.token, 'secret');//decrypt the token 
    const userRole= user.role;//getting the role from the token
    //set the user rights 
    const input = properties[`${userRole}.input`];
    if(input == true){
      //app.use('/template', express.static('input'));
      //const filePath = path.join(__dirname, 'input', 'index.html');
      //res.sendFile(filePath);
    }
    else{
      res.redirect('/home');
    }
  }
  else{
    res.redirect('/');
  }
  });  


//input page

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
