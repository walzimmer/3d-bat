import { Euler, Vector3 } from "three";
import THREE = require("three");
import { AnnotationObjectParams } from "../annotation/annotation_object";

export type Extreme = {
    min: {
        x: number,
        y: number,
        z: number
    }, 
    max: {
        x: number,
        y: number,
        z: number
    }
}

/**
 * Some function of this class are a modified version of functions from https://github.com/naurril/SUSTechPOINTS
 */
class MathUtils {

    constructor() {

    }

    /**
     * @arg v is array of vector
     * @arg vl is vector length 
     * */
    static arrayAsVectorRange(v: number[], vl: number): Extreme | null {
        const n = v.length / vl;
        if (n === 0) {
            return null;
        }
        const min = v.slice(0, vl);
        const max = v.slice(0, vl);
        for (let i = 1; i < n; ++i) {
            for (let j = 0; j < vl; ++j) {
                if (min[j] > v[i * vl + j]) {
                    min[j] = v[i * vl + j];
                }
                if (max[j] < v[i * vl + j]) {
                    max[j] = v[i * vl + j];
                }
            }
        }

        return {
            min: {
                x: min[0],
                y: min[1],
                z: min[2]
            },
            max: {
                x: max[0],
                y: max[1],
                z: max[2]
            },
        }
    }

    /**
     * box(position, scale, rotation) to box corner corrdinates.
     * return 8 points, represented as (x,y,z,1)
     * note the vertices order cannot be changed, draw-box-on-image assumes
     * the first 4 vertex is the front plane, so it knows box direction.
     */ 
    static psrToXyz(p: Vector3, s: Vector3, r: Euler) {

        const trans_matrix = MathUtils.eulerAngleToRotateMatrix(r, p);
        const x = s.x / 2;
        const y = s.y / 2;
        const z = s.z / 2;
        const local_coord = [
            x, y, -z, 1, x, -y, -z, 1,  //front-left-bottom, front-right-bottom
            x, -y, z, 1, x, y, z, 1,  //front-right-top,   front-left-top

            -x, y, -z, 1, -x, -y, -z, 1,  //rear-left-bottom, rear-right-bottom
            -x, -y, z, 1, -x, y, z, 1,  //rear-right-top,   rear-left-top
        ];
        const world_coord = MathUtils.matmul(trans_matrix, local_coord, 4);
        return world_coord;
    }

    static vectorRange(v: number[][]): Extreme | null {
        if (v.length === 0) {
            return null;
        }
        const min = [...v[0]], max = [...v[0]];
        for (let i = 1; i < v.length; ++i) {
            for (let j = 0; j < min.length; ++j) {
                if (min[j] > v[i][j]) {
                    min[j] = v[i][j];
                }
                if (max[j] < v[i][j]) {
                    max[j] = v[i][j];
                }
            }
        }
        return {
            min: {
                x: min[0],
                y: min[1],
                z: min[2]
            },
            max: {
                x: max[0],
                y: max[1],
                z: max[2]
            },
        }
    }

    static translateBox(box: AnnotationObjectParams, axis: string, delta: number): void {
        const t = new Vector3(0, 0, 0);
        t[axis] = delta;
        let trans = this.translateBoxInBoxCoord(new Vector3(box.rotationYaw, box.rotationPitch, box.rotationRoll), t);
        box.x += trans.x;
        box.y += trans.y;
        box.z += trans.z;
    };
    
    static translateBoxInBoxCoord(rotation: Vector3, t: Vector3): Vector3 {
        const euler = new Euler(rotation.z, rotation.y, rotation.x, "XYZ")
        return new Vector3(t.x, t.y, t.z).applyEuler(euler);
    };

    /**
    * @arg m - matrix
    * @arg cl - column vector length
    */
    static transpose(m: number[], cl: number = NaN) {
        const rl = m.length / cl;
        for (let i = 0; i < cl; i++) {
            for (let j = i + 1; j < rl; j++) {
                const t = m[i * rl + j];
                m[i * rl + j] = m[j * cl + i];
                m[j * cl + i] = t;
            }
        }

        return m;
    }

    static mat(m: number[], s: number, x: number, y: number): number {
        return m[x * s + y];
    }

    /**
     * matrix (m*n), matrix(n*l), vl: vector length=n 
     * this matmul is row-wise multiplication. 'x' and result are row-vectors.
     * ret^T = m * x^T
     */
    static matmul(m: number[], x: number[], vl: number)  //vl is vector length
    {
        const ret: number[] = [];
        const res_l = m.length / vl;
        for (let vi = 0; vi < x.length / vl; vi++) {  //vector index
            for (let r = 0; r < m.length / vl; r++) {  //row of matrix
                ret[vi * res_l + r] = 0;
                for (let i = 0; i < vl; i++) {
                    ret[vi * res_l + r] += m[r * vl + i] * x[vi * vl + i];
                }
            }
        }

        return ret;
    }

