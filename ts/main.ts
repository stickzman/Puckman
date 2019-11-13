/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = <HTMLCanvasElement>document.getElementById("canvas")
const c = canvas.getContext("2d")

let globalState = STATE.SCATTER
let frameCount = 0
const player = new Player()
let blinky: Blinky, pinky: Pinky, inky: Inky, clyde: Clyde
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
]

window.addEventListener("keydown", (e) => {
    if (e.key === "w" || e.key === "ArrowUp") player.desiredDirection = dir.UP
    if (e.key === "a" || e.key === "ArrowLeft") player.desiredDirection = dir.LEFT
    if (e.key === "s" || e.key === "ArrowDown") player.desiredDirection = dir.DOWN
    if (e.key === "d" || e.key === "ArrowRight") player.desiredDirection = dir.RIGHT
})

function setGlobalState(state: STATE) {
    globalState = state
    ghosts.forEach((g) => {
        if (g.active && g.state !== STATE.FRIGHTENED) g.setState(state)
    })
}

function tick() {
    switch (frameCount++) {
        case 420:
        case 2040:
        case 3540:
        case 5040:
            setGlobalState(STATE.CHASE)
            break
        case 1620:
        case 3240:
        case 4740:
            setGlobalState(STATE.SCATTER)
            break
    }

    c.fillStyle = "blue"
    c.fillRect(0, 0, canvas.width, canvas.height)

    player.update()
    ghosts.forEach((g) => g.update())

    TileMap.draw(c)
    player.draw(c)
    ghosts.forEach((g) => g.draw(c))

    window.requestAnimationFrame(tick)
}
tick()
