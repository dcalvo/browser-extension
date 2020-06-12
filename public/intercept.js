// @ts-ignore
// button handlers
document.addEventListener('DOMContentLoaded', function () {
    var _a, _b;
    (_a = document.getElementById("convert-with-scribe")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", convertWithScribe);
    (_b = document.getElementById("continue-download")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", continueDownload);
});
// Listener for filename and download URL
var downloadName = "";
var downloadURL = "";
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    if (request.downloadName != null && request.downloadURL != null) {
        downloadName = request.downloadName;
        downloadURL = request.downloadURL;
    }
});
function convertWithScribe() {
    if (downloadName != null && downloadURL != null) {
        chrome.runtime.sendMessage({ action: "convert", downloadName: downloadName, downloadURL: downloadURL });
    }
    else {
        console.log("downloadName or downloadURL is invalid");
    }
}
function continueDownload() {
    if (downloadName != null && downloadURL != null) {
        chrome.runtime.sendMessage({ action: "download", downloadName: downloadName, downloadURL: downloadURL });
    }
    else {
        console.log("downloadName or downloadURL is invalid");
    }
}
// TODO receive download filename from background and send appropiate responses back
