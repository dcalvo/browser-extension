document.addEventListener('DOMContentLoaded', function () {
    var _a, _b;
    (_a = document.getElementById("convert-with-scribe")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", convert);
    (_b = document.getElementById("continue-download")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", download);
});
function convert() {
    alert("scribe");
}
function download() {
    alert("download");
}
