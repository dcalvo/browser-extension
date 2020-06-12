// @ts-ignore
// List of file extensions we create context menu options on
var fileExtensions = [
    ".pdf",
    ".rtf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".odt",
    ".ods",
    ".odp",
    ".jpg",
    ".jpeg",
    ".gif",
    ".png",
    ".tiff",
    ".tif",
    ".bmp",
];
// List of MIME types we intercept downloads on
// List of MIME types at https://www.iana.org/assignments/media-types/media-types.xhtml
var mimeTypes = [
    "application/pdf",
    "application/rtf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "image/jpeg",
    "image/gif",
    "image/png",
    "image/tiff",
    "image/bmp",
];
// Helper function to compare download object's startTime ISO timestamp with Date.now() since Chrome API is bugged for onCreated events
// See (https://bugs.chromium.org/p/chromium/issues/detail?id=432757)
function downloadAge(download) {
    var date1 = new Date(Date.now());
    var date2 = new Date(download.startTime);
    var diff = date1.getTime() - date2.getTime();
    return diff / 1000; // in seconds
}
// Intercept downloads and ask to Scribe it
chrome.downloads.onCreated.addListener(function (item) {
    if (downloadAge(item) < 2 && item.state == "in_progress" && mimeTypes.includes(item.mime)) {
        chrome.downloads.cancel(item.id);
        var tabId_1;
        chrome.windows.create({ url: chrome.runtime.getURL("confirm.html"), type: "popup", width: 800, height: 600 }, function (window) {
            // TODO send download file name to window
            chrome.tabs.query({ windowId: window.id }, function (tabs) {
                if (tabs[0].id == null) {
                    throw new Error("Confirmation window creation failed");
                }
                else {
                    tabId_1 = tabs[0].id;
                }
            });
        });
        chrome.tabs.sendMessage(tabId_1, { downloadName: item.filename, downloadURL: item.finalUrl });
        console.log("window created");
    }
});
// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "convert")
        console.log(request.downloadName + " 1 " + request.downloadURL);
    else if (request.action == "download")
        console.log(request.downloadName + " 2 " + request.downloadURL);
    else
        console.log("error");
});
// Helper function to build match patterns for extension URLs since Chrome API doesn't support regex
function matchedUrlListBuilder() {
    var matchedUrls = [];
    for (var _i = 0, fileExtensions_1 = fileExtensions; _i < fileExtensions_1.length; _i++) {
        var extension = fileExtensions_1[_i];
        matchedUrls.push("*://*/*" + extension);
    }
    return matchedUrls;
}
// Create context menu option for images
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    title: "Convert with Scribe",
    contexts: ["image", "link", "page_action"],
    onclick: function () {
        alert('you\'ve been scribed');
    },
    targetUrlPatterns: matchedUrlListBuilder()
});
