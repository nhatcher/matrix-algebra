export function matrixToLatex(A, N, prec = 15) {
    let mat = [];
    for (let i = 0; i < N; i++) {
        let line = [];
        for (let j = 0; j < N; j++) {
            const val = parseFloat(A[i + N * j].toFixed(prec));
            line.push(`${val}`);
        }
        mat.push(line.join(' & '));
    }
    return '\\begin{pmatrix}' + mat.join('\\\\') + '\\end{pmatrix}';
}
;
//# sourceMappingURL=util.js.map