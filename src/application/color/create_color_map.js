let colormap = require('colormap')
var fs = require('fs');

let colors = colormap({
    colormap: 'jet',
    nshades: 256,
    format: 'hex',
    alpha: [1.0, 0.5, 1.0]
})

var json_text = JSON.stringify(colors);

fs.writeFile("jet.json", json_text, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});