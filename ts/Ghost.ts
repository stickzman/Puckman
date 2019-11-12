/// <reference path="helper.ts"/>
class Ghost {
    protected readonly allDirections = [0, 1, 2, 3]

    protected pixPerFrame: number
    protected color = "brown"
    protected direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT
    protected scatterX = 0
    protected scatterY = 0

    debug = false
    dead = true
    state = STATE.CHASE
    targetX: number = 0
    targetY: number = 0
    tileX: number
    tileY: number

    constructor(public x = 13.5 * TILE_SIZE, public y = 14 * TILE_SIZE) {
        this.setSpeed(0.75)
    }

    update() {
        if (this.dead) return
        this.updateTarget()
        this.updateTilePos()
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

    setState(state: STATE) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        if (this.state !== STATE.FRIGHTENED)
            this.direction = this.getOppositeDir(this.direction)
        switch (state) {
            case STATE.FRIGHTENED: this.setSpeed(0.5); break;
            case STATE.SCATTER: {
                this.targetX = this.scatterX
                this.targetY = this.scatterY
            }
            default: this.setSpeed(0.75)
        }
        this.state = state
    }

    protected updateTarget() { }

    protected move() {
        switch (this.direction) {
            case dir.UP: this.y -= this.pixPerFrame; break;
            case dir.DOWN: this.y += this.pixPerFrame; break;
            case dir.LEFT: this.x -= this.pixPerFrame; break;
            case dir.RIGHT: this.x += this.pixPerFrame; break;
        }
    }

    protected updateTilePos() {
        this.tileX = TileMap.toTileSize(this.x)
        this.tileY = TileMap.toTileSize(this.y)
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

    setSpeed(speed: number) {
        speed = Math.min(Math.max(0, speed), 1) // Clamp speed to a percentage
        this.pixPerFrame = speed * MAX_SPEED
    }

    draw(c: CanvasRenderingContext2D) {
        if (this.dead) return
        c.save()
        c.fillStyle = (this.state === STATE.FRIGHTENED) ? "blue" : this.color
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
