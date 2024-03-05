class Utils {

    static mousePos = {x: 0, y: 0};

    constructor() {

    }

    static numberToText(n) {
        if (n === 0) {
            return "";
        } else if (n <= 19) {
            let textNumbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
            return textNumbers[n - 1];
        } else if (n <= 99) {
            let textNumbers = ["Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
            let firstPart = textNumbers[Math.floor(n / 10) - 2];
            let secondPart = Utils.numberToText(n % 10);
            if (secondPart === "") {
                return firstPart;
            } else {
                return firstPart + "_" + secondPart;
            }
        } else if (n === 100) {
            return "Hundred";
        }
    }

    static pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    // right padding s with c to a total of n chars
    // print 0.12300
    // alert(padding_right('0.123', '0', 5));

    static paddingRight(s, c, n) {
        if (!s || !c || s.length >= n) {
            return s;
        }
        let max = (n - s.length) / c.length;
        for (let i = 0; i < max; i++) {
            s += c;
        }
        return s;
    }

    static isWithinPolygon(numVertices, xPosArray, yPosArray, mouseXPos, mouseYPos) {
        let i, j, c = false;
        for (i = 0, j = numVertices - 1; i < numVertices; j = i++) {
            if (((yPosArray[i] > mouseYPos) != (yPosArray[j] > mouseYPos)) &&
                (mouseXPos < (xPosArray[j] - xPosArray[i]) * (mouseYPos - yPosArray[i]) / (yPosArray[j] - yPosArray[i]) + xPosArray[i])) {
                c = !c;
            }
        }
        return c;
    }

    static b64EncodeUnicode(str) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode(parseInt('0x' + p1, 16));
            }));
    }

    static increaseBrightness(hex, percent) {
        // strip the leading # if it's there
        hex = hex.replace(/^\s*#|\s*$/g, '');

        // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
        if (hex.length === 3) {
            hex = hex.replace(/(.)/g, '$1$1');
        }

        let r = parseInt(hex.substr(0, 2), 16),
            g = parseInt(hex.substr(2, 2), 16),
            b = parseInt(hex.substr(4, 2), 16);

        return '#' +
            ((0 | (1 << 8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
            ((0 | (1 << 8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
            ((0 | (1 << 8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
    }

    static startsWith(str, word) {
        return str.lastIndexOf(word, 0) === 0;
    }

    static getSequenceByName(sequences, sequence) {
        for (let i = 0; i < sequences.length; i++) {
            if (sequences[i].name === sequence) {
                return sequences[i];
            }
        }
        return undefined;
    }

    static getChannelIndexByName(camChannels, camChannel) {
        for (let channelObj in camChannels) {
            if (camChannels.hasOwnProperty(channelObj)) {
                let channelObject = camChannels[channelObj];
                if (camChannel === channelObject.channel) {
                    return camChannels.indexOf(channelObject);
                }
            }
        }
    }

    static getIndexByClass(classes, className) {
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].name === className) {
                return i;
            }
        }
        return -1;
    }
}

export {Utils};