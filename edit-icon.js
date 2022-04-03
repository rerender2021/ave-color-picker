// ref: https://www.52pojie.cn/thread-1570976-1-1.html

const ResEdit = require('resedit');
const PELibrary = require('pe-library');
const fs = require('fs');
 
 
let data = fs.readFileSync('./bin/color-picker.exe');
let exe = PELibrary.NtExecutable.from(data);
let res = PELibrary.NtExecutableResource.from(exe);
 
let iconFile = ResEdit.Data.IconFile.from(fs.readFileSync('./color-wheel.ico'));
 
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    1033,
    iconFile.icons.map((item) => item.data)
);
 
res.outputResource(exe);
let newBinary = exe.generate();
fs.writeFileSync('./bin/color-picker-new.exe', new Buffer(newBinary));