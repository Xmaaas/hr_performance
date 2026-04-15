require("dotenv").config();
const db = require('./db');
const cors = require('cors');
const express = require('express');
const app = express();
const employeeRoutes = require('./employeeRoutes');
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const goalsRoutes = require("./routes/goals");


app.use(cors());
app.use(express.json());
app.use("/api/employees", employeeRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", goalsRoutes);

app.get('/', (req, res) => {
  res.send('Backend működik');
});

app.listen(3001, () => {
  console.log('Szerver fut a 3001-es porton');
});