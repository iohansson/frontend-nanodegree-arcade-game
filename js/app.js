'use strict';

/**
 * Declaring and initializing variables necessary for the game
 * allEnemies holds all the enemy vehicles in the game
 * allCollectibles holds all collectible objects
 * rowHeight height of the game grid row
 * colLength length of the game grid column
 * rows number of rows
 * cols number of columns
 * player game's hero 
 */
var allEnemies = [],
  allCollectibles = [],
  rowHeight = 83,
  colLength = 101,
  rows = 6,
  cols = 5,
  player;

// Helper functions

/**
 * Returns random integer in specified range
 * @param {number} min range lower limit
 * @param {number} max range higher limit
 * @return {number} an integer between min and max
 */
function randomIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns random choice from an array
 * @param {Array} arr array with arbitrary values
 * @return value from an array
 */
function randomChoiceFromArray(arr) {
  return arr[randomIntFromRange(0, arr.length - 1)];
}

// Events for the game

/**
 * event fires when score reached the goal
 */
var scoreReached = new Event('game.scoreReached'),

/**
 * event fires when player gets the key
 */
  gotTheKey = new Event('game.gotTheKey'),

/** 
 * event fires when player dies
 */
  playerDied = new Event('game.playerDied'),

/** 
 * event fires when player wins!
 */
  epicWin = new Event('game.epicWin');

/**
 * Class holding basic methods necessary for
 * entities in the game
 */
var Entity = function() {

};

/**
 * draws entity on the game field
 */
Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * @return {number} current row of an entity
 */
Entity.prototype.getRow = function() {
    return this.y < 0 ? 0 : Math.ceil(this.y / rowHeight);
};

/**
 * @return {number} current column of an entity
 */
Entity.prototype.getCol = function() {
    return Math.floor(this.x / colLength);
};

/**
 * checks whether entity collides with another entity
 * @param {Entity} anotherEntity an entity to check collision with
 * @return {boolean} true if collides, false if not
 */
Entity.prototype.collidesWith = function(anotherEntity) {
    return this.getRow() === anotherEntity.getRow() && Math.abs((this.x + colLength / 2) - (anotherEntity.x + colLength / 2)) < (colLength - 30);
};

/**
 * Class represents enemies in the game
 * @constructor
 * @extends {Entity}
 */
var Enemy = function() {
    this.sprite = 'images/enemy-bug.png'; // sprite for enemy entity
    this.speed = randomIntFromRange(50, 150); // speed is generated in range from 50 to 150

    this.x = -colLength; // enemy starts off the grid
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20; // row calculated by random choice from available rows

};

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;

/** 
 * Update the enemy's position, required method for game
 * @param {number} dt, a time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    this.x += this.speed * dt;

    /**
     * when enemy goes off the screen
     * we destroy it and create new Enemy
     */
    if (this.x >= cols * colLength) {
        allEnemies.splice(allEnemies.indexOf(this),1);
        allEnemies.push(new Enemy());
    }

    this.checkCollisions(); // check if collides with player
};

/** 
 * checks if enemy hit the player
 * if this is true, player dies
 */
Enemy.prototype.checkCollisions = function() {
    if (this.collidesWith(player)) {
        player.die();
    }
};

/**
 * Class represents enemies in the game
 * @param {number} row row to place player
 * @param {number} col column to place player
 * @param {number} goal score needed to start pursuing the key
 * @constructor
 * @extends {Entity}
 */
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

/** 
 * handles user input to move the player
 * @param {string} key direction where player should move
 */
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

/** 
 * moves player
 * @param {number} dx pixels to move in x direction
 * @param {number} dy pixels to move in y direction
 */
Player.prototype.move = function(dx, dy) {
    var newX = this.x + dx, newY = this.y + dy;

    if (newX >= 0 && newX < cols * colLength) {
        this.x = newX;
    }
    if (newY > 50 && newY < (rows-1) * rowHeight) {
        this.y = newY;
    }
};

/** 
 * when player dies, game is over
 * fires an event to end the game
 */
Player.prototype.die = function() {
    document.dispatchEvent(playerDied);
};

/** 
 * checks collisions
 * if score is reached for the goal, fires
 * appropriate event, sets score to 0 to fire an event only once
 */
Player.prototype.update = function() {
    this.checkCollisions();
    if (this.score >= this.goal) {
        document.dispatchEvent(scoreReached);
        this.score = 0;
    } 
};

/** 
 * checks if player hit either a collectible
 * or an exit gate
 */
Player.prototype.checkCollisions = function() {
    var collectible;
    for (var i=0, x=allCollectibles.length; i < x; i++) {
        collectible = allCollectibles[i];
        if (this.collidesWith(collectible)) {
            if (collectible instanceof Star) {
                this.score += collectible.score; // increase player's score
                collectible.refresh(); // refresh the star
            }
            if (collectible instanceof Key) {
                this.hasKey = true; // now we have the key!
                document.dispatchEvent(gotTheKey); // fire an event
            }
            if (collectible instanceof Gate) {
                document.dispatchEvent(epicWin); // win!
            }
        }
    }
};

/** 
 * @return {number} score of the player
 */
