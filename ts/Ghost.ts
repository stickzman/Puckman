/// <reference path="helper.ts"/>
class Ghost {
    protected readonly allDirections = [0, 1, 2, 3]

    protected color = "brown"
    protected direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT
    protected scatterX = 0
    protected scatterY = 0
    protected homeX = 13
    protected homeY = 14
    protected waitX = 13.5
    protected waitY = 17
    protected dotLimit = 0
    protected dotCount = 0
    protected pixPerFrame: number

    debug = false
    targetX: number = 0
    targetY: number = 0
    tileX: number
    tileY: number
    state: STATE

    constructor(public x = 13.5 * TILE_SIZE, public y = 14 * TILE_SIZE) {
        this.setState(STATE.WAITING)
    }

    update() {
        if (this.state === STATE.WAITING) {
            this.updateWaiting()
            return
        } else if (this.state === STATE.EXITING) {
            if (this.tileY === 14
                    && (this.y + this.pixPerFrame/2) % TILE_SIZE < this.pixPerFrame) {
                this.setState(STATE.CHASE)
            } else {
                this.y -= this.pixPerFrame
                this.updateTilePos()
            }
            return
        }
        this.updateTarget()
        if (this.updateTilePos()) {
            if (this.state === STATE.EATEN
                    && this.tileX === this.homeX
                    && this.tileY === this.homeY) {
                this.setState(STATE.WAITING)
            }
        }
        this.updateSpeed()
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
            this.direction = this.getNextDirection()
        }
        this.move()
    }

    updateWaiting() {
        if (this.dotCount < this.dotLimit ||
            !ghosts.every((g) => g.state !== STATE.EXITING))
                return
        this.dotCount = 0 // Reset the dot counter
        this.setState(STATE.EXITING)
    }

    incDotCount() {
        if (this.state === STATE.WAITING) this.dotCount++
    }

    setState(state: STATE) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        if (this.state !== STATE.FRIGHTENED)
            this.direction = this.getOppositeDir(this.direction)
        switch (state) {
            case STATE.SCATTER: {
                this.targetX = this.scatterX
                this.targetY = this.scatterY
                break
            }
            case STATE.EATEN: {
                this.targetX = this.homeX
                this.targetY = this.homeY
                break
            }
            case STATE.WAITING: {
                this.x = this.waitX * TILE_SIZE
                this.y = this.waitY * TILE_SIZE
                this.updateTilePos()
                break
            }
            case STATE.EXITING: {
                this.x = 13.5 * TILE_SIZE
                this.y = 17 * TILE_SIZE
                this.updateTilePos()
                this.setSpeed(0.3)
                break
            }
        }
        this.state = state
    }

    protected updateTarget() { }

    protected updateSpeed() {
        // Tunnel speed penalty
        if (this.tileY === 17 && (this.tileX < 6 || this.tileX >= 22)) {
            this.setSpeed(0.4)
        } else {
            switch (this.state) {
                case STATE.FRIGHTENED: {
                    this.setSpeed(0.5)
                    break
                }
                case STATE.EATEN: {
                    this.setSpeed(1.5)
                    break
                }
                default: {
                    this.setSpeed(0.75)
                }
            }
        }
    }

    protected move() {
        switch (this.direction) {
            case dir.UP: this.y -= this.pixPerFrame; break;
            case dir.DOWN: this.y += this.pixPerFrame; break;
            case dir.LEFT: this.x -= this.pixPerFrame; break;
            case dir.RIGHT: this.x += this.pixPerFrame; break;
        }
    }

    protected updateTilePos(): boolean {
        const oldX = this.tileX
        this.tileX = TileMap.toTileSize(this.x)
        const oldY = this.tileY
        this.tileY = TileMap.toTileSize(this.y)
        //Check if we've entered a new tile
        return (this.tileX !== oldX || this.tileY !== oldY)
    }

    protected getNextDirection(): number {
        if (this.state === STATE.FRIGHTENED) {
            return this.randomDir()
        } else {
            return this.findBestDir()
        }
    }

    protected findBestDir(): dir {
        // Find opposite direction, as ghosts aren't allowed to turn around
        const oppDir = this.getOppositeDir(this.direction)
        // Find the distance to the target for all directions
        const distances = this.allDirections.map((d) => {
            if (d === oppDir || !this.directionPossible(d)) return Infinity
            //Get the tile x, y
            let x: number, y: number
            switch (d) {
                case dir.UP: {
                    x = this.tileX
                    y = this.tileY - 1
                    break
                }
                case dir.DOWN: {
                    x = this.tileX
                    y = this.tileY + 1
                    break
                }
                case dir.LEFT: {
                    x = this.tileX - 1
                    y = this.tileY
                    break
                }
                case dir.RIGHT: {
                    x = this.tileX + 1
                    y = this.tileY
                    break
                }
            }
            return Math.hypot(this.targetX - x, this.targetY - y)
        })
        // Return the index of the smallest distance. index === direction
        return distances.indexOf(Math.min(...distances))
    }

    protected randomDir(): dir {
        // Find opposite direction, as ghosts aren't allowed to turn around
        const oppDir = (this.direction < 2) ? this.direction + 2 : this.direction - 2
        const dirs = shuffle(this.allDirections)
        for (let i = 0; i < dirs.length; i++) {
            if (dirs[i] === oppDir || !this.directionPossible(dirs[i])) continue;
            return dirs[i]
        }
    }

    protected directionPossible(direction: number): boolean {
        switch (direction) {
            case dir.UP: {
                if (this.tileX >= 12 && this.tileX <= 16
                    && (this.tileY === 14 || this.tileY === 26))
                        return false
                return TileMap.getTile(this.tileX, this.tileY - 1) > 0
            }
            case dir.DOWN: {
                return TileMap.getTile(this.tileX, this.tileY + 1) > 0
            }
            case dir.LEFT: {
                return TileMap.getTile(this.tileX - 1, this.tileY) !== 0
            }
            case dir.RIGHT: {
                return TileMap.getTile(this.tileX + 1, this.tileY) !== 0
            }
        }
    }

    protected getOppositeDir(direction: number): number {
        return (direction < 2) ? direction + 2 : direction - 2
    }

    protected setSpeed(speed: number) {
        // Speed should be a percentage [0-1]
        speed = Math.max(0, speed)
        this.pixPerFrame = speed * MAX_SPEED
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        switch (this.state) {
            case STATE.FRIGHTENED: c.fillStyle = "blue"; break;
            case STATE.EATEN: c.fillStyle = "rgba(0,0,255,0.5)"; break;
            default: c.fillStyle = this.color
        }
        c.fillRect(this.x, this.y, TILE_SIZE, TILE_SIZE)
        if (this.debug) {
            c.strokeStyle = "red"
            c.strokeRect(this.tileX * TILE_SIZE, this.tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            c.strokeStyle = this.color
            c.strokeRect(this.targetX * TILE_SIZE, this.targetY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
        c.restore()
    }
}
