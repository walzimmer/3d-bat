import * as KEYS from 'keycode-js'

export class Key {

    private static down: Set<string> = new Set();

    static setKeyUp(key: string) {
        this.down.delete(key)
    }

    static setKeyDown(key: string) {
        this.down.add(key)
    }

    static isDown(key: string) {
        return this.down.has(key);
    }

    static isCtrlDown() {
        return this.down.has(KEYS.CODE_CONTROL_LEFT) || this.down.has(KEYS.CODE_CONTROL_RIGHT) || this.down.has(KEYS.CODE_META_LEFT) || this.down.has(KEYS.CODE_META_RIGHT);
    }

    static isDownShift() {
        return this.down.has(KEYS.CODE_SHIFT_LEFT) || this.down.has(KEYS.CODE_SHIFT_RIGHT);
    }

    static isDownWASDQE () {
        return this.isDown(KEYS.CODE_W) || this.isDown(KEYS.CODE_A) || this.isDown(KEYS.CODE_S) || this.isDown(KEYS.CODE_D) || this.isDown(KEYS.CODE_Q) || this.isDown(KEYS.CODE_E);
    }

    static isDownQE () {
        return this.isDown(KEYS.CODE_Q) || this.isDown(KEYS.CODE_E);
    }
}
