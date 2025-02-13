/// <reference path="helper.ts"/>
/// <reference path="TileMap.ts" />
/// <reference path="Player.ts" />
/// <reference path="Ghost.ts"/>
/// <reference path="Blinky.ts"/>
/// <reference path="Pinky.ts"/>
/// <reference path="Inky.ts"/>
/// <reference path="Clyde.ts"/>
const canvas = <HTMLCanvasElement>document.getElementById("canvas")
canvas.height = 36 * C_TILE_SIZE
canvas.width = 28 * C_TILE_SIZE
const c = canvas.getContext("2d")
//Adjust UI to TILE_SIZE
const body = document.querySelector("body")
body.style.fontSize = TILE_SIZE + "px"
const miniScore = <HTMLElement>document.querySelector(".miniScore")
const readyLabel = <HTMLElement>document.querySelector(".ready")
const levelElem = <HTMLElement>document.querySelector(".level")
const scoreLabel = <HTMLElement>document.querySelector(".scoreLabel")
const scoreElem = <HTMLElement>document.querySelector(".score")
const highscoreLabel = <HTMLElement>document.querySelector(".highscoreLabel")
const highscoreElem = <HTMLElement>document.querySelector(".highscore")
try {
    highscoreElem.textContent = localStorage.getItem("highscore") || "0"
} catch (e) {
    console.error(e)
}
let highscore = parseInt(highscoreElem.textContent)

let statePatterns = {CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740]}
let level = 1
let globalState = STATE.SCATTER
let score = 0
let frameCount = 0
let globalFrameHalt = 0
let paused = false
let resetReq = true
let running = false
let lastTimestamp: number
let deltaTime = 0;
const frameTime = 1000/60
const player = new Player()
let blinky: Blinky, pinky: Pinky, inky: Inky, clyde: Clyde
const ghosts = [
    blinky = new Blinky(),
    pinky = new Pinky(),
    inky = new Inky(),
    clyde = new Clyde()
]

let gamepadIndex = -1
function pollGamepadStart() {
    if (running) return
    if (gamepadIndex > -1) {
        const gamepad = navigator.getGamepads()[gamepadIndex]
        if (gamepad.buttons.some(b => b.pressed)) {
            resetGame()
            return
        }
    }
    requestAnimationFrame(pollGamepadStart)
}
pollGamepadStart()
const overlayScreen = <HTMLElement>document.querySelector(".gameOverScreen")
const overlayText = <HTMLElement>document.querySelector(".gameOverText")
let startGameIntCount = 0
const startGameInt = setInterval(() => {
    switch (++startGameIntCount) {
        case 0: {
            overlayText.textContent = "PUSH START!";
            overlayText.style.display = "block";
            break;
        }
        case 1: overlayText.style.display = "none"; break;
        case 2: {
            overlayText.textContent = "PRESS ENTER!";
            overlayText.style.display = "block";
            break;
        }
        case 3: overlayText.style.display = "none"; startGameIntCount = -1; break;

    }
}, 1000)

window.addEventListener("keydown", (e) => {
    if (running) {
        if (e.key === "Enter" || e.key === "Escape") togglePause()
        if (e.key === "w" || e.key === "ArrowUp") player.desiredDirection = dir.UP
        if (e.key === "a" || e.key === "ArrowLeft") player.desiredDirection = dir.LEFT
        if (e.key === "s" || e.key === "ArrowDown") player.desiredDirection = dir.DOWN
        if (e.key === "d" || e.key === "ArrowRight") player.desiredDirection = dir.RIGHT
    } else if (e.key === "Enter" || e.key === " ")  {
        resetGame()
    }
})

window.addEventListener("resize", () => {
    //Adjust UI font-size
    body.style.fontSize = (canvas.offsetHeight/36) + "px"
    C_TILE_SIZE = Math.floor(Math.min(window.innerHeight/36, window.innerWidth/28))
    canvas.height = 36 * C_TILE_SIZE
    canvas.width = 28 * C_TILE_SIZE
})

