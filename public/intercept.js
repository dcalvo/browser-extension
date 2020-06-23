// @ts-ignore
var downloadObj = null; // actually a JSON object containing info about the downloaded file from the background script
var continueDownloadOnExit = true; // used to decide if we auto-continue the download on window exit
// window initialization that builds our download JSON object
if (window.location.hash) {
    var downloadInfo = JSON.parse(atob(window.location.hash.substring(1))); // we remove the # and use atob to decode base64
    var downloadName = downloadInfo.downloadURL.substring(downloadInfo.downloadURL.lastIndexOf('/') + 1);
    downloadObj = JSON.parse("{\"downloadURL\":\"" + downloadInfo.downloadURL + "\", \"downloadName\":\"" + downloadName + "\", \"downloadID\":\"" + downloadInfo.downloadID + "\"}");
    // logging to be removed
    console.log(downloadObj);
}
else {
    console.log("window.location.hash error");
}
// button handlers
document.addEventListener('DOMContentLoaded', function () {
    var _a, _b;
    (_a = document.getElementById("convert-with-scribe")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", convertWithScribe);
    (_b = document.getElementById("continue-download")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", continueDownload);
});
// handler for Escape-key exiting
document.addEventListener('keydown', function (event) {
    if (event.key === "Escape") {
        if (downloadObj != null) {
            continueDownload();
        }
    }
});
// handler used to ensure we always continue the user's download by default on window exit
window.addEventListener('beforeunload', function (event) {
    if (continueDownloadOnExit) {
        continueDownload();
    }
});
function convertWithScribe() {
    chrome.runtime.sendMessage({ action: "convert", downloadURL: downloadObj.downloadURL, downloadName: downloadObj.downloadName, downloadID: downloadObj.downloadID });
    continueDownloadOnExit = false;
    window.close();
}
function continueDownload() {
    chrome.runtime.sendMessage({ action: "download", downloadURL: downloadObj.downloadURL, downloadName: downloadObj.downloadName, downloadID: downloadObj.downloadID });
    continueDownloadOnExit = false; // required otherwise we fall into an infinite loop
    window.close();
}
