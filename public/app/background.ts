// @ts-ignore
// The above line is used to suppress the error that "all files must be modules" which I don't know how to fix
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

// Listener for URL changes so we can display pageAction correctly
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  let urlFileExtension = '.' + tab.url?.substr(tab.url.lastIndexOf('.') + 1)
  if (fileExtensions.includes(urlFileExtension)) {
    chrome.pageAction.show(tabId)
  }
})


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
    chrome.downloads.pause(item.id)
    const downloadInfo = `{"downloadURL":"${item.finalUrl}", "downloadID":"${item.id}"}` // we use btoa() to encode in base64
    chrome.windows.create({url: chrome.runtime.getURL("confirm.html#" + btoa(downloadInfo)), type: "popup", width: 800, height: 600})
  }
})

// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(  // TODO logic for routing action
  function(request, sender, sendResponse) {
    if (request.action == "convert"){
      chrome.downloads.cancel(parseInt(request.downloadID))
      convert()
    } else if (request.action == "download") {
      chrome.downloads.resume(parseInt(request.downloadID))
    } else {
      console.log("error")
    }
})

// Helper function to build match patterns for extension URLs since Chrome API doesn't support regex
function matchedUrlListBuilder() {
  let matchedUrls: Array<string> = []
  for (let extension of fileExtensions) {
    matchedUrls.push("*://*/*" + extension)
  }

  return matchedUrls
}

// Create context menu option for images and links
let matchedUrls = matchedUrlListBuilder()
chrome.contextMenus.create({
      title: "Convert with Scribe",
      contexts: ["image", "link"],
      onclick: function() {
        alert("image or link")
      },
      targetUrlPatterns: matchedUrls
})

// Create context menu option for valid stand-alone file pages which we'll hide/show as necessary
chrome.contextMenus.create({
  id: "pageActionContext", // this context menu option is essentially tethered to whether the pageAction button is lit up
  title: "Convert with Scribe",
  contexts: ["all"],
  onclick: function() {
    alert("url")
  },
  documentUrlPatterns: matchedUrls
})
// TODO context menu option for page action valid pages since visible selector is bugged in contextMenus.update
/* ANOTHER CHROME BUG AAAAAAAAAAA
// Listener for active tab URL so we can hide/show pageActionContext option
chrome.tabs.onActivated.addListener(function(activeInfo) {
  let tab = chrome.tabs.get(activeInfo.tabId, function(tab) {
    let urlFileExtension = '.' + tab.url?.substr(tab.url.lastIndexOf('.') + 1)
    if (fileExtensions.includes(urlFileExtension)) {
      chrome.contextMenus.update("pageActionContext", {visible: true})
    } else {
      chrome.contextMenus.update("pageActionContext", {visible: false})
    }
  })
})
*/
// Placeholder for eventual convert process
function convert() {
  alert("converted!")
}