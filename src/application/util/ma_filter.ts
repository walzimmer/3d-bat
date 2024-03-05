/**
 * This class is inspired by https://github.com/naurril/SUSTechPOINTS
 */

import { AnnotationObject, AnnotationObjectParams } from "../annotation/annotation_object";
import { annMath } from "./ann_math";

type ArrayOrParams = number[] | AnnotationObjectParams

/**
 * Moving average filter.
 * A box is represented as an array of numbers [...pos, ...rot, ...scale]
 */
export class MaFilter {

    x: number[];
    step = 0;
    velocity = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    ones = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    decay = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    constructor(x: ArrayOrParams) {
        this.x = MaFilter.asArray(x);
    }

    static asArray(x: ArrayOrParams): number[] {
        if ((x as AnnotationObjectParams).rotationYaw) {
            return AnnotationObject.toArray(x as AnnotationObjectParams);
        } 
        return x as number[];
    }

    update(box: AnnotationObjectParams): void {
        const x = MaFilter.asArray(box);
        if (this.step == 0) {
            this.velocity = annMath.sub(x, this.x);
        } else {
            this.velocity = annMath.add(
                annMath.eleMul(
                    annMath.sub(x, this.x), 
                    this.decay
                ),
                annMath.eleMul(this.velocity, 
                    annMath.sub(this.ones, this.decay)
                )
            );
        }

        this.x = x;
        this.step++;
    }

    predict(): number[] {
        const res = [...annMath.add(this.x, this.velocity).slice(0, 6), ...this.x.slice(6)];
        return res; 
    };

    nextStep(box: ArrayOrParams): void {
        const x = MaFilter.asArray(box);
        this.x = x;
        this.step++;
    };
}
