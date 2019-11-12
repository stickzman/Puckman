const TILE_SIZE = 16;
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
        this.debug = false;
        this.dead = true;
        this.state = STATE.CHASE;
        this.targetX = 0;
        this.targetY = 0;
        this.setSpeed(0.75);
    }
    update() {
        if (this.dead)
            return;
        this.updateTarget();
        this.updateTilePos();
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
    setState(state) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        if (this.state !== STATE.FRIGHTENED)
            this.direction = this.getOppositeDir(this.direction);
        switch (state) {
            case STATE.FRIGHTENED:
                this.setSpeed(0.5);
                break;
            case STATE.SCATTER: {
                this.targetX = this.scatterX;
                this.targetY = this.scatterY;
            }
            default: this.setSpeed(0.75);
        }
        this.state = state;
    }
    updateTarget() { }
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
        this.tileX = TileMap.toTileSize(this.x);
        this.tileY = TileMap.toTileSize(this.y);
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
        speed = Math.min(Math.max(0, speed), 1); // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED;
    }
    draw(c) {
        if (this.dead)
            return;
        c.save();
        c.fillStyle = (this.state === STATE.FRIGHTENED) ? "blue" : this.color;
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
    constructor(x, y) {
        super(x, y);
        this.color = "red";
        this.scatterX = 24;
        this.scatterY = 1;
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
        this.updateOffset();
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
        this.debug = false;
        this.direction = dir.LEFT;
        this.desiredDirection = this.direction;
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
                //Don't move this frame if they ate a dot
                if (--TileMap.totalDots <= 0) {
                    console.log("You Win!!");
                    this.direction = null;
                }
                if (tile === 2)
                    this.frameHalt = 1;
                else if (tile === 3)
                    this.frameHalt = 3;
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
        if (this.frameHalt > 0) {
            this.frameHalt--;
        }
        else {
            this.move(); // Update x, y pixel position
        }
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
        TileMap.totalDots = 244;
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
TileMap.totalDots = 244;
/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const player = new Player();
let blinky, pinky, inky, clyde;
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
];
blinky.dead = false;
setTimeout(() => pinky.dead = false, 1000);
setTimeout(() => inky.dead = false, 2000);
setTimeout(() => clyde.dead = false, 3000);
window.addEventListener("keydown", (e) => {
    if (e.key === "w" || e.key === "ArrowUp")
        player.desiredDirection = dir.UP;
    if (e.key === "a" || e.key === "ArrowLeft")
        player.desiredDirection = dir.LEFT;
    if (e.key === "s" || e.key === "ArrowDown")
        player.desiredDirection = dir.DOWN;
    if (e.key === "d" || e.key === "ArrowRight")
        player.desiredDirection = dir.RIGHT;
});
function setState(state) {
    ghosts.forEach((g) => g.setState(state));
}
function draw() {
    c.fillStyle = "blue";
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    ghosts.forEach((g) => g.update());
    TileMap.draw(c);
    player.draw(c);
    ghosts.forEach((g) => g.draw(c));
    window.requestAnimationFrame(draw);
}
draw();
//# sourceMappingURL=index.js.map