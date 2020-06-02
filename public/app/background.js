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
// Intercept downloads and ask to Scribe it
chrome.downloads.onCreated.addListener(function (item) {
    if (mimeTypes.includes(item.mime)) {
        chrome.downloads.cancel(item.id);
        alert(item.mime);
    }
});
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
    contexts: ["image", "link"],
    onclick: function () {
        alert('you\'ve been scribed');
    },
    targetUrlPatterns: matchedUrlListBuilder()
});
