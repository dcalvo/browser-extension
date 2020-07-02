// Base URL that relative URLs are added onto
let baseUrl = "https://scribeit.io"
let uploadUrl = "/extension/api/documents"
let welcomeUrl = "/extension/start"

// Show welcome page to user on install
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.tabs.create({ url: baseUrl + welcomeUrl })
  }
})

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

// Listener for URL changes so we can display browserAction correctly
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url) {
    if (isSupported(tab.url)) {
      chrome.browserAction.setIcon({
        tabId: tabId, path: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      })
      chrome.browserAction.enable(tabId)
    } else {
      chrome.browserAction.setIcon({
        tabId: tabId, path: {
          "16": "icons/gray16.png",
          "48": "icons/gray48.png",
          "128": "icons/gray128.png"
        }
      })
      chrome.browserAction.disable(tabId)
    }
  }
})

// Listener for when the Scribe toolbar button is clicked
chrome.browserAction.onClicked.addListener(async function (tab) {
  if (tab.url) {
    chrome.browserAction.setBadgeText({ text: "Converting...", tabId: tab.id })
    chrome.browserAction.disable(tab.id)
    await convert(tab.url)
    chrome.browserAction.setBadgeText({ text: "", tabId: tab.id })
    chrome.browserAction.enable(tab.id)
  }
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
        chrome.downloads.resume(downloadId) // TODO fix pdf frame download bug
      }
    })
  } else {
    console.log("intercept.js response error")
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

function fetchLocal(url: string): Promise<Response> {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest
    xhr.onload = function () {
      resolve(new Response(xhr.response))
    }
    xhr.onerror = function () {
      reject(new TypeError('Local request failed'))
    }
    xhr.open('GET', url)
    xhr.responseType = "blob"
    xhr.withCredentials = true
    xhr.send(null)
  })
}

async function getFileFromUrl(url: string) {
  const urlScheme = (url as string).substring(0, (url as string).indexOf(':'))
  let fileName = url.substring(url.lastIndexOf('/') + 1) // TODO fix this and maybe use UUID?
  let file: any
  if (urlScheme == "file") {
    file = await fetchLocal(url).then(response => response.blob()).then(blobFile => {
      return new File([blobFile], fileName, { type: blobFile.type })
    }).catch(err => console.log("fetchLocal error: " + err))
  } else {
    file = await fetch(url).then(response => response.blob()).then(blobFile => {
      return new File([blobFile], fileName, { type: blobFile.type })
    }).catch(err => console.log("getFileFromUrl error: " + err))
  }
  return file
}

async function constructFormData(url: string, forceDownload = false) {
  let formData = new FormData() as any
  const urlScheme = (url as string).substring(0, (url as string).indexOf(':'))
  if (!forceDownload && (urlScheme == "http" || urlScheme == "https")) {
    formData.append("document[url]", (url as string))
  } else {
    formData.append("document[file]", await getFileFromUrl(url as string))
  }
  return formData
}

async function submitDocument(formData: FormData) {
  let response = await fetch(baseUrl + uploadUrl, {
    method: "POST",
    credentials: "include",
    body: formData
  })
  let data = await response.json()
  return data
}

function handleServerResponse(response: any) {
  if (!response.hasOwnProperty("errors")) {
    chrome.tabs.create({ url: baseUrl + response.document_url })
    return true // successful conversion
  } else {
    if (response.errors.hasOwnProperty("url")) {
      return false
    }
  }
  return false
}

// WIP convert process
async function convert(url: string | chrome.contextMenus.OnClickData) {
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

  let formData = await constructFormData(url as string)

  let response = await submitDocument(formData)

  // temp debug TODO remove
  alert(JSON.stringify(response))

  let retries = 3
  let success = false

  while (retries-- > 0 && !(success = handleServerResponse(response))) {
    formData = await constructFormData(url as string, true) // force download/upload of the doc
    response = await submitDocument(formData)
    alert("retries: " + retries)
  }
}

  // temp examples
  //{"document_url":"/documents/e5113747-6b4b-4b1a-b69b-c8ac4d884893/html"}
  //{"errors":{"url":"Scribe couldn't retrieve a document from this URL."}}


  //scenarios
  //we have a public accessible url. we can convert. PASSED
  //we have a private unaccessible url. we need to fetch file (with creds) then upload as document. Semi/passed: some errors after uploading to server
  //we have a local file. we need to locate it on file system then upload as document. TODO
  //we need getFileFromUrl() which checks if its file:// or not. if true: search file system. else: use fetch api