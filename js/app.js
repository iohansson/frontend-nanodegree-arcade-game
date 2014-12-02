var allEnemies = [],
    rowHeight = 83,
    colLength = 101,
    rows = 6,
    cols = 5;

// Enemies our player must avoid
var Enemy = function(speed, row, col) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.speed = speed;
    
    this.x = col * colLength;
    this.y = row * rowHeight - 20;

};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;

    if (this.x >= cols * colLength) {
        allEnemies.splice(allEnemies.indexOf(this),1);
        allEnemies.push(new Enemy(this.speed, 0, 1));
    }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(row, col) {
    this.sprite = 'images/char-boy.png';

    this.x = col * colLength;
    this.y = row * rowHeight - 10;
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(key) {
    switch (key) {
        case 'up':
            this.move(0, -rowHeight);
            break;
        case 'down':
            this.move(0, rowHeight);
            break;
        case 'left':
            this.move(-colLength, 0);
            break;
        case 'right':
            this.move(colLength, 0);
    }
};

Player.prototype.move = function(dx, dy) {
    var newX = this.x + dx, newY = this.y + dy;

    if (newX >= 0 && newX < cols * colLength) {
        this.x = newX;
    }
    if (newY > 50 && newY < (rows-1) * rowHeight) {
        this.y = newY;
    }
};

Player.prototype.update = function(x, y) {
    
};
// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
allEnemies.push(new Enemy(50, 1, 2));
allEnemies.push(new Enemy(30, 2, 0));
var player = new Player(5, 2);


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
