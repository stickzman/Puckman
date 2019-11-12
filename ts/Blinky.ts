/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    protected INIT_COLOR = "red"
    protected color = this.INIT_COLOR

    constructor(x?: number, y?: number) {
        super(x, y)
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        } else {
            this.targetX = 24
            this.targetY = 1
        }
    }
}
