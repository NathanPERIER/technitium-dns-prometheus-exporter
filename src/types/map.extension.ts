
declare global {
    interface Map<K,V> {
        map<T>(mapper: (key: K, value: V) => T): T[];
    }
}

Map.prototype.map = function<K,V,T>(this: Map<K,V>, mapper: (key: K, value: V) => T): T[] {
    let res: T[] = [];
    this.forEach((value, key) => { res.push(mapper(key, value)); });
    return res;
} 

export {}
