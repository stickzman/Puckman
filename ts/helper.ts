const TILE_SIZE = 16
const MAX_SPEED = TILE_SIZE * 0.16
enum dir {
    UP,
    LEFT,
    DOWN,
    RIGHT
}
enum STATE {
    CHASE,
    SCATTER,
    FRIGHTENED,
    EATEN
}
function shuffle(arr: any[]): any[] {
    const array = arr.slice()
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i)
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array
}
