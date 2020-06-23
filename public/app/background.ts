// @ts-ignore
// The above line is used to suppress the error that "all files must be modules" which I don't know how to fix

// Base URL that relative URLs are added onto
let baseUrl = "https://scribeit.io"
let uploadUrl = "/extension/api/documents"
let welcomeUrl = "/extension/start"

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

// Helper function to check if the given URL is a supported filetype
function isSupported(url: string | undefined) {
  let urlFileExtension = '.' + url?.substring(url.lastIndexOf('.') + 1)
  return fileExtensions.includes(urlFileExtension)
}

// Listener for URL changes so we can display pageAction correctly
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (isSupported(tab.url)) {
    chrome.pageAction.show(tabId)
  }
})

// Listener for when the Scribe toolbar button is clicked
chrome.pageAction.onClicked.addListener(function (tab) {
  convert(tab.url!)
})

// Helper function to compare download object's startTime ISO timestamp with Date.now() since Chrome API is bugged for onCreated events
// See (https://bugs.chromium.org/p/chromium/issues/detail?id=432757)
function downloadAge(download: chrome.downloads.DownloadItem) {
  let date1 = new Date(Date.now())
  let date2 = new Date(download.startTime)
  let diff = date1.getTime() - date2.getTime()
  return diff / 1000 // in seconds
}

// Intercept downloads and ask to Scribe it
chrome.downloads.onCreated.addListener(function (item) {
  if (
    downloadAge(item) < 2 && item.state == "in_progress" &&
    (mimeTypes.includes(item.mime) || isSupported(item.finalUrl))
  ) {
    chrome.downloads.pause(item.id)
    const downloadInfo = `{"downloadURL":"${item.finalUrl}", "downloadID":"${item.id}"}` // we use btoa() to encode in base64
    chrome.windows.create({ url: chrome.runtime.getURL("confirm.html#" + btoa(downloadInfo)), type: "popup", width: 800, height: 600 })
  }
})

// Listener for download intercept confirmation window
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let downloadId: number = parseInt(request.downloadID)
  if (request.action == "convert") {
    chrome.downloads.search({ id: downloadId }, function (download) {
      if (download[0].state == "complete") { // Fix to ensure we still clean up tiny files we were too slow to intercept and pause
        chrome.downloads.removeFile(downloadId)
      } else {
        chrome.downloads.cancel(downloadId)
      }
      chrome.downloads.erase({ id: downloadId }, function () {
        convert(request.downloadURL)
      })
    })
  } else if (request.action == "download") {
    chrome.downloads.search({ id: downloadId }, function (download) {
      if (download[0].state != "complete") {
        chrome.downloads.resume(downloadId)
      }
    })
  } else {
    console.log("download interception error")
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
  onclick: function (info) {
    convert(info)
  },
  targetUrlPatterns: matchedUrls
})

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

async function submitDocument(formData: FormData) {
  let response = await fetch(baseUrl + uploadUrl, {
    method: "POST",
    credentials: "include",
    body: formData
  })
  let data = await response.json()
  return data
}

// WIP convert process
function convert(url: string | chrome.contextMenus.OnClickData) {
  // Handle URL extraction from onClick events
  if (typeof url == "object") {
    if (url.linkUrl) {
      url = url.linkUrl
    } else if (url.mediaType == "image") {
      url = url.srcUrl!
    } else {
      console.log("onClick URL retrieval error")
    }
  }

  let formData = new FormData() as any

  const urlScheme = (url as string).substring(0, (url as string).indexOf(':'))
  if (urlScheme == "http" || urlScheme == "https") {
    formData.append("document[url]", (url as string))
  } else {
    formData.append("document[file]", File) // TODO handle file uploading
  }

  submitDocument(formData).then(response => {
    alert(JSON.stringify(response))
    if (!response.hasOwnProperty("errors")) {
      chrome.tabs.create({url: baseUrl + response.document_url})
    } else {
      if (response.errors.hasOwnProperty("url")) {
        alert("cant access url") // TODO handle file download/reupload for inaccessible URLs
      }
    }
  }).catch(error => console.log("submitDocument error: " + error))
  // temp examples
  //{"document_url":"/documents/e5113747-6b4b-4b1a-b69b-c8ac4d884893/html"}
  //{"errors":{"url":"Scribe couldn't retrieve a document from this URL."}}

}