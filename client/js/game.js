//	Socket
var socket = io();

var can, ctx;
var _width, _height;
var playerID = "";
var myState;

var blueFlag = false, redFlag = false;
var teamR = 0, teamB = 0,gameOver = 0, playerDie = 0, counter = 150;

can = document.getElementById('myCanvas');
ctx = can.getContext('2d');

can.width = _width = window.innerWidth;
can.height = _height = window.innerHeight;

if (document.fullscreenEnabled || 
	document.webkitFullscreenEnabled || 
	document.mozFullScreenEnabled ||
	document.msFullscreenEnabled) {
		// go full-screen
	if (can.requestFullscreen) {
		can.requestFullscreen();
	} else if (can.webkitRequestFullscreen) {
		can.webkitRequestFullscreen();
	} else if (can.mozRequestFullScreen) {
		can.mozRequestFullScreen();
	} else if (can.msRequestFullscreen) {
		can.msRequestFullscreen();
	}
}
var addUser = function () {
	var _name = document.getElementById('username').value;
	
	document.getElementById('addUser').style.display = "none";
	document.getElementById('myCanvas').style.display = "block";
	
	socket.emit('addUser', {
		uName: _name,
		x: _width / 2,
		y: _height / 2,
	});

}

socket.on ('addUser', function (data) {
	playerID = data.id;
	console.log("Player added.");
});

