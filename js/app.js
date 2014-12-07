// Necessary variables
var allEnemies = [],
    allCollectibles = [],
    rowHeight = 83,
    colLength = 101,
    rows = 6,
    cols = 5,
    player;

// Helper functions

// randomFromRange
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// randomChoice
function randomChoiceFromArray(arr) {
    return arr[randomIntFromRange(0, arr.length-1)];
}

// events for the game
var scoreReached = new Event('game.scoreReached');
var gotTheKey = new Event('game.gotTheKey');

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

Entity.prototype.collidesWith = function(anotherEntity) {
    return this.getRow() === anotherEntity.getRow() && Math.abs((this.x + colLength / 2) - (anotherEntity.x + colLength / 2)) < (colLength - 30);
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

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(row, col, goal) {
    this.sprite = 'images/char-boy.png';
    this.score = 0;
    this.hasKey = false;
    this.goal = goal;

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

Player.prototype.update = function() {
    this.checkCollisions();
    if (this.score >= this.goal) {
        document.dispatchEvent(scoreReached);
        this.score = 0;
    } 
};

Player.prototype.checkCollisions = function() {
    var collectible;
    for (var i=0, x=allCollectibles.length; i < x; i++) {
        collectible = allCollectibles[i];
        if (this.collidesWith(collectible)) {
            if (collectible instanceof Star) {
                this.score += collectible.score;
                collectible.refresh();
            }
            if (collectible instanceof Key) {
                this.hasKey = true;
                document.dispatchEvent(gotTheKey);
            }
        }
    }
};

Player.prototype.getScore = function() {
    return this.score;
};

var Collectible = function(expirationTime, score) {    
    this.expirationTime = expirationTime;
    this.score = score || 0;

    this.x = randomIntFromRange(0, cols-1) * colLength;
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20;

    this.setExpire(this, expirationTime);
};

Collectible.prototype = Object.create(Entity.prototype);
Collectible.prototype.constructor = Collectible;

Collectible.prototype.setExpire = function(self, time) {
    self.expire = window.setTimeout(function(){
        self.refresh();
    }, time);
};

Collectible.prototype.refresh = function() {
    this.destroy();
    allCollectibles.splice(allCollectibles.indexOf(this),1);
    allCollectibles.push(new this.constructor(this.expirationTime, this.score)); 
};

Collectible.prototype.destroy = function() {
    window.clearTimeout(this.expire);
}

var Star = function(expirationTime, score) {
    Collectible.call(this, expirationTime, score);

    this.sprite = 'images/star.png';   
};

Star.prototype = Object.create(Collectible.prototype);
Star.prototype.constructor = Star;

var Key = function(expirationTime, score) {
    Collectible.call(this, expirationTime, score);

    this.sprite = 'images/key.png';
};

Key.prototype = Object.create(Collectible.prototype);
Key.prototype.constructor = Key;

// Game class
var Game = function(numEnemies) {
    this.numEnemies = numEnemies;
    this.level = 0; 
};

Game.prototype.start = function() {
    for (var i=0; i < this.numEnemies; i++) {
        allEnemies.push(new Enemy());
    }

    allCollectibles.push(new Star(5000, 100));

    player = new Player(5, 2, 500);
};

Game.prototype.destroyCollectibles = function() {
    // destroy all the timeouts
    for (var i = 0, x = allCollectibles.length; i < x; i++) {
        allCollectibles[i].destroy();
    }

    // and clear the array
    allCollectibles = [];
};

Game.prototype.proceedToKey = function() {
    this.destroyCollectibles();
    allCollectibles.push(new Key(3000));
    this.level = 1;
};

Game.prototype.proceedToExit = function() {
    this.destroyCollectibles();
    this.level = 2;
};

Game.prototype.update = function() {
    this.renderScore();
};

Game.prototype.renderScore = function() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 40);
    ctx.fillStyle = '#000';
    switch (this.level) {
        case 0:
            ctx.fillText('Score: ' + player.getScore(), 10, 30);
            break;
        case 1:
            ctx.fillText('Get the key!', 10, 30);
            break;
        case 2:
            ctx.fillText('Run away!', 10, 30);
    }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var game = new Game(3);
game.start();

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

// listen for custom game events
document.addEventListener('game.scoreReached', function() {
    game.proceedToKey();
});

document.addEventListener('game.gotTheKey', function() {
    game.proceedToExit();
});