/// <reference path="Ghost.ts"/>
class Pinky extends Ghost {
    protected color = "#feb8fe"
    protected scatterX = 4
    protected scatterY = 1

    constructor() {
        super()
        this.reset()
    }

    updateTarget() {
        if (this.state === STATE.CHASE) {
            switch (player.direction) {
                case dir.UP: {
                    this.targetX = player.tileX
                    this.targetY = player.tileY - 4
                    break
                }
                case dir.DOWN: {
                    this.targetX = player.tileX
                    this.targetY = player.tileY + 4
                    break
                }
                case dir.LEFT: {
                    this.targetX = player.tileX - 4
                    this.targetY = player.tileY
                    break
                }
                case dir.RIGHT: {
                    this.targetX = player.tileX + 4
                    this.targetY = player.tileY
                    break
                }
            }
        }
    }
}