socket.on ('updatePos', function (data) {
	
	if (!gameOver && !playerDie) {
		ctx.setTransform( 1, 0, 0, 1, 0, 0);
		ctx.clearRect( 0, 0, _width, _height);	

	// Draw Bullet
	
	ctx.fillStyle = 'rgba( 255, 255, 255, 255)';
	for (var i = 0; i < data.bullet.length; i++) {
		ctx.fillRect( data.bullet[i].x - 2, data.bullet[i].y - 2, 4, 4);

		for (var j = 0; j < data.player.length; j++) {
			
			if (data.player[j].team !== data.bullet[i].team) {
				var d = getDistance( { x: data.player[j].x, y: data.player[j].y}, { x: data.bullet[i].x, y: data.bullet[i].y});
				if (d < 30) {
					console.log("Player " + data.player[j].player + " get hit. the id is " + data.player[j].id);
					socket.emit ('playerHit', {
						pid: data.player[j].id,
						damage: Math.round (Math.random() * 5) + 5,
						bid: data.bullet[i].id
					});
				}
			}		
		}
	}

	for (var i = 0; i < data.player.length; i++) {
		if (data.player[i].id === playerID) {
			myState = data.player[i];
			ctx.translate( _width / 2 - data.player[i].x, _height / 2 - data.player[i].y);
			if (myState.health <= 0)
				playerDie = 1;
		}
	}

	for (var i = 0; i < data.player.length; i++) {
		if (data.player[i].hasFlag) {
			if (data.player[i].team === 'blue')
				blueFlag = true;
			else if (data.player[i].team === 'red')
				redFlag = true;
		}
	}

	// Draw Flags

	// Team red
	ctx.fillStyle = 'rgba( 208, 2, 27, 255)';
	ctx.globalAlpha = 0.5;
	ctx.fillRect ( 60, _height - 100, 100, 60);
	
	ctx.globalAlpha = 1;
	if (!blueFlag)
		ctx.fillRect ( 60 + 25, _height - 85, 50, 30);

	//	Team Blue
	ctx.fillStyle = 'rgba( 74, 144, 226, 255)';
	ctx.globalAlpha = 0.5;
	ctx.fillRect ( _width - 160, 60, 100, 60);
	
	ctx.globalAlpha = 1;
	
	if (!redFlag)
		ctx.fillRect ( _width - (160 - 25), 75, 50, 30);

	for (var i = 0; i < data.player.length; i++) {

		// Draw Player
		if (data.player[i].health > 0) {
			ctx.save();
		
		if (data.player[i].team === 'red')
			ctx.fillStyle = 'rgba( 208, 2, 27, 255)';
		else
			ctx.fillStyle = 'rgba( 74, 144, 226, 255)';

		ctx.beginPath();
		ctx.arc( data.player[i].x, data.player[i].y, 12, 0, Math.PI * 2, false);
		ctx.fill();
	
		ctx.font = "14px arial";
		ctx.textAlign = "center";
		ctx.fillStyle = 'rgba( 255, 255, 255, 255)';
		
		ctx.fillText(data.player[i].player, data.player[i].x, data.player[i].y - 28);

		for (var j = 0; j < 100; j++ ) {
			ctx.beginPath();
			ctx.arc( (data.player[i].x - 50) + j, data.player[i].y - 20, 3, 0, Math.PI * 2, false);
			ctx.fill();
		}
		
		ctx.fillStyle = 'rgba( 65, 117, 5, 255)';
		for (var j = 0; j < data.player[i].health; j++ ) {
			ctx.beginPath();
			ctx.arc( (data.player[i].x - 50) + j, data.player[i].y - 20, 2, 0, Math.PI * 2, false);
			ctx.fill();
		}
		
		// If Player has flag with it
		if (data.player[i].team === 'blue')
			ctx.fillStyle = 'rgba( 208, 2, 27, 255)';
		else
			ctx.fillStyle = 'rgba( 74, 144, 226, 255)';

		if (data.player[i].hasFlag)
			ctx.fillRect ( data.player[i].x + 18, data.player[i].y - 10, 20, 12);

		ctx.restore();
		} else  {
			if (data.player[i].team === "blue" && data.player[i].hasFlag)
				blueFlag = false;
			if (data.player[i].team === "red" && data.player[i].hasFlag)
				blueFlag = false;
		}
	}
	
	// For team Blue
	for (var i = 0; i < data.player.length; i++) {
		if (data.player[i].id === playerID && data.player[i].team === "blue" && !data.player[i].hasFlag) {
			var dist = getDistance( { x: 110, y: _height - 100}, { x: data.player[i].x, y: data.player[i].y});
			if (dist < 20) {
				socket.emit('updateFlag', {
					hasFlag: true
				});
			}
		} else if (data.player[i].id === playerID && data.player[i].team === "blue" && data.player[i].hasFlag) {
			var dist = getDistance( { x: _width - 135, y: 75}, { x: data.player[i].x, y: data.player[i].y});
			if (dist < 20 && blueFlag) {
				blueFlag = false;
				socket.emit('updateScore', {
					team: 'blue',
					score: 1,
					x: _width / 2,
					y: _height / 2,
				});
			}
		}
	}

	// For team Red

	for (var i = 0; i < data.player.length; i++) {
		if (data.player[i].id === playerID && data.player[i].team === "red" && !data.player[i].hasFlag) {
			var dist = getDistance( { x: _width - 135, y: 75}, { x: data.player[i].x, y: data.player[i].y});
			if (dist < 20) {
				socket.emit('updateFlag', {
					hasFlag: true
				});
			}
		} else if (data.player[i].id === playerID && data.player[i].team === "red" && data.player[i].hasFlag) {
			var dist = getDistance( { x: 110, y: _height - 100}, { x: data.player[i].x, y: data.player[i].y});
			if (dist < 20 && redFlag) {
				redFlag = false;
				socket.emit('updateScore', {
					team: 'red',
					score: 1,
					x: _width / 2,
					y: _height / 2,
				});
			}
		}
	}
	
	// Draw Score
	
	ctx.setTransform( 1, 0, 0, 1, 0, 0);
	
	ctx.save();

	ctx.fillStyle = 'rgba( 15, 102, 54, 255)';
	ctx.beginPath();
	ctx.moveTo( _width / 2 - 80, _height * 0.075);
	ctx.arc( _width / 2 - 80, _height * 0.075, 24, 90 * (Math.PI / 180), 270 * (Math.PI / 180));
	ctx.lineTo( _width / 2 + 80, _height * 0.075 - 24);
	ctx.arc( _width / 2 + 80, _height * 0.075, 24, 270 * (Math.PI / 180), 90 * (Math.PI / 180));
	ctx.lineTo( _width / 2 - 80, _height * 0.075 + 24);
	ctx.closePath();
	ctx.fill();
	
	ctx.fillStyle = 'rgba( 208, 2, 27, 255)';
	ctx.fillRect(_width / 2 - 50, _height * 0.05, 40, 30);
	
	ctx.fillStyle = 'rgba( 74, 144, 226, 255)';
	ctx.fillRect(_width / 2 + 10, _height * 0.05, 40, 30);
	
	ctx.font = 'bold 24px arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	
	ctx.fillStyle = 'rgba( 255, 255, 255, 255)';
	
	ctx.fillText("" + teamR, _width / 2 - 75, _height * 0.075);
	ctx.fillText("" + teamB, _width / 2 + 75, _height * 0.075);
	
	ctx.restore();

	} else if (playerDie && !gameOver) {

		ctx.setTransform( 1, 0, 0, 1, 0, 0);
	
		ctx.save();

		ctx.fillStyle = 'rgba( 15, 102, 54, 255)';
		ctx.strokeStyle = 'rgba( 255, 255, 255, 255)';
		ctx.lineWidth = 3;

		ctx.fillRect( _width * 0.3, _height * 0.3, _width * 0.4, _height * 0.35);
		ctx.strokeRect( _width * 0.3, _height * 0.3, _width * 0.4, _height * 0.35);
	
		ctx.font = 'bold 24px arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	
		ctx.fillStyle = 'rgba( 255, 255, 255, 255)';
		if (myState.player !== undefined)
			ctx.fillText( "" + myState.player + " was killed.", _width * 0.5, _height * 0.4);

		ctx.font = '18px arial';
		ctx.fillText("You will resume in " + Math.round(counter -- / 30) + " Sec.", _width * 0.5, _height * 0.5);
		
		ctx.restore();
		
		if (counter === 0) {
			counter = 150;
			playerDie = 0;
			
			socket.emit('resetPlayer', {
				id: myState.id,
				team:  myState.team,
				x: _width / 2,
				y: _height / 2,
				dx: 0,
				dy: 0,
				health: 100,
				hasFlag: false,
			});
		}
		
	} else if (gameOver) {
		ctx.setTransform( 1, 0, 0, 1, 0, 0);
	
		ctx.save();

		ctx.fillStyle = 'rgba( 15, 102, 54, 255)';
		ctx.strokeStyle = 'rgba( 255, 255, 255, 255)';
		ctx.lineWidth = 3;

		ctx.fillRect( _width * 0.3, _height * 0.3, _width * 0.4, _height * 0.35);
		ctx.strokeRect( _width * 0.3, _height * 0.3, _width * 0.4, _height * 0.35);
	
		ctx.font = 'bold 28px arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
	
		ctx.fillStyle = 'rgba( 255, 255, 255, 255)';
		if (teamB === 3)
			ctx.fillText("TEAM BLUE WINS", _width * 0.5, _height * 0.375);
		else if (teamR === 3)
			ctx.fillText("TEAM RED WINS", _width * 0.5, _height * 0.375);

		ctx.font = 'bold 24px arial';
		ctx.fillText("" + teamB + " - " + teamR + "", _width * 0.5, _height * 0.45);
		
		ctx.font = '22px arial';
		ctx.fillText("CLICK TO REPLAY", _width * 0.5, _height * 0.55);
		
		ctx.restore();
	}

});

