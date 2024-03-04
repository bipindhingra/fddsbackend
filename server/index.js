const express = require('express');
const mysql = require('mysql');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const fs = require('fs');
const path = require('path');
const cors = require('cors');
app.use(cors())
// Create MySQL connection
const connection = mysql.createConnection({
  host: process.env.HOST_NAME,
  user: process.env.HOST_USER,
  password: process.env.HOST_PASSWORD,
  database: process.env.DATABASE
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ', err);
    return;
  }
  console.log('Connected to MySQL database...');
});

// WebSocket server
wss.on('connection', (ws) => {
   
   console.log('Client connected');
  // Send initial data to client upon connection
  connection.query('SELECT * FROM flight', (error, results) => {
    if (error) {
      console.error('Error fetching initial data: ', error);
      return;
    }
    ws.send(JSON.stringify(results));
  });

  // Listen for close event
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});


app.get('/api/admin', (req, res) => {

  // Read the content of admin.json file
  fs.readFile('./admin-data/admin.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading admin.json file:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    try {
      const admins = JSON.parse(data).admins;
      res.json(admins);
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
})

app.get('/api/:id', (req, res) => {
  const id = req.params.id;

  // SQL query with parameter for id
  const sql = `SELECT * FROM flight WHERE id = ?`;

  // Execute the query with a prepared statement (prevents SQL injection)
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error retrieving data:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length === 0) {
      return res.status(404).send('Not Found');
    }

    // Send the retrieved data in JSON format
    res.json(results[0]);
  });
});

app.patch('/api/update/:id/:etd/:gate/:remark/:delay', (req, res) => {
  const ID = req.params.id;
  const ETD = req.params.etd;
  const GATE = req.params.gate;
  const REMARK = req.params.remark;
  const DELAY = req.params.delay;


  console.log(ETD, GATE, REMARK, DELAY, ID);
  // SQL query with parameters for id, time, destination, and delay
  const sql = `UPDATE flight SET ETD = ?, GATE = ?, REMARK = ?, DELAY = ? WHERE ID = ?`;

  // Execute the query with a prepared statement
  connection.query(sql, [ETD, GATE, REMARK, DELAY, ID], (err, results) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).send('Internal Server Error');
    }

    console.log(results.affectedRows + " record(s) updated");

    // Send a success message
    res.json({ message: 'Data updated successfully' });
  });
});



// app.post('/api/addnew/:flightid/:std/:etd/:logo/:destination/:gate', (res, res) => {
 
//   const STD = req.params.std;
//   const ETD = req.params.etd;
//   const LOGO = req.params.logo;
//   const DESTINATION = req.params.destination;
//   const GATE = req.params.gate;
//   const ID = req.params.flightid;

//   const sql = `INSERT INTO flight (STD, ETD, LOGO, ID, DESTINATION, GATE) VALUE (?, ?, ?, ?, ?, ?)`;

//   connection.query(sql, [STD, ETD, LOGO, ID, DESTINATION, GATE], (err, results) =>{
//     if (err) {
//       console.error('Error inserting data:', err);
//       res.status(500).json({ error: 'Error inserting data' });
//       return;
//     }
//     console.log('Data inserted successfully');
//     res.status(200).json({ message: 'Data inserted successfully' });
//   })
// })
// Start server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
