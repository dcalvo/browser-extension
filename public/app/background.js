// @ts-ignore
// The above line is used to suppress the error that "all files must be modules" which I don't know how to fix
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// Base URL that relative URLs are added onto
var baseUrl = "https://scribeit.io";
var uploadUrl = "/extension/api/documents";
var welcomeUrl = "/extension/start";
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
    var urlFileExtension = '.' + (url === null || url === void 0 ? void 0 : url.substring(url.lastIndexOf('.') + 1));
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
chrome.downloads.onCreated.addListener(function (item) {
    if (downloadAge(item) < 2 && item.state == "in_progress" &&
        (mimeTypes.includes(item.mime) || isSupported(item.finalUrl))) {
        chrome.downloads.pause(item.id);
        var downloadInfo = "{\"downloadURL\":\"" + item.finalUrl + "\", \"downloadID\":\"" + item.id + "\"}"; // we use btoa() to encode in base64
        chrome.windows.create({ url: chrome.runtime.getURL("confirm.html#" + btoa(downloadInfo)), type: "popup", width: 800, height: 600 });
    }
});
// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var downloadId = parseInt(request.downloadID);
    if (request.action == "convert") {
        chrome.downloads.search({ id: downloadId }, function (download) {
            if (download[0].state == "complete") { // Fix to ensure we still clean up tiny files we were too slow to intercept and pause
                chrome.downloads.removeFile(downloadId);
            }
            else {
                chrome.downloads.cancel(downloadId);
            }
            chrome.downloads.erase({ id: downloadId }, function () {
                convert(request.downloadURL);
            });
        });
    }
    else if (request.action == "download") {
        chrome.downloads.search({ id: downloadId }, function (download) {
            if (download[0].state != "complete") {
                chrome.downloads.resume(downloadId);
            }
        });
    }
    else {
        console.log("download interception error");
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
function submitDocument(formData) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(baseUrl + uploadUrl, {
                        method: "POST",
                        credentials: "include",
                        body: formData
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
            }
        });
    });
}
// Placeholder for eventual convert process
function convert(url) {
    // Handle URL extraction from onClick events
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
    var formData = new FormData();
    var urlScheme = url.substring(0, url.indexOf(':'));
    if (urlScheme == "http" || urlScheme == "https") {
        formData.append("document[url]", url);
    }
    else {
        formData.append("document[file]", File); // TODO handle file uploading
    }
    submitDocument(formData).then(function (response) {
        alert(JSON.stringify(response));
        if (!response.hasOwnProperty("errors")) {
            chrome.tabs.create({ url: baseUrl + response.document_url });
        }
        else {
            if (response.errors.hasOwnProperty("url")) {
                alert("ding");
            }
        }
    })["catch"](function (error) { return console.log("submitDocument error: " + error); });
    //{"document_url":"/documents/e5113747-6b4b-4b1a-b69b-c8ac4d884893/html"}
    //{"errors":{"url":"Scribe couldn't retrieve a document from this URL."}}
}
