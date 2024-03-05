import { Euler, Mesh, Vector3 } from "three";
import { AnnotationObjectParams, BoxParams } from "../annotation/annotation_object";
const operationStackItemsTypes = ['classLabel', 'trackID', 'delete', 'position', 'scale', 'rotation', 'reset', 'add', 'interpolation', 'changeFrame'] as const;
export type OperationStackItemsType = typeof operationStackItemsTypes[number];

type PrevCurArgs<T> = {
    prev: T,
    cur: T
}

type IdArg = {
    objectIndex: number
}

type ClassArg = {
    class: string
}

type Base<T extends OperationStackItemsType> = {
    type: T
}

// Args
type ClassLabelArgs = PrevCurArgs<string> & IdArg
type TrackIDArgs = PrevCurArgs<string> & IdArg
type DeleteArgs = {
    position: Vector3, 
    scale: Vector3, 
    rotation: Euler, 
    trackId: string, 
    objectClass: string,
    fileIndex: number
} & IdArg
type PositionArgs = {
    position: Vector3
} & IdArg
type ScaleArgs = {
    scale: Vector3
} & IdArg
type RotationArgs = {
    rotation: Euler
} & IdArg
type ResetArgs = {
    boxParams: BoxParams
} & IdArg
type AddArgs = {} & IdArg
type InterpolationArgs = {
} & IdArg
type ChangeFrameArgs = PrevCurArgs<number>

// Types
export type ClassLabelOperation = Base<'classLabel'> & ClassLabelArgs & IdArg;
export type TrackIDOperation = Base<'trackID'> & TrackIDArgs & ClassArg;
export type DeleteOperation = Base<'delete'> & DeleteArgs;
export type PositionOperation = Base<'position'> & PositionArgs;
export type ScaleOperation = Base<'scale'> & ScaleArgs;
export type RotationOperation = Base<'rotation'> & RotationArgs;
export type ResetOperation = Base<'reset'> & ResetArgs;
export type AddOperation = Base<'add'> & AddArgs;
export type InterpolationOperation = Base<'interpolation'> & InterpolationArgs;
export type ChangeFrameOperation = Base<'changeFrame'> & ChangeFrameArgs;

export type OperationStackItem =
  | ClassLabelOperation
  | TrackIDOperation
  | DeleteOperation
  | PositionOperation
  | ScaleOperation
  | RotationOperation
  | ResetOperation
  | AddOperation
  | InterpolationOperation
  | ChangeFrameOperation;

/**
 * Stack implementation to store OperationStackItem objects which can be used to undo/redo operations
 */
export class OperationStack {

    private stack: OperationStackItem[] = []

    constructor() {
        this.stack = []
    }

    /**
     * Push @param item to the stack of UNDOable OperationStackItems
     */
    push(item: OperationStackItem): void {
        // console.info(`pushing operation to stack ${JSON.stringify(item)}`)
        this.stack.push(item);
    }

    /**
     * @returns the last UNDOable OperationStackItem and remove it from the stack.
     */
    pop(): OperationStackItem | undefined {
        // console.info(`poping operation from stack ${JSON.stringify(this.peek())}`)
        return this.stack.pop();
    }

    /**
     * @returns the last UNDOable OperationStackItem without removing it from the stack.
     */
    peek(): OperationStackItem | undefined  {
        return this.stack[this.length() - 1];
    }

    length(): number {
        return this.stack.length;
    }

    empty(): boolean {
        return this.stack.length === 0;
    }

    clear(): void {
        this.stack = []
    }

}