export function exampleFilter (): (text: string) => string {
    return alterString;
}

export function alterString (text: string): string {
    return text + ' - This is been altered';
}