socket.on('updateScore', function (data) {
	teamR = data.teamRed;
	teamB = data.teamBlue;
	
	if (teamB === 3 || teamR === 3 ) {
		gameOver = 1;
	}
});

getDistance = function ( p1, p2) {
	return Math.sqrt(Math.pow( p2.x - p1.x, 2) + Math.pow( p2.y - p1.y, 2));
}

can.onmousemove = function (event) {
	
	var bb = can.getBoundingClientRect();
	mx = (event.clientX - bb.left);
	my = (event.clientY - bb.top);
	
	if (!gameOver) {	
	if ( mx < _width / 2 && my < _height / 2) {
		socket.emit ('mouseMove', {
			dx: -2,
			dy: -2,
		});
	} else if ( mx < _width / 2 && my > _height / 2) {
		socket.emit ('mouseMove', {
			dx: -2,
			dy: 2,
		});
	} else if ( mx > _width / 2 && my < _height / 2) {
		socket.emit ('mouseMove', {
			dx: 2,
			dy: -2,
		});
	} else if ( mx > _width / 2 && my > _height / 2) {
		socket.emit ('mouseMove', {
			dx: 2,
			dy: 2,
		});
	}
	}
};

can.onmousedown = function (event) {

	var bb = can.getBoundingClientRect();
	mx = (event.clientX - bb.left);
	my = (event.clientY - bb.top);
	
	var x = -(_width / 2) + mx - 8;
	var y = -(_height / 2) + my - 8;
	
	var angle = Math.atan2(y,x) / Math.PI * 180;

	if (!gameOver) {
		socket.emit ('shootBullet', {
			team: myState.team,
			x: _width / 2,
			y: _height / 2,
			angle: angle,
		});
	} else {
		location.reload(true);
	}

};
