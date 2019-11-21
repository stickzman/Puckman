/// <reference path="helper.ts"/>
class Player {
    debug = false
    god = false

    private color = "#ffff00"
    private frameHalt = 0
    private pixPerFrame: number
    private dotLimit = 244

    lives = 3
    direction = dir.RIGHT
    desiredDirection = this.direction
    dotCount: number
    elroy1Limit: number
    elroy2Limit: number
    dotTimer: number
    dotTimerLimit = 240
    ghostsEaten: number
    baseSpeed: number
    boostSpeed: number
    boostFrames = 0
    x: number
    y: number
    tileX: number
    tileY: number

    constructor() {
        this.reset()
    }

    reset() {
        //Speed
        if (level === 1) {
            this.baseSpeed = 0.8
            this.boostSpeed = 0.9
        } else if (level <= 4) {
            this.baseSpeed = 0.9
            this.boostSpeed = 0.95
        } else if (level <= 20) {
            this.baseSpeed = 1
            this.boostSpeed = 1
        } else {
            this.baseSpeed = 0.9
            this.boostSpeed = 1
        }
        //Elroy Dots
        if (level === 1) {
            this.elroy1Limit = 224
            this.elroy2Limit = 234
        } else if (level <= 2) {
            this.elroy1Limit = 214
            this.elroy2Limit = 229
        } else if (level <= 5) {
            this.elroy1Limit = 204
            this.elroy2Limit = 224
        } else if (level <= 8) {
            this.elroy1Limit = 194
            this.elroy2Limit = 219
        } else if (level <= 11) {
            this.elroy1Limit = 184
            this.elroy2Limit = 214
        } else if (level <= 14) {
            this.elroy1Limit = 164
            this.elroy2Limit = 204
        } else if (level <= 18) {
            this.elroy1Limit = 144
            this.elroy2Limit = 194
        } else {
            this.elroy1Limit = 124
            this.elroy2Limit = 184
        }
        this.frameHalt = 0
        this.dotTimer = 0
        this.boostFrames = 0
        this.x = 13.5 * TILE_SIZE
        this.y = 26 * TILE_SIZE
        this.direction = dir.LEFT
        this.setSpeed(this.baseSpeed)
        this.updateTilePos()
    }

    setSpeed(speed: number) {
        speed = Math.max(0, speed) // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED
    }

    update() {
        if (this.boostFrames > 0) {
            if (--this.boostFrames <= 0 || ghosts.every(g => g.state !== STATE.FRIGHTENED)) {
				this.boostFrames = 0
                this.setSpeed(this.baseSpeed)
            }
            else this.setSpeed(this.boostSpeed)
        }
        // Update game tile x, y position
        if (this.updateTilePos()) {
            var tile = TileMap.getTile(this.tileX, this.tileY)
            // Did we eat a dot?
            if (tile > 1) {
                this.dotTimer = 0
                ghosts.forEach((g) => g.incDotCount())
                // Check win
                ++this.dotCount
                if (this.dotCount === this.elroy1Limit) {
                    blinky.setElroy(1)
                } else if (this.dotCount === this.elroy2Limit) {
                    blinky.setElroy(2)
                } else if (this.dotCount >= this.dotLimit) {
                    // You win!
                    levelWin()
                }
                if (tile === 2) {
                    // Small dot
                    addPoints(10)
                    this.frameHalt = 1
                }
                else if (tile === 3) {
                    // Big dot
                    addPoints(50)
                    this.frameHalt = 3
                    this.ghostsEaten = 0
                    this.boostFrames = Ghost.maxFrightenedFrames
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
					const p = Math.pow(2, ++this.ghostsEaten) * 100
					setMiniScore(p, g.x, g.y)
                    addPoints(p)
                    globalFrameHalt = 60
                    g.setState(STATE.EATEN)
                } else if (g.active && !this.god) {
                    if (--this.lives <= 0) {
                        running = false
                        setTimeout(() => {
                            overlayText.textContent = "GAME OVER"
                            overlayScreen.style.display = "block"
                            overlayText.style.display = "block"
                            pollGamepadStart()
                        }, 1666)
                    } else {
                        globalFrameHalt = 100
                        resetReq = true
                    }
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
        c.arc(this.x + (TILE_SIZE/2), this.y + (TILE_SIZE/2), TILE_SIZE*0.6, 0, Math.PI*2)
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
