/// <reference path="Ghost.ts"/>
class Inky extends Ghost {
    protected color = "lightblue"
    protected scatterX = 27
    protected scatterY = 35
    protected waitX = 11.5
    dotLimit = 30

    private offsetX: number
    private offsetY: number

    constructor() {
        super()
        this.reset()
        this.updateOffset()
    }

    incDotCount() {
        if (this.state === STATE.WAITING
            && pinky.state !== STATE.WAITING)
                this.dotCount++
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.updateOffset()
            this.targetX = this.offsetX + (this.offsetX - blinky.tileX)
            this.targetY = this.offsetY + (this.offsetY - blinky.tileY)
        }
    }

    private updateOffset() {
        switch (player.direction) {
            case dir.UP: {
                this.offsetX = player.tileX
                this.offsetY = player.tileY - 2
                break
            }
            case dir.DOWN: {
                this.offsetX = player.tileX
                this.offsetY = player.tileY + 2
                break
            }
            case dir.LEFT: {
                this.offsetX = player.tileX - 2
                this.offsetY = player.tileY
                break
            }
            case dir.RIGHT: {
                this.offsetX = player.tileX + 2
                this.offsetY = player.tileY
                break
            }
        }
    }
}
