const express = require('express')
const { exec } = require('child_process')
const bodyParser = require('body-parser')
const port = 3000
var app = express();
const http = require('http').Server(app)
// var server = http.createServer(app);
var io = require('socket.io')(http);


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set('io', io)

const router = express.Router();

app.get('/execute/:s?/:h?/:p?', (req, res, next) =>{
	res.header('Access-Control-Allow-Origin', '*')
	res.sendFile(__dirname + '/index.html')

	if (req.params.s) {
		console.log(req.params.s)
		if (req.params.p) {
			console.log(req.params.p)
			var sparams = req.params.p.split(',')
		}
		else {
			var sparams = [req.params.h].concat([req.params.p])
		}
		var child = require('child_process').execFile(__dirname + '/' + req.params.s, 
		sparams, { 
				// detachment and ignored stdin are the key here: 
				detached: true, 
				stdio: [ 'ignore', 1, 2 ]
		}); 
		// and unref() somehow disentangles the child's event loop from the parent's: 
		child.unref();
		io.on('connection', function (socket) {
			child.stdout.on('data', function(data) {
				console.log(data.toString())
				socket.emit('toClient', data.toString());
			});
			socket.on('toServer', function (data) {
				var text = data.text;
				if (text) {
					var child = require('child_process').exec(text, {
						detached: true, 
						stdio: [ 'ignore', 1, 2 ]
					})
					// child.unref();
					child.stdout.on('data', function(data) {
						console.log(data.toString())
						socket.emit('toClient', data.toString());
					});
					console.log(text)
				}
			});
			child.on('close', function(code) {
				socket.emit('toClient', 'Encerrando...');
				res.end()
				next()
			});
		});
	}
})

app.get('/', (req, res) => res.json({
  userferias: '/install'
}))

app.use('/', router)

http.listen(port)
