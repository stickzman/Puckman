var Player = /** @class */ (function () {
    function Player(x, y, speed) {
        if (x === void 0) { x = 13.5 * TILE_SIZE; }
        if (y === void 0) { y = 26 * TILE_SIZE; }
        if (speed === void 0) { speed = 2; }
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.debug = false;
        this.color = "yellow";
        this.direction = dir.LEFT;
        this.desiredDirection = this.direction;
        this.updateTilePos();
    }
    Player.prototype.update = function () {
        this.move(); // Update x, y pixel position
        // Update game tile x, y position
        if (this.updateTilePos()) {
            if (TileMap.getTile(this.tileX, this.tileY) > 1) {
                TileMap.setTile(this.tileX, this.tileY, 1);
            }
        }
        // Check if we're at the tile's midpoint
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            // Update direction
            if (this.directionPossible(this.desiredDirection)) {
                this.direction = this.desiredDirection;
            }
            else if (!this.directionPossible(this.direction)) {
                this.direction = null;
            }
        }
    };
    Player.prototype.directionPossible = function (direction) {
        switch (direction) {
            case dir.UP: return TileMap.getTile(this.tileX, this.tileY - 1) > 0;
            case dir.DOWN: return TileMap.getTile(this.tileX, this.tileY + 1) > 0;
            case dir.LEFT: return TileMap.getTile(this.tileX - 1, this.tileY) > 0;
            case dir.RIGHT: return TileMap.getTile(this.tileX + 1, this.tileY) > 0;
        }
    };
    Player.prototype.updateTilePos = function () {
        var oldX = this.tileX;
        this.tileX = TileMap.toTileSize(this.x);
        var oldY = this.tileY;
        this.tileY = TileMap.toTileSize(this.y);
        //Check if we've entered a new tile
        return (this.tileX !== oldX || this.tileY !== oldY);
    };
    Player.prototype.move = function () {
        switch (this.direction) {
            case dir.UP:
                this.y -= this.speed;
                break;
            case dir.DOWN:
                this.y += this.speed;
                break;
            case dir.LEFT:
                this.x -= this.speed;
                break;
            case dir.RIGHT:
                this.x += this.speed;
                break;
        }
    };
    Player.prototype.draw = function (c) {
        c.save();
        c.fillStyle = this.color;
        c.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE);
        if (this.debug) {
            c.strokeStyle = "red";
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
        c.restore();
    };
    return Player;
}());
var TileMap = /** @class */ (function () {
    function TileMap() {
    }
    TileMap.toTileSize = function (x) {
        return Math.round(x / TILE_SIZE);
    };
    TileMap.getTileAtPix = function (x, y) {
        return this.map[this.toTileSize(y)][this.toTileSize(x)];
    };
    TileMap.getTile = function (x, y) {
        return this.map[y][x];
    };
    TileMap.setTile = function (x, y, val) {
        this.map[y][x] = val;
    };
    TileMap.draw = function (ctx) {
        ctx.save();
        this.map.forEach(function (row, tileJ) {
            row.forEach(function (tile, tileI) {
                if (!tile)
                    return;
                ctx.fillStyle = "grey";
                ctx.fillRect(tileI * TILE_SIZE, tileJ * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = "white";
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
    };
    TileMap.map = [
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
    return TileMap;
}());
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
var TILE_SIZE = 16;
var dir = {
    "UP": 0,
    "DOWN": 1,
    "LEFT": 2,
    "RIGHT": 3
};
var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");
var player = new Player();
window.addEventListener("keydown", function (e) {
    if (e.key === "w" || e.key === "ArrowUp")
        player.desiredDirection = dir.UP;
    if (e.key === "a" || e.key === "ArrowLeft")
        player.desiredDirection = dir.LEFT;
    if (e.key === "s" || e.key === "ArrowDown")
        player.desiredDirection = dir.DOWN;
    if (e.key === "d" || e.key === "ArrowRight")
        player.desiredDirection = dir.RIGHT;
});
function draw() {
    c.fillStyle = "black";
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    TileMap.draw(c);
    player.draw(c);
    window.requestAnimationFrame(draw);
}
draw();
//# sourceMappingURL=index.js.map