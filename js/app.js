// Necessary variables
var allEnemies = [],
    allCollectibles = [],
    rowHeight = 83,
    colLength = 101,
    rows = 6,
    cols = 5,
    keyIssued = false;

// Helper functions

// randomFromRange
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
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
    this.updateScore();
    if (this.score >= this.goal && !keyIssued) {
        this.pursueTheKey();
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
                collectible.destroy();
                allCollectibles = [];
            }
        }
    }
};

Player.prototype.updateScore = function() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 40);
    ctx.fillStyle = '#000';
    if (this.hasKey) {
        ctx.fillText('Run away!', 10, 30);
    } else if (this.score >= this.goal) {
        ctx.fillText('Get the key!', 10, 30);
    } else {
        ctx.fillText('Score: ' + this.score, 10, 30);
    }
};

Player.prototype.pursueTheKey = function() {
    keyIssued = true;
    
    // destroy all the timeouts
    for (var i = 0, x = allCollectibles.length; i < x; i++) {
        allCollectibles[i].destroy();
    }

    // and clear the array
    allCollectibles = [];

    allCollectibles.push(new Key(3000));
};

var Collectible = function(score, expirationTime) {    
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
    allCollectibles.push(new this.constructor(this.score, this.expirationTime)); 
};

Collectible.prototype.destroy = function() {
    window.clearTimeout(this.expire);
}

var Star = function(score, expirationTime) {
    this.score = score;
    this.expirationTime = expirationTime;

    this.sprite = 'images/star.png';

    this.x = randomIntFromRange(0, cols-1) * colLength;
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20;

    this.setExpire(this, expirationTime);
};

Star.prototype = Object.create(Collectible.prototype);
Star.prototype.constructor = Star;

var Key = function(expirationTime) {
    this.expirationTime = expirationTime;

    this.sprite = 'images/key.png';

    this.x = randomIntFromRange(0, cols-1) * colLength;
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20;

    this.setExpire(this, expirationTime);
};

Key.prototype = Object.create(Collectible.prototype);
Key.prototype.constructor = Key;

Key.prototype.refresh = function() {
    window.clearTimeout(this.expire);
    allCollectibles.splice(allCollectibles.indexOf(this),1);
    allCollectibles.push(new this.constructor(this.expirationTime)); 
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
allEnemies.push(new Enemy());
allEnemies.push(new Enemy());
allCollectibles.push(new Star(100, 5000));
var player = new Player(5, 2, 500);


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
