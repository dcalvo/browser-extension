// @ts-ignore
// The above line is used to suppress the error that "all files must be modules" which I don't know how to fix
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
// Helper function to check if the given URL is a supported filetype
function isSupported(url) {
    var urlFileExtension = '.' + (url === null || url === void 0 ? void 0 : url.substr(url.lastIndexOf('.') + 1));
    return fileExtensions.includes(urlFileExtension);
}
// Listener for URL changes so we can display pageAction correctly
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (isSupported(tab.url)) {
        chrome.pageAction.show(tabId);
    }
});
// Listener for when the Scribe toolbar button is clicked
chrome.pageAction.onClicked.addListener(function (tab) {
    convert(tab.url);
});
// Helper function to compare download object's startTime ISO timestamp with Date.now() since Chrome API is bugged for onCreated events
// See (https://bugs.chromium.org/p/chromium/issues/detail?id=432757)
function downloadAge(download) {
    var date1 = new Date(Date.now());
    var date2 = new Date(download.startTime);
    var diff = date1.getTime() - date2.getTime();
    return diff / 1000; // in seconds
}
// Intercept downloads and ask to Scribe it
chrome.downloads.onDeterminingFilename.addListener(function (item) {
    if (downloadAge(item) < 2 &&
        (mimeTypes.includes(item.mime) || isSupported(item.finalUrl))) {
        chrome.downloads.pause(item.id);
        if (item.state == "complete")
            chrome.downloads.removeFile(item.id);
        var downloadInfo = "{\"downloadURL\":\"" + item.finalUrl + "\", \"downloadID\":\"" + item.id + "\"}"; // we use btoa() to encode in base64
        chrome.windows.create({ url: chrome.runtime.getURL("confirm.html#" + btoa(downloadInfo)), type: "popup", width: 800, height: 600 });
    }
});
// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(// TODO logic for routing action
function (request, sender, sendResponse) {
    if (request.action == "convert") {
        chrome.downloads.cancel(parseInt(request.downloadID));
        convert(request.downloadURL);
    }
    else if (request.action == "download") {
        chrome.downloads.resume(parseInt(request.downloadID));
    }
    else {
        console.log("download confirmation routing error");
    }
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
// Create context menu option for images and links
var matchedUrls = matchedUrlListBuilder();
chrome.contextMenus.create({
    title: "Convert with Scribe",
    contexts: ["image", "link"],
    onclick: function (info) {
        convert(info);
    },
    targetUrlPatterns: matchedUrls
});
// Experimental code that is capable of detecting embedded PDFs (and other filetypes) in most cases, but has bugs where
// opening new windows created unexpected behavior (context menu not being updated properly)
/*
// Listener for active tab URL so we can hide/show pageActionContext option
chrome.tabs.onActivated.addListener(function(activeInfo) {
  let tab = chrome.tabs.get(activeInfo.tabId, function(tab) {
    let urlFileExtension = '.' + tab.url?.substr(tab.url.lastIndexOf('.') + 1)
    if (fileExtensions.includes(urlFileExtension)) {
      // Create context menu option for valid stand-alone file pages which we'll hide/show as necessary
      chrome.contextMenus.remove("pageActionContext", function() {
        void chrome.runtime.lastError
        chrome.contextMenus.create({
          id: "pageActionContext", // this context menu option is essentially tethered to whether the pageAction button is lit up
          title: "Convert with Scribe",
          contexts: ["page", "frame"],
          onclick: function() {
            convert()
          }
        })
      })
    } else {
      chrome.contextMenus.remove("pageActionContext", function() {
        void chrome.runtime.lastError
      })
    }
  })
})
*/
// Placeholder for eventual convert process
function convert(url) {
    if (typeof url == "object") {
        if (url.linkUrl) {
            url = url.linkUrl;
        }
        else if (url.mediaType == "image") {
            url = url.srcUrl;
        }
        else {
            console.log("onClick URL retrieval error");
        }
    }
    alert(url);
}
