const express = require('express');
const app = express();
const mysql = require('mysql2');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('config/db.properties');
app.use(express.json());
//connection query
const db = mysql.createConnection({
    host: properties.get("hostname"),
    port:properties.get("port"),
    user: properties.get("username"),
    password: properties.get("password"),
    database: properties.get("database"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
db.connect();