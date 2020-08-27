const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const apiRoutes = require('./routes/index');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/api', apiRoutes);

app.get('/', function (req, res) {
	res.send('Hellow');
});

app.listen(PORT, function () {
	console.log('Server running on localhost : ' + PORT);
});
