/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    protected color = "#fc0000"
    protected scatterX = 24
    protected scatterY = 1
    private elroy = 0

    constructor() {
        super()
        this.reset()
    }

    setElroy(e: number) {
        this.elroy = e
        if (this.state === STATE.SCATTER) this.setState(STATE.CHASE)
    }

    reset() {
        super.reset()
        this.elroy = 0
        this.x = 13.5 * TILE_SIZE
        this.y = 14 * TILE_SIZE
        this.setState(globalState)
        this.updateTilePos()
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        }
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
                if (this.elroy) return
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
                    if (this.elroy === 1) {
                        this.setSpeed(this.baseSpeed + 0.05)
                    } else if (this.elroy === 2) {
                        this.setSpeed(this.baseSpeed + 0.1)
                    } else {
                        this.setSpeed(this.baseSpeed)
                    }
                }
            }
        }
    }
}