window.addEventListener("beforeunload", () => {
    try {
        localStorage.setItem("highscore", highscore.toString())
    } catch (e) {
        console.error(e)
    }
})

window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
    gamepadIndex = e.gamepad.index
})

let touchX: number
let touchY: number
window.addEventListener("touchstart", (e) => {
    if (!running) resetGame()
    let touch = e.touches[0]
    touchX = touch.clientX
    touchY = touch.clientY
})

window.addEventListener("touchmove", (e) => {
    if (!running) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchX
    const deltaY = touch.clientY - touchY
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            player.desiredDirection = dir.RIGHT
        } else {
            player.desiredDirection = dir.LEFT
        }
    } else {
        if (deltaY > 0) {
            player.desiredDirection = dir.DOWN
        } else {
            player.desiredDirection = dir.UP
        }
    }
})

let miniScoreTimeout: number
function setMiniScore(points: number, x: number, y: number) {
		if (miniScoreTimeout !== undefined) clearTimeout(miniScoreTimeout)
		miniScore.textContent = points.toString()
		miniScore.style.top = (y/canvas.height*100+0.5).toString() + "%"
		miniScore.style.left = (x/canvas.width*100).toString() + "%"
		miniScore.style.display = "block"
		miniScoreTimeout = setTimeout(() => miniScore.style.display = "none", 1500)
}

function flashUIElem(elem: HTMLElement, msDuration: number) {
		elem.style.display = "none";
		let i = 0
		const flashInt = setInterval(() => {
				switch(++i) {
						case 1: elem.style.display = "block"; break;
						case 2: elem.style.display = "none"; i = 0; break;
				}
		}, 300)
		setTimeout(() => {
				elem.style.display = "block"
				clearInterval(flashInt)
		}, msDuration)
}

function togglePause() {
    paused = !paused
    if (paused) {
        overlayText.textContent = "PAUSED"
        overlayText.style.display = "block"
        overlayScreen.style.display = "block"
    } else {
        overlayScreen.style.display = "none"
    }
}

let startBtnPressed = false
function updateGamepadControls(gamepad: Gamepad) {
    const buttons = gamepad.buttons

    if (!startBtnPressed && buttons[9].pressed) togglePause()
    startBtnPressed = buttons[9].pressed

    if (buttons[12].pressed) player.desiredDirection = dir.UP
    else if (buttons[13].pressed) player.desiredDirection = dir.DOWN
    else if (buttons[14].pressed) player.desiredDirection = dir.LEFT
    else if (buttons[15].pressed) player.desiredDirection = dir.RIGHT
    // Get active analogue stick
    const deadzone = 0.8
    let xAxis: number, yAxis: number
    if (Math.hypot(gamepad.axes[0], gamepad.axes[1]) >= deadzone) {
        xAxis = gamepad.axes[0]
        yAxis = gamepad.axes[1]
    } else if (Math.hypot(gamepad.axes[2], gamepad.axes[3]) >= deadzone) {
        xAxis = gamepad.axes[2]
        yAxis = gamepad.axes[3]
    } else {
        return
    }
    if (Math.abs(xAxis) > Math.abs(yAxis)) {
        if (xAxis < 0) {
            player.desiredDirection = dir.LEFT
        } else {
            player.desiredDirection = dir.RIGHT
        }
    } else {
        if (yAxis < 0) {
            player.desiredDirection = dir.UP
        } else {
            player.desiredDirection = dir.DOWN
        }
    }
}

function levelWin() {
    globalFrameHalt = Infinity // Pause game until flashing concludes
    setTimeout(() => {
        let i = 0
        const interval = setInterval(() => {
            draw((++i % 2 === 0) ? "rgb(0,0,150)" : "rgb(150,150,150)")
        }, 175)
        setTimeout(() => {
            setLevel(level+1)
            clearInterval(interval)
            globalFrameHalt = 0 // Resume game
        }, 1500)
    }, 1500)
}

