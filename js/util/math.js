//calculate product of matrix
function matrixProduct4x4(inMax1, inMax2) {
    let outMax = [0, 0, 0, 0];
    outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
    outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
    outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
    outMax[3] = inMax1[3][0] * inMax2[0] + inMax1[3][1] * inMax2[1] + inMax1[3][2] * inMax2[2] + inMax1[3][3] * inMax2[3];
    return outMax;
}

function matrixProduct3x4(inMax1, inMax2) {
    let outMax = [0, 0, 0];
    outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
    outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
    outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
    return outMax;
}

function matrixProduct3x3(matrixOne, matrixTwo) {
    let matrixOut = [0, 0, 0];
    matrixOut[0] = matrixOne[0][0] * matrixTwo[0] + matrixOne[0][1] * matrixTwo[1] + matrixOne[0][2] * matrixTwo[2];
    matrixOut[1] = matrixOne[1][0] * matrixTwo[0] + matrixOne[1][1] * matrixTwo[1] + matrixOne[1][2] * matrixTwo[2];
    matrixOut[2] = matrixOne[2][0] * matrixTwo[0] + matrixOne[2][1] * matrixTwo[1] + matrixOne[2][2] * matrixTwo[2];
    return matrixOut;
}

