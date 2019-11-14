const TILE_SIZE = Math.floor(Math.min(window.innerHeight / 36, window.innerWidth / 28));
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
    constructor(x = 13.5 * TILE_SIZE, y = 14 * TILE_SIZE) {
        this.x = x;
        this.y = y;
        this.allDirections = [0, 1, 2, 3];
        this.color = "brown";
        this.direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT;
        this.scatterX = 0;
        this.scatterY = 0;
        this.homeX = 13;
        this.homeY = 14;
        this.waitX = 13.5;
        this.waitY = 17;
        this.dotLimit = 0;
        this.dotCount = 0;
        this.frightenedFrames = 0;
        this.debug = false;
        this.active = false;
        this.targetX = 0;
        this.targetY = 0;
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
        if (this.dotCount < this.dotLimit ||
            !ghosts.every((g) => g.state !== STATE.EXITING))
            return;
        this.dotCount = 0; // Reset the dot counter
        this.setState(STATE.EXITING);
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
                this.frightenedFrames = 720;
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
            this.setSpeed(0.4);
        }
        else {
            switch (this.state) {
                case STATE.FRIGHTENED: {
                    this.setSpeed(0.5);
                    break;
                }
                case STATE.EATEN: {
                    this.setSpeed(1.5);
                    break;
                }
                default: {
                    this.setSpeed(0.75);
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
        const distances = this.allDirections.map((d) => {
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
        const dirs = shuffle(this.allDirections);
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
        c.save();
        switch (this.state) {
            case STATE.FRIGHTENED:
                c.fillStyle = "blue";
                break;
            case STATE.EATEN:
                c.fillStyle = "rgba(0,0,255,0.5)";
                break;
            default: c.fillStyle = this.color;
        }
        c.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
        if (this.debug) {
            c.strokeStyle = "red";
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            c.strokeStyle = this.color;
            c.strokeRect(this.targetX * TILE_SIZE, this.targetY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        c.restore();
    }
}
/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    constructor(x = 13.5 * TILE_SIZE, y = 14 * TILE_SIZE) {
        super(x, y);
        this.color = "red";
        this.scatterX = 24;
        this.scatterY = 1;
        this.x = x;
        this.y = y;
        this.updateTilePos();
        this.setState(globalState);
    }
    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX;
            this.targetY = player.tileY;
        }
    }
}
/// <reference path="Ghost.ts"/>
class Clyde extends Ghost {
    constructor(x, y) {
        super(x, y);
        this.color = "orange";
        this.scatterX = 0;
        this.scatterY = 35;
        this.dotLimit = 60;
        this.waitX = 15.5;
        this.setState(STATE.WAITING);
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
    constructor(x, y) {
        super(x, y);
        this.color = "lightblue";
        this.scatterX = 27;
        this.scatterY = 35;
        this.dotLimit = 30;
        this.waitX = 11.5;
        this.setState(STATE.WAITING);
        this.updateOffset();
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
    constructor(x, y) {
        super(x, y);
        this.color = "pink";
        this.scatterX = 4;
        this.scatterY = 1;
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
    constructor(x = 13.5 * TILE_SIZE, y = 26 * TILE_SIZE, speed = 0.8) {
        this.x = x;
        this.y = y;
        this.color = "yellow";
        this.frameHalt = 0;
        this.dotLimit = 244;
        this.debug = false;
        this.god = false;
        this.direction = dir.LEFT;
        this.desiredDirection = this.direction;
        this.dotCount = 0;
        this.dotTimer = 0;
        this.dotTimerLimit = 240;
        this.setSpeed(speed);
        this.updateTilePos();
    }
    setSpeed(speed) {
        speed = Math.min(Math.max(0, speed), 1); // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED;
    }
    update() {
        // Update game tile x, y position
        if (this.updateTilePos()) {
            var tile = TileMap.getTile(this.tileX, this.tileY);
            if (tile > 1) {
                // Reset dotTimer
                this.dotTimer = 0;
                //Don't move this frame if they ate a dot
                ghosts.forEach((g) => g.incDotCount());
                if (++this.dotCount >= this.dotLimit) {
                    console.log("You Win!!");
                    globalFrameHalt = Infinity;
                }
                if (tile === 2) {
                    this.frameHalt = 1;
                }
                else if (tile === 3) {
                    this.frameHalt = 3;
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
                    g.setState(STATE.EATEN);
                }
                else if (g.active && !this.god) {
                    globalFrameHalt = Infinity;
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
        c.fillStyle = this.color;
        c.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
        if (this.debug) {
            c.strokeStyle = "red";
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        c.restore();
    }
}
/// <reference path="helper.ts"/>
class TileMap {
    constructor() { }
    static reset() {
        TileMap.map = TileMap.INIT_MAP.map((row) => row.slice());
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
        ctx.save();
        this.map.forEach((row, tileJ) => {
            row.forEach((tile, tileI) => {
                if (!tile)
                    return;
                ctx.fillStyle = "black";
                ctx.fillRect(tileI * TILE_SIZE, tileJ * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = "rgb(255,200,200)";
                if (tile === 2) {
                    // Dot special case
                    ctx.beginPath();
                    ctx.arc(tileI * TILE_SIZE + (TILE_SIZE / 2), tileJ * TILE_SIZE + (TILE_SIZE / 2), TILE_SIZE / 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
                else if (tile === 3) {
                    ctx.beginPath();
                    ctx.arc(tileI * TILE_SIZE + (TILE_SIZE / 2), tileJ * TILE_SIZE + (TILE_SIZE / 2), TILE_SIZE / 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
        });
        ctx.restore();
    }
}
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
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0],
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
canvas.height = 36 * TILE_SIZE;
canvas.width = 28 * TILE_SIZE;
const c = canvas.getContext("2d");
let globalState = STATE.SCATTER;
let frameCount = 0;
let globalFrameHalt = 0;
let paused = false;
const player = new Player();
let blinky, pinky, inky, clyde;
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
];
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape")
        paused = !paused;
    if (e.key === "w" || e.key === "ArrowUp")
        player.desiredDirection = dir.UP;
    if (e.key === "a" || e.key === "ArrowLeft")
        player.desiredDirection = dir.LEFT;
    if (e.key === "s" || e.key === "ArrowDown")
        player.desiredDirection = dir.DOWN;
    if (e.key === "d" || e.key === "ArrowRight")
        player.desiredDirection = dir.RIGHT;
});
function setGlobalState(state) {
    globalState = state;
    ghosts.forEach((g) => {
        if (g.active && g.state !== STATE.FRIGHTENED)
            g.setState(state);
    });
}
function tick() {
    if (globalFrameHalt > 0) {
        globalFrameHalt--;
    }
    else if (!paused) {
        switch (frameCount++) {
            case 420:
            case 2040:
            case 3540:
            case 5040:
                setGlobalState(STATE.CHASE);
                break;
            case 1620:
            case 3240:
            case 4740:
                setGlobalState(STATE.SCATTER);
                break;
        }
        c.fillStyle = "rgb(0,0,150)";
        c.fillRect(0, 0, canvas.width, canvas.height);
        player.update();
        ghosts.forEach((g) => g.update());
        player.checkCollision();
        TileMap.draw(c);
        player.draw(c);
        ghosts.forEach((g) => g.draw(c));
    }
    window.requestAnimationFrame(tick);
}
tick();
//# sourceMappingURL=index.js.map