function setLevel(l: number) {
		levelElem.textContent = l.toString()
    level = l
    if (level === 1) {
        statePatterns = {CHASE: [420, 2040, 3540, 5040], SCATTER: [1620, 3240, 4740]}
    } else if (level <= 4) {
        statePatterns = {CHASE: [420, 2040, 3540, 65521], SCATTER: [1620, 3240, 65520]}
    } else {
        statePatterns = {CHASE: [300, 1800, 3300, 65521], SCATTER: [1500, 3000, 65520]}
    }
    TileMap.reset()
    resetReq = true
}

function setGlobalState(state: STATE) {
    globalState = state
    ghosts.forEach((g) => {
        if (g.active && g.state !== STATE.FRIGHTENED) g.setState(state)
    })
}

function addPoints(points: number) {
		const pointBonus = 10000
    if (Math.floor(score/pointBonus) !== Math.floor((score+points)/pointBonus)) {
				flashUIElem(scoreElem, 3000)
				flashUIElem(scoreLabel, 3000)
				player.lives++
		}
		if (score < highscore && score+points >= highscore) {
				flashUIElem(highscoreElem, 3000)
				flashUIElem(highscoreLabel, 3000)
		}
    score += points
    scoreElem.textContent = score.toString()
    if (score > highscore) {
        highscore = score
        highscoreElem.textContent = score.toString()
    }
}

function resetGame() {
    if (startGameInt !== undefined) clearInterval(startGameInt)
    overlayScreen.style.display = "none"
    score = 0
    player.lives = 3
    scoreElem.textContent = score.toString()
    setLevel(1)
    if (!running) {
        running = true
		lastTimestamp = performance.now()
		window.requestAnimationFrame(tick)
    }
}

function resetAll() {
    readyLabel.style.display = "block"
    setTimeout(() => { readyLabel.style.display = "none" }, 2000)
    setGlobalState(STATE.SCATTER)
    player.reset()
    ghosts.forEach((g) => g.reset())
    frameCount = 0
    resetReq = false
	lastTimestamp = performance.now()
}

function tick(timestamp: DOMHighResTimeStamp) {
    if (!running) return
    
	deltaTime += timestamp - lastTimestamp
	lastTimestamp = timestamp
	while (deltaTime >= frameTime) {
		incFrame()
		deltaTime -= frameTime
	}

    window.requestAnimationFrame(tick)
}

function incFrame() {
	// Check Gamepad controls
	if (gamepadIndex > -1) updateGamepadControls(navigator.getGamepads()[gamepadIndex])

	if (paused) {
		// Do nothing if paused
	} else if (globalFrameHalt > 0) {
		globalFrameHalt--
	} else if (resetReq) {
		resetAll()
		globalFrameHalt = 120
		draw()
	} else {
		frameCount++
		if (statePatterns.CHASE.includes(frameCount)) setGlobalState(STATE.CHASE)
		else if (statePatterns.SCATTER.includes(frameCount)) setGlobalState(STATE.SCATTER)

		player.update()
		ghosts.forEach((g) => g.update())
		if (!resetReq) {
			// If the player didn't hit anything, check again
			player.checkCollision()
			draw()
		}
	}
}

function draw(bkgColor = "rgb(0,0,150)") {
    c.fillStyle = bkgColor
    c.fillRect(0, 0, canvas.width, canvas.height)
    TileMap.draw(c)

    //Draw UI Bars
    c.fillStyle = "#000"
    c.fillRect(0, 0, 28*C_TILE_SIZE, 3*C_TILE_SIZE)
    c.fillRect(0, 34*C_TILE_SIZE, 28*C_TILE_SIZE, 2*C_TILE_SIZE)

    //Draw monster pen exit
    c.fillRect(13.5*C_TILE_SIZE, 15*C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE)
    c.fillStyle = "#e2cba9"
    c.fillRect(13.5*C_TILE_SIZE, 15.25*C_TILE_SIZE, C_TILE_SIZE, C_TILE_SIZE/2)

    player.draw(c)
    ghosts.forEach((g) => g.draw(c))
}
