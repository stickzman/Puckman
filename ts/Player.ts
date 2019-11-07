class Player {
    debug = false
    private color = "yellow"
    private direction = dir.LEFT
    desiredDirection = this.direction
    tileX: number;
    tileY: number;

    constructor(public x = 13.5 * TILE_SIZE, public y = 26 * TILE_SIZE,
                    private pixPerStep = 1.33) {
        this.updateTilePos()
    }

    update() {
        // Update game tile x, y position
        if (this.updateTilePos()) {
            if (TileMap.getTile(this.tileX, this.tileY) > 1) {
                TileMap.setTile(this.tileX, this.tileY, 1)
            }
        }
        // Check if we're at the tile's midpoint
        if (this.x % TILE_SIZE < this.pixPerStep && this.y % TILE_SIZE < this.pixPerStep) {
            // Update direction
            if (this.directionPossible(this.desiredDirection)) {
                this.direction = this.desiredDirection
            } else if (!this.directionPossible(this.direction)) {
                this.direction = null
            }
        }
        this.move() // Update x, y pixel position
    }

    private directionPossible(direction: number): boolean {
        switch (direction) {
            case dir.UP: return TileMap.getTile(this.tileX, this.tileY - 1) > 0
            case dir.DOWN: return TileMap.getTile(this.tileX, this.tileY + 1) > 0
            case dir.LEFT:  return TileMap.getTile(this.tileX - 1, this.tileY) > 0
            case dir.RIGHT: return TileMap.getTile(this.tileX + 1, this.tileY) > 0
        }
    }

    private updateTilePos() {
        const oldX = this.tileX
        this.tileX = TileMap.toTileSize(this.x)
        const oldY = this.tileY
        this.tileY = TileMap.toTileSize(this.y)
        //Check if we've entered a new tile
        return (this.tileX !== oldX || this.tileY !== oldY)
    }

    private move() {
        switch (this.direction) {
            case dir.UP: this.y -= this.pixPerStep; break;
            case dir.DOWN: this.y += this.pixPerStep; break;
            case dir.LEFT: this.x -= this.pixPerStep; break;
            case dir.RIGHT: this.x += this.pixPerStep; break;
        }
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        c.fillStyle = this.color
        c.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE)
        if (this.debug) {
            c.strokeStyle = "red"
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
        c.restore()
    }
}
