var allEnemies = [],
    rowHeight = 83,
    colLength = 101,
    rows = 6,
    cols = 5;

// Helper functions

// randomFromRange
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// randomChoice
function randomChoiceFromArray(arr) {
    return arr[randomIntFromRange(0, arr.length-1)];
}

// Base class for different entities in game
// helps to maintain code DRY
var Entity = function() {

};

// Draws entity on the game field
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Get current row of entity
Entity.prototype.getRow = function() {
    return this.y < 0 ? 0 : Math.ceil(this.y / rowHeight);
};

// Get current column of entity
Entity.prototype.getCol = function() {
    return Math.floor(this.x / colLength);
};

// Enemies our player must avoid
var Enemy = function(speed, row) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.speed = randomIntFromRange(50, 150);
    
    this.x = -colLength;
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20;

};

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;

    if (this.x >= cols * colLength) {
        allEnemies.splice(allEnemies.indexOf(this),1);
        allEnemies.push(new Enemy());
    }

    this.checkCollisions();
};

Enemy.prototype.checkCollisions = function() {
    if (this.collidesWith(player)) {
        player.die();
    }
};

Enemy.prototype.collidesWith = function(player) {
    return this.getRow() === player.getRow() && Math.abs((this.x + colLength / 2) - (player.x + colLength / 2)) < (colLength - 30);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(row, col) {
    this.sprite = 'images/char-boy.png';

    this.x = col * colLength;
    this.y = row * rowHeight - 10;
};

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

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

Player.prototype.die = function() {
    player = new Player(5, 2);
};

// No need to update anything so far in this function
Player.prototype.update = function() {};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
allEnemies.push(new Enemy());
allEnemies.push(new Enemy());
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
