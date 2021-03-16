export function cnorm(value) {
    const [x, y] = value;
    return Math.sqrt(x * x + y * y);
}
export function clog(value) {
    const [x, y] = value;
    let a = Math.log(cnorm(value));
    let b = Math.atan2(x, y);
    return [a, b];
}
//# sourceMappingURL=complex.js.map