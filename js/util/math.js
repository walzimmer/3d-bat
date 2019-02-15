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


// Returns the inverse of matrix `M`.
function matrixInvert(M) {
    // I use Guassian Elimination to calculate the inverse:
    // (1) 'augment' the matrix (left) by the identity (on the right)
    // (2) Turn the matrix on the left into the identity by elemetry row ops
    // (3) The matrix on the right is the inverse (was the identity matrix)
    // There are 3 elemtary row ops: (I combine b and c in my code)
    // (a) Swap 2 rows
    // (b) Multiply a row by a scalar
    // (c) Add 2 rows

    //if the matrix isn't square: exit (error)
    if (M.length !== M[0].length) {
        return;
    }

    //create the identity matrix (I), and a copy (C) of the original
    var i = 0, ii = 0, j = 0, dim = M.length, e = 0, t = 0;
    var I = [], C = [];
    for (i = 0; i < dim; i += 1) {
        // Create the row
        I[I.length] = [];
        C[C.length] = [];
        for (j = 0; j < dim; j += 1) {

            //if we're on the diagonal, put a 1 (for identity)
            if (i == j) {
                I[i][j] = 1;
            }
            else {
                I[i][j] = 0;
            }

            // Also, make the copy of the original
            C[i][j] = M[i][j];
        }
    }

    // Perform elementary row operations
    for (i = 0; i < dim; i += 1) {
        // get the element e on the diagonal
        e = C[i][i];

        // if we have a 0 on the diagonal (we'll need to swap with a lower row)
        if (e == 0) {
            //look through every row below the i'th row
            for (ii = i + 1; ii < dim; ii += 1) {
                //if the ii'th row has a non-0 in the i'th col
                if (C[ii][i] != 0) {
                    //it would make the diagonal have a non-0 so swap it
                    for (j = 0; j < dim; j++) {
                        e = C[i][j];       //temp store i'th row
                        C[i][j] = C[ii][j];//replace i'th row by ii'th
                        C[ii][j] = e;      //repace ii'th by temp
                        e = I[i][j];       //temp store i'th row
                        I[i][j] = I[ii][j];//replace i'th row by ii'th
                        I[ii][j] = e;      //repace ii'th by temp
                    }
                    //don't bother checking other rows since we've swapped
                    break;
                }
            }
            //get the new diagonal
            e = C[i][i];
            //if it's still 0, not invertable (error)
            if (e == 0) {
                return
            }
        }

        // Scale this row down by e (so we have a 1 on the diagonal)
        for (j = 0; j < dim; j++) {
            C[i][j] = C[i][j] / e; //apply to original matrix
            I[i][j] = I[i][j] / e; //apply to identity
        }

        // Subtract this row (scaled appropriately for each row) from ALL of
        // the other rows so that there will be 0's in this column in the
        // rows above and below this one
        for (ii = 0; ii < dim; ii++) {
            // Only apply to other rows (we want a 1 on the diagonal)
            if (ii == i) {
                continue;
            }

            // We want to change this element to 0
            e = C[ii][i];

            // Subtract (the row above(or below) scaled by e) from (the
            // current row) but start at the i'th column and assume all the
            // stuff left of diagonal is 0 (which it should be if we made this
            // algorithm correctly)
            for (j = 0; j < dim; j++) {
                C[ii][j] -= e * C[i][j]; //apply to original matrix
                I[ii][j] -= e * I[i][j]; //apply to identity
            }
        }
    }

    //we've done all operations, C should be the identity
    //matrix I should be the inverse:
    return I;
}

