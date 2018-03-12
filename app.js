var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function ( req, res) {
 	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Server started.");

var socketNo = 0;
var teamRed = 0, teamBlue = 0;
var teamBlueScore = 0, teamRedScore = 0;

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BULLET_LIST = {};

var io = require('socket.io')( serv, {});

var Player = function ( id, data) {
	
	var self = {
		id: id,
		player: data.uName,
		team: data.team,
		x: data.x,
		y: data.y,
		dx: data.dx,
		dy: data.dy,
		health: data.health,
		hasFlag: data.hasFlag,
	};

	self.updatePosition = function () {
		self.x += self.dx;
		self.y += self.dy;
	}

	return self;
}

var Bullet = function ( data) {
	
	var self = {
		id: Math.random(),
		team: data.team,
		x: data.x,
		y: data.y,
		dx: Math.cos(data.angle / 180 * Math.PI) * 10,
		dy: Math.sin(data.angle / 180 * Math.PI) * 10,
	};

	self.updatePosition = function () {
		self.x += self.dx;
		self.y += self.dy;
	}
	
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {};

io.sockets.on('connection', function(socket) {
	console.log('Socket Connection.');

	socket.on('addUser', function (data) {
		
		if (teamBlue == 0 && teamRed == 0) {
			data.team = 'blue';
			teamBlue ++;
		} else if (teamBlue > teamRed) {
			data.team = 'red';
			teamRed ++;
		} else if (teamBlue === teamRed) {
			data.team = 'blue';
			teamBlue ++;
		}
		
		data.dx = 0;
		data.dy = 0;
		data.health = 100;
		data.hasFlag = false;

		socket.id = ++ socketNo;
		SOCKET_LIST[socket.id] = socket;
		
		var player = Player(socket.id, data);
		PLAYER_LIST[socket.id] = player;
		
		socket.emit('addUser', {
			id: socket.id
		});

		socket.on('updateScore', function (data) {
			if (data.team === "blue")
				teamBlueScore += data.score;
			else if (data.team === "red")
				teamRedScore += data.score;
			
			player.x = data.x;
			player.y = data.y;
			player.dx = 0;
			player.dx = 0;
			player.health = 100;
			player.hasFlag = false;

		});

		socket.on('resetPlayer', function (data) {
			player.x = data.x;
			player.y = data.y;
			player.dx = 0;
			player.dx = 0;
			player.health = 100;
			player.hasFlag = false;
		});

		socket.on('updateFlag', function (data) {
			player.hasFlag = data.hasFlag;
		});

		socket.on('playerHit', function (data) {

			for (var i in PLAYER_LIST) {
				var p = PLAYER_LIST[i];
				if (p.id === data.pid)
					p.health -= data.damage;
			}

			for (var i in Bullet.list) {
				var b = Bullet.list[i];
				if (b.id === data.bid) {
					delete Bullet.list[i];
				}
			}
		});

		socket.on('mouseMove', function (data) {
			player.dx = data.dx;
			player.dy = data.dy;
		});
		
		socket.on('shootBullet', function (data) {
			var bullet = Bullet(data);
		});
		
		socket.on('disconnect', function () {
			if (player.team === "blue")
				teamBlue --;
			else if (player.team === "red")
				teamRed --;
			delete SOCKET_LIST[socket.id];
			delete PLAYER_LIST[socket.id];
		});
	});
});


setInterval ( function () {
	var plyr = [], bull = [];
	for (var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i];
		player.updatePosition();
		plyr.push ({
			id: player.id,
			player: player.player,
			team: player.team,
			x: player.x,
			y: player.y,
			dx: player.dx,
			dy: player.dy,
			health: player.health,
			hasFlag: player.hasFlag,
		});
	}
	
	for (var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.updatePosition();
		bull.push ({
			id: bullet.id,
			team: bullet.team,
			x: bullet.x,
			y: bullet.y,
			dx: bullet.dx,
			dy: bullet.dy,
		});
	}

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit ('updatePos', {
			player: plyr,
			bullet: bull,
		});
		socket.emit ('updateScore', {
			teamBlue: teamBlueScore,
			teamRed: teamRedScore
		});
	}

}, 1000 / 30);