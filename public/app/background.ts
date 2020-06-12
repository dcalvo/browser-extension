// @ts-ignore

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

// Helper function to compare download object's startTime ISO timestamp with Date.now() since Chrome API is bugged for onCreated events
// See (https://bugs.chromium.org/p/chromium/issues/detail?id=432757)
function downloadAge(download: chrome.downloads.DownloadItem) {
  let date1 = new Date(Date.now())
  let date2 = new Date(download.startTime)
  let diff = date1.getTime()-date2.getTime()
  return diff / 1000 // in seconds
}

// Intercept downloads and ask to Scribe it
chrome.downloads.onCreated.addListener(function(item) {
  if (downloadAge(item) < 2 && item.state == "in_progress" && mimeTypes.includes(item.mime)) {
    chrome.downloads.cancel(item.id)
    let tabId: number | undefined
    chrome.windows.create({url: chrome.runtime.getURL("confirm.html"), type: "popup", width: 800, height: 600}, function(window) {
      // TODO send download file name to window because this doesn't work
      chrome.tabs.query({windowId: window!.id}, function(tabs) {
        if (tabs[0].id == null) {
          throw new Error("Confirmation window creation failed")
        } else {
          tabId = tabs[0].id
        }
      })
    })
    chrome.tabs.sendMessage(tabId!, {downloadName: item.filename, downloadURL: item.finalUrl})
    console.log("window created")
  }
})

// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "convert")
      console.log(request.downloadName + " 1 " + request.downloadURL)
    else if (request.action == "download")
      console.log(request.downloadName + " 2 " + request.downloadURL)
    else
      console.log("error")
})

// Helper function to build match patterns for extension URLs since Chrome API doesn't support regex
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