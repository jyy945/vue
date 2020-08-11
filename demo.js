var a = /\{\{((?:.|\r?\n)+?)\}\}/g;
var b = "{{name + fdfd}}，{{fd}}";
console.log(a.exec(b));
console.log(a.exec(b));