    /**
    * @arg vl - vector length 
    */
    static matmul2(m: number[], x: number[], vl: number): number[] {
        const ret: number[] = [];
        const rows = m.length / vl;
        const cols = x.length / vl;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ret[r * cols + c] = 0;
                for (let i = 0; i < vl; i++) {
                    ret[r * cols + c] += m[r * vl + i] * x[i * cols + c];
                }
            }
        }
        return ret;
    }

    static eulerAngleToRotateMatrix(eu: Euler, tr: Vector3, order = "ZYX"): number[] {
        const theta = [eu.x, eu.y, eu.z];
        // Calculate rotation about x axis
        const R_x = [
            1, 0, 0,
            0, Math.cos(theta[0]), -Math.sin(theta[0]),
            0, Math.sin(theta[0]), Math.cos(theta[0])
        ];

        // Calculate rotation about y axis
        const R_y = [
            Math.cos(theta[1]), 0, Math.sin(theta[1]),
            0, 1, 0,
            -Math.sin(theta[1]), 0, Math.cos(theta[1])
        ];

        // Calculate rotation about z axis
        const R_z = [
            Math.cos(theta[2]), -Math.sin(theta[2]), 0,
            Math.sin(theta[2]), Math.cos(theta[2]), 0,
            0, 0, 1];

        let matrices = {
            Z: R_z,
            Y: R_y,
            X: R_x,
        }

        let R = MathUtils.matmul2(matrices[order[2]], MathUtils.matmul2(matrices[order[1]], matrices[order[0]], 3), 3);


        return [
            this.mat(R, 3, 0, 0), this.mat(R, 3, 0, 1), this.mat(R, 3, 0, 2), tr.x,
            this.mat(R, 3, 1, 0), this.mat(R, 3, 1, 1), this.mat(R, 3, 1, 2), tr.y,
            this.mat(R, 3, 2, 0), this.mat(R, 3, 2, 1), this.mat(R, 3, 2, 2), tr.z,
            0, 0, 0, 1,
        ];
    }

    //calculate product of matrix
    static matrixProduct4x4(inMax1, inMax2) {
        let outMax = [0, 0, 0, 0];
        outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
        outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
        outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
        outMax[3] = inMax1[3][0] * inMax2[0] + inMax1[3][1] * inMax2[1] + inMax1[3][2] * inMax2[2] + inMax1[3][3] * inMax2[3];
        return outMax;
    }

    static matrixProduct3x4(inMax1, inMax2) {
        let outMax = [0, 0, 0];
        outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
        outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
        outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
        return outMax;
    }

    static matrixProduct3x3(matrixOne, matrixTwo) {
        let matrixOut = [0, 0, 0];
        matrixOut[0] = matrixOne[0][0] * matrixTwo[0] + matrixOne[0][1] * matrixTwo[1] + matrixOne[0][2] * matrixTwo[2];
        matrixOut[1] = matrixOne[1][0] * matrixTwo[0] + matrixOne[1][1] * matrixTwo[1] + matrixOne[1][2] * matrixTwo[2];
        matrixOut[2] = matrixOne[2][0] * matrixTwo[0] + matrixOne[2][1] * matrixTwo[1] + matrixOne[2][2] * matrixTwo[2];
        return matrixOut;
    }


    // Returns the inverse of matrix `M`.
    static matrixInvert(M) {
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
        let i = 0, ii = 0, j = 0, dim = M.length, e = 0, t = 0;
        const I: number[][] = [], C: number[][] = [];
        for (i = 0; i < dim; i += 1) {
            // Create the row
            I[I.length] = [];
            C[C.length] = [];
            for (j = 0; j < dim; j += 1) {

                //if we're on the diagonal, put a 1 (for identity)
                if (i == j) {
                    I[i][j] = 1;
                } else {
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

    //calculate inverse matrix
    static inverseMatrix(inMax) {
        let det = (inMax[0][0] * inMax[1][1] * inMax[2][2] * inMax[3][3]) + (inMax[0][0] * inMax[1][2] * inMax[2][3] * inMax[3][1]) + (inMax[0][0] * inMax[1][3] * inMax[2][1] * inMax[3][2])
            - (inMax[0][0] * inMax[1][3] * inMax[2][2] * inMax[3][1]) - (inMax[0][0] * inMax[1][2] * inMax[2][1] * inMax[3][3]) - (inMax[0][0] * inMax[1][1] * inMax[2][3] * inMax[3][2])
            - (inMax[0][1] * inMax[1][0] * inMax[2][2] * inMax[3][3]) - (inMax[0][2] * inMax[1][0] * inMax[2][3] * inMax[3][1]) - (inMax[0][3] * inMax[1][0] * inMax[2][1] * inMax[3][2])
            + (inMax[0][3] * inMax[1][0] * inMax[2][2] * inMax[3][1]) + (inMax[0][2] * inMax[1][0] * inMax[2][1] * inMax[3][3]) + (inMax[0][1] * inMax[1][0] * inMax[2][3] * inMax[3][2])
            + (inMax[0][1] * inMax[1][2] * inMax[2][0] * inMax[3][3]) + (inMax[0][2] * inMax[1][3] * inMax[2][0] * inMax[3][1]) + (inMax[0][3] * inMax[1][1] * inMax[2][0] * inMax[3][2])
            - (inMax[0][3] * inMax[1][2] * inMax[2][0] * inMax[3][1]) - (inMax[0][2] * inMax[1][1] * inMax[2][0] * inMax[3][3]) - (inMax[0][1] * inMax[1][3] * inMax[2][0] * inMax[3][2])
            - (inMax[0][1] * inMax[1][2] * inMax[2][3] * inMax[3][0]) - (inMax[0][2] * inMax[1][3] * inMax[2][1] * inMax[3][0]) - (inMax[0][3] * inMax[1][1] * inMax[2][2] * inMax[3][0])
            + (inMax[0][3] * inMax[1][2] * inMax[2][1] * inMax[3][0]) + (inMax[0][2] * inMax[1][1] * inMax[2][3] * inMax[3][0]) + (inMax[0][1] * inMax[1][3] * inMax[2][2] * inMax[3][0]);
        let inv00 = (inMax[1][1] * inMax[2][2] * inMax[3][3] + inMax[1][2] * inMax[2][3] * inMax[3][1] + inMax[1][3] * inMax[2][1] * inMax[3][2] - inMax[1][3] * inMax[2][2] * inMax[3][1] - inMax[1][2] * inMax[2][1] * inMax[3][3] - inMax[1][1] * inMax[2][3] * inMax[3][2]) / det;
        let inv01 = (-inMax[0][1] * inMax[2][2] * inMax[3][3] - inMax[0][2] * inMax[2][3] * inMax[3][1] - inMax[0][3] * inMax[2][1] * inMax[3][2] + inMax[0][3] * inMax[2][2] * inMax[3][1] + inMax[0][2] * inMax[2][1] * inMax[3][3] + inMax[0][1] * inMax[2][3] * inMax[3][2]) / det;
        let inv02 = (inMax[0][1] * inMax[1][2] * inMax[3][3] + inMax[0][2] * inMax[1][3] * inMax[3][1] + inMax[0][3] * inMax[1][1] * inMax[3][2] - inMax[0][3] * inMax[1][2] * inMax[3][1] - inMax[0][2] * inMax[1][1] * inMax[3][3] - inMax[0][1] * inMax[1][3] * inMax[3][2]) / det;
        let inv03 = (-inMax[0][1] * inMax[1][2] * inMax[2][3] - inMax[0][2] * inMax[1][3] * inMax[2][1] - inMax[0][3] * inMax[1][1] * inMax[2][2] + inMax[0][3] * inMax[1][2] * inMax[2][1] + inMax[0][2] * inMax[1][1] * inMax[2][3] + inMax[0][1] * inMax[1][3] * inMax[2][2]) / det;
        let inv10 = (-inMax[1][0] * inMax[2][2] * inMax[3][3] - inMax[1][2] * inMax[2][3] * inMax[3][0] - inMax[1][3] * inMax[2][0] * inMax[3][2] + inMax[1][3] * inMax[2][2] * inMax[3][0] + inMax[1][2] * inMax[2][0] * inMax[3][3] + inMax[1][0] * inMax[2][3] * inMax[3][2]) / det;
        let inv11 = (inMax[0][0] * inMax[2][2] * inMax[3][3] + inMax[0][2] * inMax[2][3] * inMax[3][0] + inMax[0][3] * inMax[2][0] * inMax[3][2] - inMax[0][3] * inMax[2][2] * inMax[3][0] - inMax[0][2] * inMax[2][0] * inMax[3][3] - inMax[0][0] * inMax[2][3] * inMax[3][2]) / det;
        let inv12 = (-inMax[0][0] * inMax[1][2] * inMax[3][3] - inMax[0][2] * inMax[1][3] * inMax[3][0] - inMax[0][3] * inMax[1][0] * inMax[3][2] + inMax[0][3] * inMax[1][2] * inMax[3][0] + inMax[0][2] * inMax[1][0] * inMax[3][3] + inMax[0][0] * inMax[1][3] * inMax[3][2]) / det;
        let inv13 = (inMax[0][0] * inMax[1][2] * inMax[2][3] + inMax[0][2] * inMax[1][3] * inMax[2][0] + inMax[0][3] * inMax[1][0] * inMax[2][2] - inMax[0][3] * inMax[1][2] * inMax[2][0] - inMax[0][2] * inMax[1][0] * inMax[2][3] - inMax[0][0] * inMax[1][3] * inMax[2][2]) / det;
        let inv20 = (inMax[1][0] * inMax[2][1] * inMax[3][3] + inMax[1][1] * inMax[2][3] * inMax[3][0] + inMax[1][3] * inMax[2][0] * inMax[3][1] - inMax[1][3] * inMax[2][1] * inMax[3][0] - inMax[1][1] * inMax[2][0] * inMax[3][3] - inMax[1][0] * inMax[2][3] * inMax[3][1]) / det;
        let inv21 = (-inMax[0][0] * inMax[2][1] * inMax[3][3] - inMax[0][1] * inMax[2][3] * inMax[3][0] - inMax[0][3] * inMax[2][0] * inMax[3][1] + inMax[0][3] * inMax[2][1] * inMax[3][0] + inMax[0][1] * inMax[2][0] * inMax[3][3] + inMax[0][0] * inMax[2][3] * inMax[3][1]) / det;
        let inv22 = (inMax[0][0] * inMax[1][1] * inMax[3][3] + inMax[0][1] * inMax[1][3] * inMax[3][0] + inMax[0][3] * inMax[1][0] * inMax[3][1] - inMax[0][3] * inMax[1][1] * inMax[3][0] - inMax[0][1] * inMax[1][0] * inMax[3][3] - inMax[0][0] * inMax[1][3] * inMax[3][1]) / det;
        let inv23 = (-inMax[0][0] * inMax[1][1] * inMax[2][3] - inMax[0][1] * inMax[1][3] * inMax[2][0] - inMax[0][3] * inMax[1][0] * inMax[2][1] + inMax[0][3] * inMax[1][1] * inMax[2][0] + inMax[0][1] * inMax[1][0] * inMax[2][3] + inMax[0][0] * inMax[1][3] * inMax[2][1]) / det;
        let inv30 = (-inMax[1][0] * inMax[2][1] * inMax[3][2] - inMax[1][1] * inMax[2][2] * inMax[3][0] - inMax[1][2] * inMax[2][0] * inMax[3][1] + inMax[1][2] * inMax[2][1] * inMax[3][0] + inMax[1][1] * inMax[2][0] * inMax[3][2] + inMax[1][0] * inMax[2][2] * inMax[3][1]) / det;
        let inv31 = (inMax[0][0] * inMax[2][1] * inMax[3][2] + inMax[0][1] * inMax[2][2] * inMax[3][0] + inMax[0][2] * inMax[2][0] * inMax[3][1] - inMax[0][2] * inMax[2][1] * inMax[3][0] - inMax[0][1] * inMax[2][0] * inMax[3][2] - inMax[0][0] * inMax[2][2] * inMax[3][1]) / det;
        let inv32 = (-inMax[0][0] * inMax[1][1] * inMax[3][2] - inMax[0][1] * inMax[1][2] * inMax[3][0] - inMax[0][2] * inMax[1][0] * inMax[3][1] + inMax[0][2] * inMax[1][1] * inMax[3][0] + inMax[0][1] * inMax[1][0] * inMax[3][2] + inMax[0][0] * inMax[1][2] * inMax[3][1]) / det;
        let inv33 = (inMax[0][0] * inMax[1][1] * inMax[2][2] + inMax[0][1] * inMax[1][2] * inMax[2][0] + inMax[0][2] * inMax[1][0] * inMax[2][1] - inMax[0][2] * inMax[1][1] * inMax[2][0] - inMax[0][1] * inMax[1][0] * inMax[2][2] - inMax[0][0] * inMax[1][2] * inMax[2][1]) / det;

        return [[inv00, inv01, inv02, inv03], [inv10, inv11, inv12, inv13], [inv20, inv21, inv22, inv23], [inv30, inv31, inv32, inv33]]
    }

    static degToRad(degrees){
        return degrees * Math.PI / 180;
    }


}

export {MathUtils};