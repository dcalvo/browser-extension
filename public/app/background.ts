// List of file extensions we create context menu options on
const fileExtensions: Array<string> = [
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
]

// List of MIME types we intercept downloads on
// List of MIME types at https://www.iana.org/assignments/media-types/media-types.xhtml
const mimeTypes: Array<string> = [
  "application/pdf",                                                              // .pdf
  "application/rtf",                                                              // .rtf
  "application/msword",                                                           // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",      // .docx
  "application/vnd.ms-excel",                                                     // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",            // .xlsx
  "application/vnd.ms-powerpoint",                                                // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",    // .pptx
  "text/plain",                                                                   // .txt
  "application/vnd.oasis.opendocument.text",                                      // .odt
  "application/vnd.oasis.opendocument.spreadsheet",                               // .ods
  "application/vnd.oasis.opendocument.presentation",                              // .odp
  "image/jpeg",                                                                   // .jpg, .jpeg
  "image/gif",                                                                    // .gif
  "image/png",                                                                    // .png
  "image/tiff",                                                                   // .tif, .tiff
  "image/bmp",                                                                    // .bmp
]

// Intercept downloads and ask to Scribe it
chrome.downloads.onCreated.addListener(function(item) {
  if (mimeTypes.includes(item.mime)){
    chrome.downloads.cancel(item.id)
    chrome.windows.create({url: chrome.extension.getURL("confirm.html"), type: "popup", width: 800, height: 600}, function() {
      // TODO send download file name to window
      chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
          if (request.message === "hi")
            console.log("hello world")
        })
    })
  }
})

// Helper function to build match patterns since Chrome API doesn't support regex
function matchedUrlListBuilder() {
  let matchedUrls: Array<string> = []
  for (let extension of fileExtensions) {
    matchedUrls.push("*://*/*" + extension)
  }

  return matchedUrls
}

// Create context menu option for images
chrome.contextMenus.removeAll()
chrome.contextMenus.create({
      title: "Convert with Scribe",
      contexts: ["image", "link", "page_action"],
      onclick: function() {
        alert('you\'ve been scribed')
      },
      targetUrlPatterns: matchedUrlListBuilder()
})