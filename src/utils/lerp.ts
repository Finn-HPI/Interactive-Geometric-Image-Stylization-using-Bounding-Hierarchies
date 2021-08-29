export function colorLerp(x: paper.Color, y: paper.Color, a: number){
    return x.multiply(1-a).add(y.multiply(a))
}

export function lerp(x: number, y: number, a: number){
    return x * (1-a) + y * a;
}