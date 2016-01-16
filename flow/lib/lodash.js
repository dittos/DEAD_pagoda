/* @flow */

declare module 'lodash' {
    declare function find<T>(array: Array<T>, fn: (elem: T) => boolean): T;
    
    declare function isEqual(a: any, b: any): boolean;
    
    declare function remove<T>(array: Array<T>, fn: (elem: T) => boolean): void;
};