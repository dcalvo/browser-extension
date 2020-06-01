// List of MIME types we intercept downloads on
// List of MIME types at https://www.iana.org/assignments/media-types/media-types.xhtml
var fileExtensions = [
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
    if (fileExtensions.includes(item.mime)) {
        chrome.downloads.cancel(item.id);
        alert(item.mime);
    }
});
// Create context menu option for images
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    title: "Convert with Scribe",
    contexts: ["image"],
    onclick: function () {
        alert('you\'ve been scribed');
    }
});
