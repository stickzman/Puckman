/// <reference path="helper.ts"/>
class Ghost {
    protected readonly allDirections = [0, 1, 2, 3]

    protected color = "brown"
    protected scatterX = 0
    protected scatterY = 0
    protected homeX = 13
    protected homeY = 14
    protected waitX = 13.5
    protected waitY = 17
    protected dotCount = 0
    protected frightenedFrames = 0
    protected frightenedFlash = false
    protected waitSpeed = 0.3 * MAX_SPEED
    protected direction: dir
    protected pixPerFrame: number

    static maxFrightenedFrames = 720
    debug = false
    active = false
    dotLimit = 0
    baseSpeed = 0.75
    frightenedSpeed = 0.5
    tunnelSpeed = 0.4
    x = 13.5 * TILE_SIZE
    y = 14 * TILE_SIZE
    targetX: number = 0
    targetY: number = 0
    tileX: number
    tileY: number
    state: STATE

    constructor() { }

    reset() {
        // Speed
        if (level === 1) {
            this.baseSpeed = 0.75
            this.frightenedSpeed = 0.5
            this.tunnelSpeed = 0.4
        } else if (level <= 4) {
            this.baseSpeed = 0.85
            this.frightenedSpeed = 0.55
            this.tunnelSpeed = 0.45
        } else if (level <= 20) {
            this.baseSpeed = 0.95
            this.frightenedSpeed = 0.6
            this.tunnelSpeed = 0.5
        } else {
            this.baseSpeed = 0.95
            this.frightenedSpeed = 0.6
            this.tunnelSpeed = 0.5
        }
        // Fright Frames
        switch (level) {
            case 1: Ghost.maxFrightenedFrames = 6*60; break;
            case 2:
            case 6:
            case 10: Ghost.maxFrightenedFrames = 5*60; break;
            case 3: Ghost.maxFrightenedFrames = 4*60; break;
            case 4:
            case 14:Ghost.maxFrightenedFrames = 3*60; break;
            case 5:
            case 7:
            case 11:
            case 8: Ghost.maxFrightenedFrames = 2*60; break;
            case 9:
            case 12:
            case 13:
            case 15:
            case 16:
            case 18: Ghost.maxFrightenedFrames = 1*60; break;
            default: Ghost.maxFrightenedFrames = 0;
        }
        this.dotCount = 0
        this.direction = (Math.random() < 0.5) ? dir.LEFT : dir.RIGHT
        this.setState(STATE.WAITING)
    }

    update() {
        if (this.state === STATE.FRIGHTENED && --this.frightenedFrames <= 0) {
            this.setState(globalState)
        } else if (this.state === STATE.WAITING) {
            this.updateWaiting()
            return
        } else if (this.state === STATE.EXITING) {
            if (this.tileY === 14
                    && (this.y + this.pixPerFrame/2) % TILE_SIZE < this.pixPerFrame) {
                this.setState(globalState)
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
        if ((this.y + Math.abs(this.waitSpeed)/2) % TILE_SIZE < Math.abs(this.waitSpeed)) {
            if (this.tileY === 16) this.waitSpeed = Math.abs(this.waitSpeed)
            if (this.tileY === 18) this.waitSpeed = -1*Math.abs(this.waitSpeed)
        }
        this.y += this.waitSpeed
        this.updateTilePos()
        if (this.dotCount >= this.dotLimit
                && ghosts.every((g) => g.state !== STATE.EXITING)) {
            this.dotCount = 0 // Reset the dot counter
            this.setState(STATE.EXITING)
        }
    }

    incDotCount() {
        if (this.state === STATE.WAITING) this.dotCount++
    }

    setState(state: STATE) {
        // If we're not transitioning from "FRIGHTENED" state, reverse direction
        switch (state) {
            case STATE.FRIGHTENED: {
                if (!this.active) return
                this.frightenedFrames = Ghost.maxFrightenedFrames
                break
            }
            case STATE.CHASE: {
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction)
                break
            }
            case STATE.SCATTER: {
                if (this.state !== STATE.FRIGHTENED)
                    this.direction = this.getOppositeDir(this.direction)
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
        this.active = state === STATE.CHASE || state === STATE.SCATTER || state === STATE.FRIGHTENED
        this.state = state
    }

    protected updateTarget() { }

    protected updateSpeed() {
        // Tunnel speed penalty
        if (this.tileY === 17 && (this.tileX < 6 || this.tileX >= 22)) {
            this.setSpeed(this.tunnelSpeed)
        } else {
            switch (this.state) {
                case STATE.FRIGHTENED: {
                    this.setSpeed(this.frightenedSpeed)
                    break
                }
                case STATE.EATEN: {
                    this.setSpeed(1.5)
                    break
                }
                default: {
                    this.setSpeed(this.baseSpeed)
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
            case STATE.FRIGHTENED: {
                if (this.frightenedFrames < Ghost.maxFrightenedFrames/3) {
                    if (frameCount % 10 === 0)
                        this.frightenedFlash = !this.frightenedFlash
                } else {
                    this.frightenedFlash = false
                }
                c.fillStyle = (this.frightenedFlash) ? "#fff" : "blue"
                break
            }
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
