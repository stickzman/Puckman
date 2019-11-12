/// <reference path="Ghost.ts"/>
class Blinky extends Ghost {
    protected color = "red"
    protected scatterX = 24
    protected scatterY = 1

    constructor(x?: number, y?: number) {
        super(x, y)
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            this.targetX = player.tileX
            this.targetY = player.tileY
        }
    }
}
