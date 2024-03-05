/**
 * This class is inspired by https://github.com/naurril/SUSTechPOINTS
 */

 export class annMath {
    static sub(a: number[], b: number[]): number[] {
        //pos, rot, scale
        const c: number[] = [];
        for (let i in a) {
            c[i] = a[i] - b[i];
        }
        return this.norm(c);
    }

    static div(a: number[], d: number): number[] {
        const c: number[] = [];
        for (let i in a) {
            c[i] = a[i] / d;
        }

        return c;
    }

    static add(a: number[], b: number[]): number[] {
        const c: number[] = [];
        for (let i in a) {
            c[i] = a[i] + b[i];
        }

        return this.norm(c);
    }

    static mul(a: number[], d: number): number[] {
        const c: number[] = [];
        for (let i in a) {
            c[i] = a[i] * d;
        }

        return this.norm(c);
    }

    static norm(c: number[]): number[] {
        for (let i = 3; i < 6; i++) {
            if (c[i] > Math.PI) {
                c[i] -= Math.PI * 2;
            } else if (c[i] < -Math.PI) {
                c[i] += Math.PI * 2;
            }
        }
        return c;
    }

    static normAngle(a: number): number {
        if (a > Math.PI) {
            return a - Math.PI * 2;
        } else if (a < -Math.PI) {
            return a + Math.PI * 2;
        }
        return a;
    }

    /**
     * element-wise multiplication
     */
    static eleMul(a: number[], b: number[]): number[] {
        const c: number[] = [];
        for (let i in a) {
            c[i] = a[i] * b[i];
        }
        return c;
    }
}