Player.prototype.getScore = function() {
    return this.score;
};

/**
 * Class represents collectibles in the game
 * @param {number} expirationTime time to refresh a positon
 *      of collectible
 * @param {number} score received for collecting 
 * @constructor
 * @extends {Entity}
 */
var Collectible = function(expirationTime, score) {    
    this.expirationTime = expirationTime;
    this.score = score || 0;

    this.x = randomIntFromRange(0, cols-1) * colLength;
    this.y = randomChoiceFromArray([1,2,3]) * rowHeight - 20;

    if (expirationTime) {
        this.setExpire(expirationTime); // if no expiration time, then no need to expire
    }
};

Collectible.prototype = Object.create(Entity.prototype);
Collectible.prototype.constructor = Collectible;

/**
 * sets timeout function to refresh position of collectible
 * @param {number} time time before update the position
 */
Collectible.prototype.setExpire = function(time) {
    var collectible = this;
    this.expire = window.setTimeout(function(){
        collectible.refresh();
    }, time);
};

/**
 * recreates collectible to update its position
 */
Collectible.prototype.refresh = function() {
    this.destroy();
    allCollectibles.push(new this.constructor(this.expirationTime, this.score)); 
};

/**
 * destroys a Collectible by destroying timeout if present and
 * by removing it from collectibles array
 */
Collectible.prototype.destroy = function() {
    this.expire && window.clearTimeout(this.expire);
    allCollectibles.splice(allCollectibles.indexOf(this),1);
}

/**
 * Class represents a star collectible
 * @param {number} expirationTime time to refresh a positon
 *      of collectible
 * @param {number} score received for collecting 
 * @constructor
 * @extends {Collectible}
 */
var Star = function(expirationTime, score) {
    Collectible.call(this, expirationTime, score);

    this.sprite = 'images/star.png';   
};

Star.prototype = Object.create(Collectible.prototype);
Star.prototype.constructor = Star;

/**
 * Class represents a key collectible
 * @param {number} expirationTime time to refresh a positon
 *      of collectible
 * @param {number} score received for collecting 
 * @constructor
 * @extends {Collectible}
 */
var Key = function(expirationTime, score) {
    Collectible.call(this, expirationTime, score);

    this.sprite = 'images/key.png';
};

Key.prototype = Object.create(Collectible.prototype);
Key.prototype.constructor = Key;

/**
 * Class represents an exit gate object
 * @constructor
 * @extends {Collectible}
 */
var Gate = function() {
    Collectible.call(this);

    this.sprite = 'images/selector.png';

    this.x = 0;
    this.y = 5 * rowHeight - 10; // put in the left bottom corner
};

Gate.prototype = Object.create(Collectible.prototype);
Gate.prototype.constructor = Gate;

/**
 * Class represents a game object itself
 * @param {number} numEnemies enemies in the game 
 * @constructor
 */
var Game = function(numEnemies) {
    this.numEnemies = numEnemies;

    var game = this;
    var newGameButton = document.createElement('button'); // add new game button
    newGameButton.textContent = "New game";
    document.body.appendChild(newGameButton);
    newGameButton.addEventListener('click', function() {
        game.reset(); // reset when new game clicked
    });
};

/**
 * starts the game by creating enemies, collectibles and player
 */
Game.prototype.start = function() {
    for (var i=0; i < this.numEnemies; i++) {
        allEnemies.push(new Enemy());
    }

    allCollectibles.push(new Star(5000, 100));

    player = new Player(5, 2, 500);

    this.level = 0;
};

/**
 * ends the game by destroying collectibles and enemies
 */
Game.prototype.end = function() {
    this.destroyCollectibles();
    this.destroyEnemies();
};

/**
 * new game
 */
Game.prototype.reset = function() {
    this.end();
    this.start();
};

/**
 * win!
 */
Game.prototype.win = function() {
    this.end();

    this.level = 3; // to display proper message about winning the game
};

/**
 * destroys all the collectible entities in the game
 */
Game.prototype.destroyCollectibles = function() {
    for (var i = 0, x = allCollectibles.length; i < x; i++) {
        allCollectibles[i].destroy();
    }

    allCollectibles = [];
};

/**
 * destroys all the enemy entities in the game
 */
Game.prototype.destroyEnemies = function() {
    allEnemies = [];
};

/**
 * destroy stars, add the key and change game message (level)
 */
Game.prototype.proceedToKey = function() {
    this.destroyCollectibles();
    allCollectibles.push(new Key(3000));
    this.level = 1;
};

/**
 * destroy key, render gate and change game message
 */
Game.prototype.proceedToExit = function() {
    this.destroyCollectibles();
    this.level = 2;
    allCollectibles.push(new Gate());
};

/**
 * update game information
 */
Game.prototype.update = function() {
    this.renderInfo();
};


/**
 * render text about game status
 */
Game.prototype.renderInfo = function() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 300, 40); // to clear the field
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
            break;
        case 3:
            ctx.fillText('You won! Start a new game!', 10, 30);
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

document.addEventListener('game.playerDied', function() {
    game.reset();
});

document.addEventListener('game.epicWin', function() {
    game.win();
});