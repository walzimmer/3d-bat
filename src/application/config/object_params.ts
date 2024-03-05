export type ObjectSizes = {
    // object type name: size as array [x, y, z]
    [name: string]: number[],
    default: [1.5, 1.5, 1.47]
}

export function emptyObjectSizes(): ObjectSizes {
    return { default: [1.5, 1.5, 1.47] }
}

