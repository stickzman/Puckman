/// <reference path="helper.ts"/>
class Player {
    private color = "yellow"
    private frameHalt = 0
    private pixPerFrame: number
    private dotLimit = 244

    debug = false
    god = false
    lives = 3
    direction = dir.LEFT
    desiredDirection = this.direction
    dotCount = 0
    dotTimer = 0
    dotTimerLimit = 240
    tileX: number
    tileY: number

    constructor(public x = 13.5 * TILE_SIZE, public y = 26 * TILE_SIZE, speed = 0.8) {
        this.setSpeed(speed)
        this.updateTilePos()
    }

    setSpeed(speed: number) {
        speed = Math.min(Math.max(0, speed), 1) // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED
    }

    update() {
        // Update game tile x, y position
        if (this.updateTilePos()) {
            var tile = TileMap.getTile(this.tileX, this.tileY)
            if (tile > 1) {
                // Reset dotTimer
                this.dotTimer = 0
                //Don't move this frame if they ate a dot
                ghosts.forEach((g) => g.incDotCount())
                if (++this.dotCount >= this.dotLimit) {
                    console.log("You Win!!")
                    globalFrameHalt = Infinity
                }
                if (tile === 2) {
                    this.frameHalt = 1
                }
                else if (tile === 3) {
                    this.frameHalt = 3
                    ghosts.forEach((g) => g.setState(STATE.FRIGHTENED))
                }
                TileMap.setTile(this.tileX, this.tileY, 1)
            }
        }
        // Check if we're at the tile's midpoint
        if ((this.x + this.pixPerFrame/2) % TILE_SIZE < this.pixPerFrame
                && (this.y + this.pixPerFrame/2) % TILE_SIZE < this.pixPerFrame) {
            // Wrap x-axis
            if (this.tileX < -1 && this.direction === dir.LEFT) {
                this.x = 28 * TILE_SIZE
                this.updateTilePos()
            } else if (this.tileX > 27 && this.direction === dir.RIGHT) {
                this.x = -TILE_SIZE
                this.updateTilePos()
            }
            // Snap to center of tile
            if (this.x > 0) {
                this.x = this.tileX * TILE_SIZE
                this.y = this.tileY * TILE_SIZE
            }
            // Update direction
            if (this.directionPossible(this.desiredDirection)) {
                this.direction = this.desiredDirection
            } else if (!this.directionPossible(this.direction)) {
                this.direction = null
            }
        } else if (Math.abs(this.desiredDirection - this.direction) === 2
                    && this.directionPossible(this.desiredDirection)) {
            // If they're trying to turn around, let them
            this.direction = this.desiredDirection
        }
        this.checkCollision()
        if (this.frameHalt > 0) {
            this.frameHalt--
        } else {
            //If the dot timer hits its limit, reset it and release the next waiting ghost
            if (++this.dotTimer > this.dotTimerLimit) {
                this.dotTimer = 0
                ghosts.some((g) => {
                    if (g.state === STATE.WAITING) {
                        g.setState(STATE.EXITING)
                        return true
                    }
                    return false
                })
            }
            this.move() // Update x, y pixel position
        }
    }

    checkCollision() {
        ghosts.forEach((g) => {
            if (this.tileX === g.tileX && this.tileY === g.tileY) {
                if (g.state === STATE.FRIGHTENED) {
                    globalFrameHalt = 60
                    g.setState(STATE.EATEN)
                } else if (g.active && !this.god) {
                    globalFrameHalt = 120
                }
            }
        })
    }

    private directionPossible(direction: number): boolean {
        switch (direction) {
            case dir.UP: {
                return TileMap.getTile(this.tileX, this.tileY - 1) > 0
            }
            case dir.DOWN: {
                return TileMap.getTile(this.tileX, this.tileY + 1) > 0
            }
            // Allow undefined results on LEFT or RIGHT for x-axis wrapping
            case dir.LEFT: {
                return TileMap.getTile(this.tileX - 1, this.tileY) !== 0
            }
            case dir.RIGHT: {
                return TileMap.getTile(this.tileX + 1, this.tileY) !== 0
            }
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
            case dir.UP: this.y -= this.pixPerFrame; break;
            case dir.DOWN: this.y += this.pixPerFrame; break;
            case dir.LEFT: this.x -= this.pixPerFrame; break;
            case dir.RIGHT: this.x += this.pixPerFrame; break;
        }
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()

        //Draw character
        c.fillStyle = this.color
        c.beginPath()
        c.arc(this.x + (TILE_SIZE/2), this.y + (TILE_SIZE/2), TILE_SIZE/2, 0, Math.PI*2)
        c.fill()

        //Draw lives
        for (let i = 0; i < this.lives; i++) {
            c.beginPath()
            c.arc(2*TILE_SIZE*(i+1), 35 * TILE_SIZE, TILE_SIZE*0.75, 0, Math.PI*2)
            c.fill()
        }


        if (this.debug) {
            c.strokeStyle = "red"
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
        c.restore()
    }
}
