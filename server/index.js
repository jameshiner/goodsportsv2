// const path = require('path');
// const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');

const { mongoURI } = require('./config/keys');

const app = express();

// const publicDirectoryPath = path.join(__dirname, '/public');
// const viewsPath = path.join(__dirname, '/templates/views');

// app.set('view engine', 'ejs');
// app.set('views', viewsPath);

// app.use(express.static(publicDirectoryPath));

// app.use('/js', express.static(path.join(`${__dirname}./../public/js`)));

// connect to mongo server
mongoose.connect(
  `${mongoURI}`,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Connected to Mongo Server.');
    }
  },
);

require('./api')(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT);
