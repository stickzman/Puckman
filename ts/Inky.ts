/// <reference path="Ghost.ts"/>
class Inky extends Ghost {
    protected color = "lightblue"
    protected scatterX = 27
    protected scatterY = 35

    private offsetX: number
    private offsetY: number

    constructor(x?: number, y?: number) {
        super(x, y)
        this.updateOffset()
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
