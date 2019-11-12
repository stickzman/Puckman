/// <reference path="Ghost.ts"/>
class Inky extends Ghost {
    protected INIT_COLOR = "lightblue"
    protected color = this.INIT_COLOR

    private offsetX: number
    private offsetY: number

    constructor(x?: number, y?: number) {
        super(x, y)
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
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
            this.targetX = this.offsetX + (this.offsetX - blinky.tileX)
            this.targetY = this.offsetY + (this.offsetY - blinky.tileY)
        } else {
            this.targetX = 27
            this.targetY = 35
        }
    }
}
