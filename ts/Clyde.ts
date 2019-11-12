/// <reference path="Ghost.ts"/>
class Clyde extends Ghost {
    protected color = "orange"
    protected scatterX = 0
    protected scatterY = 35

    constructor(x?: number, y?: number) {
        super(x, y)
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
