// @ts-ignore
// button handlers
document.addEventListener('DOMContentLoaded', function () {
    var _a, _b;
    (_a = document.getElementById("convert-with-scribe")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", convertWithScribe);
    (_b = document.getElementById("continue-download")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", continueDownload);
});
// Listener for filename and download URL
var downloadObj; // actually a JSON object containing info about the downloaded file from the background script
if (window.location.hash) {
    var downloadInfo = JSON.parse(atob(window.location.hash.substr(1))); // we remove the # and use atob to decode base64
    var downloadName = downloadInfo.downloadURL.substr(downloadInfo.downloadURL.lastIndexOf('/') + 1);
    downloadObj = JSON.parse("{\"downloadURL\":\"" + downloadInfo.downloadURL + "\", \"downloadName\":\"" + downloadName + "\", \"downloadID\":\"" + downloadInfo.downloadID + "\"}");
    // logging to be removed
    console.log(downloadObj);
}
else {
    console.log("window.location.hash error");
}
function convertWithScribe() {
    chrome.runtime.sendMessage({ action: "convert", downloadURL: downloadObj.downloadURL, downloadName: downloadObj.downloadName, downloadID: downloadObj.downloadID });
}
function continueDownload() {
    chrome.runtime.sendMessage({ action: "download", downloadURL: downloadObj.downloadURL, downloadName: downloadObj.downloadName, downloadID: downloadObj.downloadID });
}
// TODO receive download filename from background and send appropiate responses back
// TODO esc key to exit window
// TODO resume download if user exits window any way other than button
