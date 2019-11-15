/// <reference path="Ghost.ts"/>
class Clyde extends Ghost {
    protected color = "#fab852"
    protected scatterX = 0
    protected scatterY = 35
    protected waitX = 15.5
    dotLimit = 60

    constructor() {
        super()
        this.reset()
    }

    reset() {
        super.reset()
        if (level === 1) {
            this.dotLimit = 60
        } else if (level === 2) {
            this.dotLimit = 50
        } else {
            this.dotLimit = 0
        }
    }

    incDotCount() {
        if (this.state === STATE.WAITING
            && pinky.state !== STATE.WAITING
            && inky.state !== STATE.WAITING)
                this.dotCount++
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            if (Math.hypot(player.tileX - this.tileX, player.tileY - this.tileY) > 8) {
                this.targetX = player.tileX
                this.targetY = player.tileY
            } else {
                this.targetX = this.scatterX
                this.targetY = this.scatterY
            }
        }
    }
}
