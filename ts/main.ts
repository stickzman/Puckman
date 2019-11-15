/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = <HTMLCanvasElement>document.getElementById("canvas")
canvas.height = 36 * TILE_SIZE
canvas.width = 28 * TILE_SIZE
const c = canvas.getContext("2d")

let globalState = STATE.SCATTER
let score = 0
let frameCount = 0
let globalFrameHalt = 0
let paused = false
let resetReq = true
const player = new Player()
let blinky: Blinky, pinky: Pinky, inky: Inky, clyde: Clyde
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
]

window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") paused = !paused
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

function addPoints(points: number) {
    if (Math.floor(score/10000) !== Math.floor((score+points)/10000)) player.lives++
    score += points
}

function resetAll() {
    setGlobalState(STATE.SCATTER)
    player.reset()
    ghosts.forEach((g) => g.reset())
    frameCount = 0
    resetReq = false
}

function tick() {
    if (globalFrameHalt > 0) {
        globalFrameHalt--
    } else if (!paused) {
        if (resetReq) {
            resetAll()
            globalFrameHalt = 90
        }
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

        c.fillStyle = "rgb(0,0,150)"
        c.fillRect(0, 0, canvas.width, canvas.height)

        player.update()
        ghosts.forEach((g) => g.update())
        // If the player didn't hit anything, check again
        if (!resetReq) player.checkCollision()

        TileMap.draw(c)

        //Draw UI Bars
        c.fillStyle = "#000"
        c.fillRect(0, 0, 28*TILE_SIZE, 3*TILE_SIZE)
        c.fillRect(0, 34*TILE_SIZE, 28*TILE_SIZE, 2*TILE_SIZE)

        //Draw monster pen exit
        c.fillRect(13.5*TILE_SIZE, 15*TILE_SIZE, TILE_SIZE, TILE_SIZE)
        c.fillStyle = "#e2cba9"
        c.fillRect(13.5*TILE_SIZE, 15.25*TILE_SIZE, TILE_SIZE, TILE_SIZE/2)

        player.draw(c)
        ghosts.forEach((g) => g.draw(c))
    }

    window.requestAnimationFrame(tick)
}
tick()
