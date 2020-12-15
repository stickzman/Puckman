// Determine # of pixels per tile for game calculations
const TILE_SIZE = Math.floor(Math.min(window.innerHeight / 36, window.innerWidth / 28));
// Determine # of pixels per tile for drawing to the canvas
let C_TILE_SIZE = TILE_SIZE;
const MAX_SPEED = TILE_SIZE * 0.16;
var dir;
(function (dir) {
    dir[dir["UP"] = 0] = "UP";
    dir[dir["LEFT"] = 1] = "LEFT";
    dir[dir["DOWN"] = 2] = "DOWN";
    dir[dir["RIGHT"] = 3] = "RIGHT";
})(dir || (dir = {}));
var STATE;
(function (STATE) {
    STATE[STATE["CHASE"] = 0] = "CHASE";
    STATE[STATE["SCATTER"] = 1] = "SCATTER";
    STATE[STATE["FRIGHTENED"] = 2] = "FRIGHTENED";
    STATE[STATE["EATEN"] = 3] = "EATEN";
    STATE[STATE["WAITING"] = 4] = "WAITING";
    STATE[STATE["EXITING"] = 5] = "EXITING";
})(STATE || (STATE = {}));
function shuffle(arr) {
    const array = arr.slice();
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
/// <reference path="helper.ts"/>
class Ghost {
    constructor() {
        this.debug = false;
        this.color = "brown";
        this.scatterX = 0;
        this.scatterY = 0;
        this.homeX = 13;
        this.homeY = 14;
        this.waitX = 13.5;
        this.waitY = 17;
        this.frightenedFrames = 0;
        this.frightenedFlash = false;
        this.waitSpeed = 0.3 * MAX_SPEED;
        this.newLife = true;
        this.active = false;
        this.dotLimit = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
    reset() {
        // Speed
        if (level === 1) {
            this.baseSpeed = 0.75;
            this.frightenedSpeed = 0.5;
            this.tunnelSpeed = 0.4;
        }
        else if (level <= 4) {
            this.baseSpeed = 0.85;
            this.frightenedSpeed = 0.55;
            this.tunnelSpeed = 0.45;
        }
        else if (level <= 20) {
            this.baseSpeed = 0.95;
            this.frightenedSpeed = 0.6;
            this.tunnelSpeed = 0.5;
        }
        else {
            this.baseSpeed = 0.95;
            this.frightenedSpeed = 0.6;
            this.tunnelSpeed = 0.5;
        }
        // Fright Frames
        if (level === 1)
            Ghost.maxFrightenedFrames = 8 * 60;
        else if (level === 2)
            Ghost.maxFrightenedFrames = 7 * 60;
        else if (level === 3)
            Ghost.maxFrightenedFrames = 6 * 60;
        else if (level < 6)
            Ghost.maxFrightenedFrames = 5 * 60;
        else if (level < 8)
            Ghost.maxFrightenedFrames = 4 * 60;
        else if (level < 10)
            Ghost.maxFrightenedFrames = 3 * 60;
        else if (level < 15)
            Ghost.maxFrightenedFrames = 2 * 60;
        else if (level < 20)
            Ghost.maxFrightenedFrames = 1 * 60;
        else
            Ghost.maxFrightenedFrames = 0;
        this.dotCount = 0;
        this.newLife = true;
        this.direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT;
        this.setState(STATE.WAITING);
    }
    update() {
        if (this.state === STATE.FRIGHTENED && --this.frightenedFrames <= 0) {
            this.setState(globalState);
        }
        else if (this.state === STATE.WAITING) {
            this.updateWaiting();
            return;
        }
        else if (this.state === STATE.EXITING) {
            if (this.tileY === 14
                && (this.y + this.pixPerFrame / 2) % TILE_SIZE < this.pixPerFrame) {
                this.setState(globalState);
                // Check if the ghost is leaving for first time and
                // player has boostFrames left, if so
                // set ghost frightenedFrames to boostFrames
                if (this.newLife && player.boostFrames > 0) {
                    this.setState(STATE.FRIGHTENED);
                    this.frightenedFrames = player.boostFrames;
                }
                this.newLife = false;
            }
            else {
                this.y -= this.pixPerFrame;
                this.updateTilePos();
            }
            return;
        }
        this.updateTarget();
        if (this.updateTilePos()) {
            if (this.state === STATE.EATEN
                && this.tileX === this.homeX
                && this.tileY === this.homeY) {
                this.setState(STATE.WAITING);
            }
        }
        this.updateSpeed();
        // Check if we're at the tile's midpoint
        if ((this.x + this.pixPerFrame / 2) % TILE_SIZE < this.pixPerFrame
            && (this.y + this.pixPerFrame / 2) % TILE_SIZE < this.pixPerFrame) {
            // Wrap x-axis
            if (this.tileX < -1 && this.direction === dir.LEFT) {
                this.x = 28 * TILE_SIZE;
                this.updateTilePos();
            }
            else if (this.tileX > 27 && this.direction === dir.RIGHT) {
                this.x = -TILE_SIZE;
                this.updateTilePos();
            }
            // Snap to center of tile
            if (this.x > 0) {
                this.x = this.tileX * TILE_SIZE;
                this.y = this.tileY * TILE_SIZE;
            }
            this.direction = this.getNextDirection();
        }
        this.move();
    }
    updateWaiting() {
        if ((this.y + Math.abs(this.waitSpeed) / 2) % TILE_SIZE < Math.abs(this.waitSpeed)) {
            if (this.tileY === 16)
                this.waitSpeed = Math.abs(this.waitSpeed);
            if (this.tileY === 18)
                this.waitSpeed = -1 * Math.abs(this.waitSpeed);
        }
        this.y += this.waitSpeed;
        this.updateTilePos();
        if (this.dotCount >= this.dotLimit
            && ghosts.every((g) => g.state !== STATE.EXITING)) {
            this.dotCount = 0; // Reset the dot counter
            this.setState(STATE.EXITING);
        }
    }
    incDotCount() {
        if (this.state === STATE.WAITING)
            this.dotCount++;
    }
    setState(state) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        switch (state) {
            case STATE.FRIGHTENED: {
                if (!this.active)
                    return;
                this.frightenedFrames = Ghost.maxFrightenedFrames;
                break;
            }
            case STATE.CHASE: {
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction);
                break;
            }
            case STATE.SCATTER: {
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction);
                this.targetX = this.scatterX;
                this.targetY = this.scatterY;
                break;
            }
            case STATE.EATEN: {
                this.targetX = this.homeX;
                this.targetY = this.homeY;
                break;
            }
            case STATE.WAITING: {
                this.x = this.waitX * TILE_SIZE;
                this.y = this.waitY * TILE_SIZE;
                this.updateTilePos();
                break;
            }
            case STATE.EXITING: {
                this.x = 13.5 * TILE_SIZE;
                this.y = 17 * TILE_SIZE;
                this.updateTilePos();
                this.setSpeed(0.3);
                break;
            }
        }
        this.active = state === STATE.CHASE || state === STATE.SCATTER || state === STATE.FRIGHTENED;
        this.state = state;
    }
    updateTarget() { }
    updateSpeed() {
        // Tunnel speed penalty
        if (this.tileY === 17 && (this.tileX < 6 || this.tileX >= 22)) {
            this.setSpeed(this.tunnelSpeed);
        }
        else {
            switch (this.state) {
                case STATE.FRIGHTENED: {
                    this.setSpeed(this.frightenedSpeed);
                    break;
                }
                case STATE.EATEN: {
                    this.setSpeed(1.5);
                    break;
                }
                default: {
                    this.setSpeed(this.baseSpeed);
                }
            }
        }
    }
    move() {
        switch (this.direction) {
            case dir.UP:
                this.y -= this.pixPerFrame;
                break;
            case dir.DOWN:
                this.y += this.pixPerFrame;
                break;
            case dir.LEFT:
                this.x -= this.pixPerFrame;
                break;
            case dir.RIGHT:
                this.x += this.pixPerFrame;
                break;
        }
    }
    updateTilePos() {
        const oldX = this.tileX;
        this.tileX = TileMap.toTileSize(this.x);
        const oldY = this.tileY;
        this.tileY = TileMap.toTileSize(this.y);
        //Check if we've entered a new tile
        return (this.tileX !== oldX || this.tileY !== oldY);
    }
    getNextDirection() {
        if (this.state === STATE.FRIGHTENED) {
            return this.randomDir();
        }
        else {
            return this.findBestDir();
        }
    }
    findBestDir() {
        // Find opposite direction, as ghosts aren't allowed to turn around
        const oppDir = this.getOppositeDir(this.direction);
        // Find the distance to the target for all directions
        const distances = Ghost.allDirections.map((d) => {
            if (d === oppDir || !this.directionPossible(d))
                return Infinity;
            //Get the tile x, y
            let x, y;
            switch (d) {
                case dir.UP: {
                    x = this.tileX;
                    y = this.tileY - 1;
                    break;
                }
                case dir.DOWN: {
                    x = this.tileX;
                    y = this.tileY + 1;
                    break;
                }
                case dir.LEFT: {
                    x = this.tileX - 1;
                    y = this.tileY;
                    break;
                }
                case dir.RIGHT: {
                    x = this.tileX + 1;
                    y = this.tileY;
                    break;
                }
            }
            return Math.hypot(this.targetX - x, this.targetY - y);
        });
        // Return the index of the smallest distance. index === direction
        return distances.indexOf(Math.min(...distances));
    }
    randomDir() {
        // Find opposite direction, as ghosts aren't allowed to turn around
        const oppDir = (this.direction < 2) ? this.direction + 2 : this.direction - 2;
        const dirs = shuffle(Ghost.allDirections);
        for (let i = 0; i < dirs.length; i++) {
            if (dirs[i] === oppDir || !this.directionPossible(dirs[i]))
                continue;
            return dirs[i];
        }
    }
    directionPossible(direction) {
        switch (direction) {
            case dir.UP: {
                if (this.tileX >= 12 && this.tileX <= 16
                    && (this.tileY === 14 || this.tileY === 26))
                    return false;
                return TileMap.getTile(this.tileX, this.tileY - 1) > 0;
            }
            case dir.DOWN: {
                return TileMap.getTile(this.tileX, this.tileY + 1) > 0;
            }
            case dir.LEFT: {
                return TileMap.getTile(this.tileX - 1, this.tileY) !== 0;
            }
            case dir.RIGHT: {
                return TileMap.getTile(this.tileX + 1, this.tileY) !== 0;
            }
        }
    }
    getOppositeDir(direction) {
        return (direction < 2) ? direction + 2 : direction - 2;
    }
    setSpeed(speed) {
        // Speed should be a percentage [0-1]
        speed = Math.max(0, speed);
        this.pixPerFrame = speed * MAX_SPEED;
    }
    draw(c) {
        const x = this.x * (C_TILE_SIZE / TILE_SIZE);
        const y = this.y * (C_TILE_SIZE / TILE_SIZE);
        c.save();
        switch (this.state) {
            case STATE.FRIGHTENED: {
                if (this.frightenedFrames < Ghost.maxFrightenedFrames / 3) {
                    if (frameCount % 10 === 0)
                        this.frightenedFlash = !this.frightenedFlash;
                }
                else {
                    this.frightenedFlash = false;
                }
                c.fillStyle = (this.frightenedFlash) ? "#fff" : "blue";
                break;
            }
            case STATE.EATEN:
                c.fillStyle = "rgba(0,0,255,0.5)";
                break;
            default: c.fillStyle = this.color;
        }
        c.fillRect(x, y, C_TILE_SIZE, C_TILE_SIZE);
        if (this.debug) {
            c.strokeStyle = "red";
            c.strokeRect(this.tileX * C_TILE_SIZE, this.tileY * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE);
            c.strokeStyle = this.color;
            c.strokeRect(this.targetX * C_TILE_SIZE, this.targetY * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE);
        }
        c.restore();
    }
}
Ghost.allDirections = [0, 1, 2, 3];
Ghost.maxFrightenedFrames = 720;
/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    constructor() {
        super();
        this.color = "#fc0000";
        this.scatterX = 24;
        this.scatterY = 1;
        this.elroy = 0;
        this.newLife = false;
        this.reset();
    }
    setElroy(e) {
        this.elroy = e;
        if (this.state === STATE.SCATTER)
            this.setState(STATE.CHASE);
    }
    reset() {
        super.reset();
        this.newLife = false;
        this.elroy = 0;
        this.x = 13.5 * TILE_SIZE;
        this.y = 14 * TILE_SIZE;
        this.setState(globalState);
        this.updateTilePos();
    }
    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX;
            this.targetY = player.tileY;
        }
    }
    setState(state) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        switch (state) {
            case STATE.FRIGHTENED: {
                if (!this.active)
                    return;
                this.frightenedFrames = Ghost.maxFrightenedFrames;
                break;
            }
            case STATE.CHASE: {
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction);
                break;
            }
            case STATE.SCATTER: {
                if (this.elroy)
                    return;
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction);
                this.targetX = this.scatterX;
                this.targetY = this.scatterY;
                break;
            }
            case STATE.EATEN: {
                this.targetX = this.homeX;
                this.targetY = this.homeY;
                break;
            }
            case STATE.WAITING: {
                this.x = this.waitX * TILE_SIZE;
                this.y = this.waitY * TILE_SIZE;
                this.updateTilePos();
                break;
            }
            case STATE.EXITING: {
                this.x = 13.5 * TILE_SIZE;
                this.y = 17 * TILE_SIZE;
                this.updateTilePos();
                this.setSpeed(0.3);
                break;
            }
        }
        this.active = state === STATE.CHASE || state === STATE.SCATTER || state === STATE.FRIGHTENED;
        this.state = state;
    }
    updateSpeed() {
        // Tunnel speed penalty
        if (this.tileY === 17 && (this.tileX < 6 || this.tileX >= 22)) {
            this.setSpeed(this.tunnelSpeed);
        }
        else {
            switch (this.state) {
                case STATE.FRIGHTENED: {
                    this.setSpeed(this.frightenedSpeed);
                    break;
                }
                case STATE.EATEN: {
                    this.setSpeed(1.5);
                    break;
                }
                default: {
                    if (this.elroy === 1) {
                        this.setSpeed(this.baseSpeed + 0.05);
                    }
                    else if (this.elroy === 2) {
                        this.setSpeed(this.baseSpeed + 0.1);
                    }
                    else {
                        this.setSpeed(this.baseSpeed);
                    }
                }
            }
        }
    }
}
/// <reference path="Ghost.ts"/>
class Clyde extends Ghost {
    constructor() {
        super();
        this.color = "#fab852";
        this.scatterX = 0;
        this.scatterY = 35;
        this.waitX = 15.5;
        this.dotLimit = 60;
        this.reset();
    }
    reset() {
        super.reset();
        if (level === 1) {
            this.dotLimit = 60;
        }
        else if (level === 2) {
            this.dotLimit = 50;
        }
        else {
            this.dotLimit = 0;
        }
    }
    incDotCount() {
        if (this.state === STATE.WAITING
            && pinky.state !== STATE.WAITING
            && inky.state !== STATE.WAITING)
            this.dotCount++;
    }
    updateTarget() {
        if (this.state === STATE.CHASE) {
            if (Math.hypot(player.tileX - this.tileX, player.tileY - this.tileY) > 8) {
                this.targetX = player.tileX;
                this.targetY = player.tileY;
            }
            else {
                this.targetX = this.scatterX;
                this.targetY = this.scatterY;
            }
        }
    }
}
/// <reference path="Ghost.ts"/>
class Inky extends Ghost {
    constructor() {
        super();
        this.color = "#00ffff";
        this.scatterX = 27;
        this.scatterY = 35;
        this.waitX = 11.5;
        this.dotLimit = 30;
        this.reset();
        this.updateOffset();
    }
    reset() {
        super.reset();
        this.dotLimit = (level === 1) ? 30 : 0;
    }
    incDotCount() {
        if (this.state === STATE.WAITING
            && pinky.state !== STATE.WAITING)
            this.dotCount++;
    }
    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.updateOffset();
            this.targetX = this.offsetX + (this.offsetX - blinky.tileX);
            this.targetY = this.offsetY + (this.offsetY - blinky.tileY);
        }
    }
    updateOffset() {
        switch (player.direction) {
            case dir.UP: {
                this.offsetX = player.tileX;
                this.offsetY = player.tileY - 2;
                break;
            }
            case dir.DOWN: {
                this.offsetX = player.tileX;
                this.offsetY = player.tileY + 2;
                break;
            }
            case dir.LEFT: {
                this.offsetX = player.tileX - 2;
                this.offsetY = player.tileY;
                break;
            }
            case dir.RIGHT: {
                this.offsetX = player.tileX + 2;
                this.offsetY = player.tileY;
                break;
            }
        }
    }
}
/// <reference path="Ghost.ts"/>
class Pinky extends Ghost {
    constructor() {
        super();
        this.color = "#feb8fe";
        this.scatterX = 4;
        this.scatterY = 1;
        this.reset();
    }
    updateTarget() {
        if (this.state === STATE.CHASE) {
            switch (player.direction) {
                case dir.UP: {
                    this.targetX = player.tileX;
                    this.targetY = player.tileY - 4;
                    break;
                }
                case dir.DOWN: {
                    this.targetX = player.tileX;
                    this.targetY = player.tileY + 4;
                    break;
                }
                case dir.LEFT: {
                    this.targetX = player.tileX - 4;
                    this.targetY = player.tileY;
                    break;
                }
                case dir.RIGHT: {
                    this.targetX = player.tileX + 4;
                    this.targetY = player.tileY;
                    break;
                }
            }
        }
    }
}
/// <reference path="helper.ts"/>
class Player {
    constructor() {
        this.debug = false;
        this.god = false;
        this.color = "#ffff00";
        this.frameHalt = 0;
        this.dotLimit = 244;
        this.lives = 3;
        this.direction = dir.RIGHT;
        this.desiredDirection = this.direction;
        this.dotTimerLimit = 240;
        this.boostFrames = 0;
        this.reset();
    }
    reset() {
        //Speed
        if (level === 1) {
            this.baseSpeed = 0.8;
            this.boostSpeed = 0.9;
        }
        else if (level <= 4) {
            this.baseSpeed = 0.9;
            this.boostSpeed = 0.95;
        }
        else if (level <= 20) {
            this.baseSpeed = 1;
            this.boostSpeed = 1;
        }
        else {
            this.baseSpeed = 0.9;
            this.boostSpeed = 1;
        }
        //Elroy Dots
        if (level === 1) {
            this.elroy1Limit = 224;
            this.elroy2Limit = 234;
        }
        else if (level <= 2) {
            this.elroy1Limit = 214;
            this.elroy2Limit = 229;
        }
        else if (level <= 5) {
            this.elroy1Limit = 204;
            this.elroy2Limit = 224;
        }
        else if (level <= 8) {
            this.elroy1Limit = 194;
            this.elroy2Limit = 219;
        }
        else if (level <= 11) {
            this.elroy1Limit = 184;
            this.elroy2Limit = 214;
        }
        else if (level <= 14) {
            this.elroy1Limit = 164;
            this.elroy2Limit = 204;
        }
        else if (level <= 18) {
            this.elroy1Limit = 144;
            this.elroy2Limit = 194;
        }
        else {
            this.elroy1Limit = 124;
            this.elroy2Limit = 184;
        }
        this.frameHalt = 0;
        this.dotTimer = 0;
        this.boostFrames = 0;
        this.x = 13.5 * TILE_SIZE;
        this.y = 26 * TILE_SIZE;
        this.direction = dir.LEFT;
        this.setSpeed(this.baseSpeed);
        this.updateTilePos();
    }
    setSpeed(speed) {
        speed = Math.max(0, speed); // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED;
    }
    update() {
        if (this.boostFrames > 0) {
            if (--this.boostFrames <= 0 || ghosts.every(g => g.state !== STATE.FRIGHTENED)) {
                this.boostFrames = 0;
                this.setSpeed(this.baseSpeed);
            }
            else
                this.setSpeed(this.boostSpeed);
        }
        // Update game tile x, y position
        if (this.updateTilePos()) {
            var tile = TileMap.getTile(this.tileX, this.tileY);
            // Did we eat a dot?
            if (tile > 1) {
                this.dotTimer = 0;
                ghosts.forEach((g) => g.incDotCount());
                // Check win
                ++this.dotCount;
                if (this.dotCount === this.elroy1Limit) {
                    blinky.setElroy(1);
                }
                else if (this.dotCount === this.elroy2Limit) {
                    blinky.setElroy(2);
                }
                else if (this.dotCount >= this.dotLimit) {
                    // You win!
                    levelWin();
                }
                if (tile === 2) {
                    // Small dot
                    addPoints(10);
                    this.frameHalt = 1;
                }
                else if (tile === 3) {
                    // Big dot
                    addPoints(50);
                    this.frameHalt = 3;
                    this.ghostsEaten = 0;
                    this.boostFrames = Ghost.maxFrightenedFrames;
                    ghosts.forEach((g) => g.setState(STATE.FRIGHTENED));
                }
                TileMap.setTile(this.tileX, this.tileY, 1);
            }
        }
        // Check if we're at the tile's midpoint
        if ((this.x + this.pixPerFrame / 2) % TILE_SIZE < this.pixPerFrame
            && (this.y + this.pixPerFrame / 2) % TILE_SIZE < this.pixPerFrame) {
            // Wrap x-axis
            if (this.tileX < -1 && this.direction === dir.LEFT) {
                this.x = 28 * TILE_SIZE;
                this.updateTilePos();
            }
            else if (this.tileX > 27 && this.direction === dir.RIGHT) {
                this.x = -TILE_SIZE;
                this.updateTilePos();
            }
            // Snap to center of tile
            if (this.x > 0) {
                this.x = this.tileX * TILE_SIZE;
                this.y = this.tileY * TILE_SIZE;
            }
            // Update direction
            if (this.directionPossible(this.desiredDirection)) {
                this.direction = this.desiredDirection;
            }
            else if (!this.directionPossible(this.direction)) {
                this.direction = null;
            }
        }
        else if (Math.abs(this.desiredDirection - this.direction) === 2
            && this.directionPossible(this.desiredDirection)) {
            // If they're trying to turn around, let them
            this.direction = this.desiredDirection;
        }
        this.checkCollision();
        if (this.frameHalt > 0) {
            this.frameHalt--;
        }
        else {
            //If the dot timer hits its limit, reset it and release the next waiting ghost
            if (++this.dotTimer > this.dotTimerLimit) {
                this.dotTimer = 0;
                ghosts.some((g) => {
                    if (g.state === STATE.WAITING) {
                        g.setState(STATE.EXITING);
                        return true;
                    }
                    return false;
                });
            }
            this.move(); // Update x, y pixel position
        }
    }
    checkCollision() {
        ghosts.forEach((g) => {
            if (this.tileX === g.tileX && this.tileY === g.tileY) {
                if (g.state === STATE.FRIGHTENED) {
                    const p = Math.pow(2, ++this.ghostsEaten) * 100;
                    setMiniScore(p, g.x * (C_TILE_SIZE / TILE_SIZE), g.y * (C_TILE_SIZE / TILE_SIZE));
                    addPoints(p);
                    globalFrameHalt = 60;
                    g.setState(STATE.EATEN);
                }
                else if (g.active && !this.god) {
                    if (--this.lives <= 0) {
                        running = false;
                        setTimeout(() => {
                            overlayText.textContent = "GAME OVER";
                            overlayScreen.style.display = "block";
                            overlayText.style.display = "block";
                            pollGamepadStart();
                        }, 1666);
                    }
                    else {
                        globalFrameHalt = 100;
                        resetReq = true;
                    }
                }
            }
        });
    }
    directionPossible(direction) {
        switch (direction) {
            case dir.UP: {
                return TileMap.getTile(this.tileX, this.tileY - 1) > 0;
            }
            case dir.DOWN: {
                return TileMap.getTile(this.tileX, this.tileY + 1) > 0;
            }
            // Allow undefined results on LEFT or RIGHT for x-axis wrapping
            case dir.LEFT: {
                return TileMap.getTile(this.tileX - 1, this.tileY) !== 0;
            }
            case dir.RIGHT: {
                return TileMap.getTile(this.tileX + 1, this.tileY) !== 0;
            }
        }
    }
    updateTilePos() {
        const oldX = this.tileX;
        this.tileX = TileMap.toTileSize(this.x);
        const oldY = this.tileY;
        this.tileY = TileMap.toTileSize(this.y);
        //Check if we've entered a new tile
        return (this.tileX !== oldX || this.tileY !== oldY);
    }
    move() {
        switch (this.direction) {
            case dir.UP:
                this.y -= this.pixPerFrame;
                break;
            case dir.DOWN:
                this.y += this.pixPerFrame;
                break;
            case dir.LEFT:
                this.x -= this.pixPerFrame;
                break;
            case dir.RIGHT:
                this.x += this.pixPerFrame;
                break;
        }
    }
    draw(c) {
        c.save();
        const x = this.x * (C_TILE_SIZE / TILE_SIZE);
        const y = this.y * (C_TILE_SIZE / TILE_SIZE);
        //Draw character
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(x + (C_TILE_SIZE / 2), y + (C_TILE_SIZE / 2), C_TILE_SIZE * 0.6, 0, Math.PI * 2);
        c.fill();
        //Draw lives
        for (let i = 0; i < this.lives; i++) {
            c.beginPath();
            c.arc(2 * C_TILE_SIZE * (i + 1), 35 * C_TILE_SIZE, C_TILE_SIZE * 0.75, 0, Math.PI * 2);
            c.fill();
        }
        if (this.debug) {
            c.strokeStyle = "red";
            c.strokeRect(this.tileX * C_TILE_SIZE, this.tileY * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE);
        }
        c.restore();
    }
}
/// <reference path="helper.ts"/>
class TileMap {
    constructor() { }
    static reset() {
        TileMap.map = TileMap.INIT_MAP.map((row) => row.slice());
        player.dotCount = 0;
    }
    static toTileSize(x) {
        return Math.round(x / TILE_SIZE);
    }
    static getTileAtPix(x, y) {
        return this.map[this.toTileSize(y)][this.toTileSize(x)];
    }
    static getTile(x, y) {
        return this.map[y][x];
    }
    static setTile(x, y, val) {
        this.map[y][x] = val;
    }
    static draw(ctx) {
        if (frameCount % 10 === 0)
            TileMap.flashDot = !TileMap.flashDot;
        ctx.save();
        this.map.forEach((row, tileJ) => {
            row.forEach((tile, tileI) => {
                if (!tile)
                    return;
                ctx.fillStyle = "black";
                ctx.fillRect(tileI * C_TILE_SIZE, tileJ * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE);
                ctx.fillStyle = "rgb(255,200,200)";
                if (tile === 2) {
                    // Dot special case
                    ctx.beginPath();
                    ctx.arc(tileI * C_TILE_SIZE + (C_TILE_SIZE / 2), tileJ * C_TILE_SIZE + (C_TILE_SIZE / 2), C_TILE_SIZE / 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
                else if (tile === 3) {
                    ctx.fillStyle = (TileMap.flashDot) ? "rgb(255,200,200)" : "#000";
                    ctx.beginPath();
                    ctx.arc(tileI * C_TILE_SIZE + (C_TILE_SIZE / 2), tileJ * C_TILE_SIZE + (C_TILE_SIZE / 2), C_TILE_SIZE * 0.4, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
        });
        ctx.restore();
    }
}
TileMap.flashDot = false;
TileMap.INIT_MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 3, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0],
    [0, 3, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 3, 0],
    [0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 0],
    [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
TileMap.map = TileMap.INIT_MAP.map((row) => row.slice());
/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = document.getElementById("canvas");
canvas.height = 36 * C_TILE_SIZE;
canvas.width = 28 * C_TILE_SIZE;
const c = canvas.getContext("2d");
//Adjust UI to TILE_SIZE
const body = document.querySelector("body");
body.style.fontSize = TILE_SIZE + "px";
const miniScore = document.querySelector(".miniScore");
const readyLabel = document.querySelector(".ready");
const levelElem = document.querySelector(".level");
const scoreLabel = document.querySelector(".scoreLabel");
const scoreElem = document.querySelector(".score");
const highscoreLabel = document.querySelector(".highscoreLabel");
const highscoreElem = document.querySelector(".highscore");
try {
    highscoreElem.textContent = localStorage.getItem("highscore") || "0";
}
catch (e) {
    console.error(e);
}
let highscore = parseInt(highscoreElem.textContent);
let statePatterns = { CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740] };
let level = 1;
let globalState = STATE.SCATTER;
let score = 0;
let frameCount = 0;
let globalFrameHalt = 0;
let paused = false;
let resetReq = true;
let running = false;
const player = new Player();
let blinky, pinky, inky, clyde;
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
];
let gamepadIndex = -1;
function pollGamepadStart() {
    if (running)
        return;
    if (gamepadIndex > -1) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (gamepad.buttons.some(b => b.pressed)) {
            resetGame();
            return;
        }
    }
    requestAnimationFrame(pollGamepadStart);
}
pollGamepadStart();
const overlayScreen = document.querySelector(".gameOverScreen");
const overlayText = document.querySelector(".gameOverText");
let startGameIntCount = 0;
const startGameInt = setInterval(() => {
    switch (++startGameIntCount) {
        case 0: {
            overlayText.textContent = "PUSH START!";
            overlayText.style.display = "block";
            break;
        }
        case 1:
            overlayText.style.display = "none";
            break;
        case 2: {
            overlayText.textContent = "PRESS ENTER!";
            overlayText.style.display = "block";
            break;
        }
        case 3:
            overlayText.style.display = "none";
            startGameIntCount = -1;
            break;
    }
}, 1000);
window.addEventListener("keydown", (e) => {
    if (running) {
        if (e.key === "Enter" || e.key === "Escape")
            togglePause();
        if (e.key === "w" || e.key === "ArrowUp")
            player.desiredDirection = dir.UP;
        if (e.key === "a" || e.key === "ArrowLeft")
            player.desiredDirection = dir.LEFT;
        if (e.key === "s" || e.key === "ArrowDown")
            player.desiredDirection = dir.DOWN;
        if (e.key === "d" || e.key === "ArrowRight")
            player.desiredDirection = dir.RIGHT;
    }
    else if (e.key === "Enter" || e.key === " ") {
        resetGame();
    }
});
window.addEventListener("resize", () => {
    //Adjust UI font-size
    body.style.fontSize = (canvas.offsetHeight / 36) + "px";
    C_TILE_SIZE = Math.floor(Math.min(window.innerHeight / 36, window.innerWidth / 28));
    canvas.height = 36 * C_TILE_SIZE;
    canvas.width = 28 * C_TILE_SIZE;
});
window.addEventListener("beforeunload", () => {
    try {
        localStorage.setItem("highscore", highscore.toString());
    }
    catch (e) {
        console.error(e);
    }
});
window.addEventListener("gamepadconnected", (e) => {
    gamepadIndex = e.gamepad.index;
});
let touchX;
let touchY;
window.addEventListener("touchstart", (e) => {
    if (!running)
        resetGame();
    let touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
});
window.addEventListener("touchmove", (e) => {
    if (!running)
        return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchX;
    const deltaY = touch.clientY - touchY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            player.desiredDirection = dir.RIGHT;
        }
        else {
            player.desiredDirection = dir.LEFT;
        }
    }
    else {
        if (deltaY > 0) {
            player.desiredDirection = dir.DOWN;
        }
        else {
            player.desiredDirection = dir.UP;
        }
    }
});
let miniScoreTimeout;
function setMiniScore(points, x, y) {
    if (miniScoreTimeout !== undefined)
        clearTimeout(miniScoreTimeout);
    miniScore.textContent = points.toString();
    miniScore.style.top = (y / canvas.height * 100 + 0.5).toString() + "%";
    miniScore.style.left = (x / canvas.width * 100).toString() + "%";
    miniScore.style.display = "block";
    miniScoreTimeout = setTimeout(() => miniScore.style.display = "none", 1500);
}
function flashUIElem(elem, msDuration) {
    elem.style.display = "none";
    let i = 0;
    const flashInt = setInterval(() => {
        switch (++i) {
            case 1:
                elem.style.display = "block";
                break;
            case 2:
                elem.style.display = "none";
                i = 0;
                break;
        }
    }, 300);
    setTimeout(() => {
        elem.style.display = "block";
        clearInterval(flashInt);
    }, msDuration);
}
function togglePause() {
    paused = !paused;
    if (paused) {
        overlayText.textContent = "PAUSED";
        overlayText.style.display = "block";
        overlayScreen.style.display = "block";
    }
    else {
        overlayScreen.style.display = "none";
    }
}
let startBtnPressed = false;
function updateGamepadControls(gamepad) {
    const buttons = gamepad.buttons;
    if (!startBtnPressed && buttons[9].pressed)
        togglePause();
    startBtnPressed = buttons[9].pressed;
    if (buttons[12].pressed)
        player.desiredDirection = dir.UP;
    else if (buttons[13].pressed)
        player.desiredDirection = dir.DOWN;
    else if (buttons[14].pressed)
        player.desiredDirection = dir.LEFT;
    else if (buttons[15].pressed)
        player.desiredDirection = dir.RIGHT;
    // Get active analogue stick
    const deadzone = 0.8;
    let xAxis, yAxis;
    if (Math.hypot(gamepad.axes[0], gamepad.axes[1]) >= deadzone) {
        xAxis = gamepad.axes[0];
        yAxis = gamepad.axes[1];
    }
    else if (Math.hypot(gamepad.axes[2], gamepad.axes[3]) >= deadzone) {
        xAxis = gamepad.axes[2];
        yAxis = gamepad.axes[3];
    }
    else {
        return;
    }
    if (Math.abs(xAxis) > Math.abs(yAxis)) {
        if (xAxis < 0) {
            player.desiredDirection = dir.LEFT;
        }
        else {
            player.desiredDirection = dir.RIGHT;
        }
    }
    else {
        if (yAxis < 0) {
            player.desiredDirection = dir.UP;
        }
        else {
            player.desiredDirection = dir.DOWN;
        }
    }
}
function levelWin() {
    globalFrameHalt = Infinity; // Pause game until flashing concludes
    setTimeout(() => {
        let i = 0;
        const interval = setInterval(() => {
            draw((++i % 2 === 0) ? "rgb(0,0,150)" : "rgb(150,150,150)");
        }, 175);
        setTimeout(() => {
            setLevel(level + 1);
            clearInterval(interval);
            globalFrameHalt = 0; // Resume game
        }, 1500);
    }, 1500);
}
function setLevel(l) {
    levelElem.textContent = l.toString();
    level = l;
    if (level === 1) {
        statePatterns = { CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740] };
    }
    else if (level <= 4) {
        statePatterns = { CHASE: [420, 2040, 3540, 65521], SCATTER: [1620, 3240, 65520] };
    }
    else {
        statePatterns = { CHASE: [300, 1800, 3300, 65521], SCATTER: [1500, 3000, 65520] };
    }
    TileMap.reset();
    resetReq = true;
}
function setGlobalState(state) {
    globalState = state;
    ghosts.forEach((g) => {
        if (g.active && g.state !== STATE.FRIGHTENED)
            g.setState(state);
    });
}
function addPoints(points) {
    const pointBonus = 10000;
    if (Math.floor(score / pointBonus) !== Math.floor((score + points) / pointBonus)) {
        flashUIElem(scoreElem, 3000);
        flashUIElem(scoreLabel, 3000);
        player.lives++;
    }
    if (score < highscore && score + points >= highscore) {
        flashUIElem(highscoreElem, 3000);
        flashUIElem(highscoreLabel, 3000);
    }
    score += points;
    scoreElem.textContent = score.toString();
    if (score > highscore) {
        highscore = score;
        highscoreElem.textContent = score.toString();
    }
}
function resetGame() {
    if (startGameInt !== undefined)
        clearInterval(startGameInt);
    overlayScreen.style.display = "none";
    score = 0;
    player.lives = 3;
    scoreElem.textContent = score.toString();
    setLevel(1);
    if (!running) {
        running = true;
        tick();
    }
}
function resetAll() {
    readyLabel.style.display = "block";
    setTimeout(() => { readyLabel.style.display = "none"; }, 2000);
    setGlobalState(STATE.SCATTER);
    player.reset();
    ghosts.forEach((g) => g.reset());
    frameCount = 0;
    resetReq = false;
}
function tick() {
    if (!running)
        return;
    // Check Gamepad controls
    if (gamepadIndex > -1)
        updateGamepadControls(navigator.getGamepads()[gamepadIndex]);
    if (paused) {
        // Do nothing if paused
    }
    else if (globalFrameHalt > 0) {
        globalFrameHalt--;
    }
    else if (resetReq) {
        resetAll();
        globalFrameHalt = 120;
        draw();
    }
    else {
        frameCount++;
        if (statePatterns.CHASE.includes(frameCount))
            setGlobalState(STATE.CHASE);
        else if (statePatterns.SCATTER.includes(frameCount))
            setGlobalState(STATE.SCATTER);
        player.update();
        ghosts.forEach((g) => g.update());
        if (!resetReq) {
            // If the player didn't hit anything, check again
            player.checkCollision();
            draw();
        }
    }
    window.requestAnimationFrame(tick);
}
function draw(bkgColor = "rgb(0,0,150)") {
    c.fillStyle = bkgColor;
    c.fillRect(0, 0, canvas.width, canvas.height);
    TileMap.draw(c);
    //Draw UI Bars
    c.fillStyle = "#000";
    c.fillRect(0, 0, 28 * C_TILE_SIZE, 3 * C_TILE_SIZE);
    c.fillRect(0, 34 * C_TILE_SIZE, 28 * C_TILE_SIZE, 2 * C_TILE_SIZE);
    //Draw monster pen exit
    c.fillRect(13.5 * C_TILE_SIZE, 15 * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE);
    c.fillStyle = "#e2cba9";
    c.fillRect(13.5 * C_TILE_SIZE, 15.25 * C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE / 2);
    player.draw(c);
    ghosts.forEach((g) => g.draw(c));
}
//# sourceMappingURL=index.js.map