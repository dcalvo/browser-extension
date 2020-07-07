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

// Disable browserAction on extension startup
// This is done to prevent clicking the browserAction on invalid pages
window.onload = function () {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach(tab => {
      chrome.browserAction.disable(tab.id)
    })
  })

  checkIfCredentialed()
}



// TODO this is only a temporary fix for requiring users to have credentials to convert
async function checkIfCredentialed() {
  let response = await fetch(baseUrl + uploadUrl, { method: "POST", credentials: "include" })
  if (response.redirected) {
    chrome.tabs.create({ url: baseUrl + "/auth" })
    return false
  } else {
    return true
  }
}

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

// Helper function to extract the filename with filetype from URL
function getFileName(url: string) {
  const fileName = url.substring(url.lastIndexOf('/') + 1).replace(/[\#\?].*$/, '')
  return fileName
}

// Helper function to check if the given URL is a supported filetype
function isSupported(url: string) {
  const fileName = getFileName(url)
  let urlFileExtension = fileName.substring(fileName.lastIndexOf('.'))
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
let tabsConverting: Array<number> = []
chrome.browserAction.onClicked.addListener(async function (tab) {
  if (!tabsConverting.includes(tab.id) && tab.url) {
    tabsConverting.push(tab.id)

    await convert(tab.url)

    tabsConverting.splice(tabsConverting.indexOf(tab.id), 1) // Remove completed convert tab
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

// Listener for content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.hasOwnProperty("action")) {
    downloadIntercept(request)
  } // else if (request.hasOwnProperty("command"))
})

// Download confirmation window handler
function downloadIntercept(request) {
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
}
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
    // Handle URL extraction from onClick events
    if (info.linkUrl) {
      convert(info.linkUrl)
    } else if (info.mediaType == "image") {
      convert(info.srcUrl)
    } else {
      console.log("onClick URL retrieval error")
    }
  },
  targetUrlPatterns: matchedUrls
})

// XMLHttpRequest is used due to fetch() API not being implemented for file:// URIs
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

// Called when we have a local file, file behind an intranet, or the server fails to download a file for any other reason
async function getFileFromUrl(url: string) {
  const urlScheme = url.substring(0, url.indexOf(':'))
  let fileName = getFileName(url)
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

// Create the formData format with either URL or document binary as described in the spec
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

// POST to Scribe server as described in spec
// Note: most of the wait in the extension is tied up awaiting the fetch()
async function submitDocument(formData: FormData) {
  let response = await fetch(baseUrl + uploadUrl, {
    method: "POST",
    credentials: "include",
    body: formData
  })
  let data = await response.json()
  return data
}

// Used for error handling from the Scribe server and ensuring we know that a conversion was successful
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

// Main convert function which lets each caller handle their own URL extraction
// url should be the final url of the resource after any redirects
let activeConverts = 0;
async function convert(url: string) {
  activeConverts++
  chrome.browserAction.setBadgeText({ text: activeConverts.toString() })
  chrome.browserAction.setTitle({ title: `Converting ${activeConverts} document(s)...` })

  // TODO remove temporary fix
  let credentialed = await checkIfCredentialed()
  if (!credentialed) {
    alert("Please log into the Scribe conversion service and reinitiate your document conversion.")
    activeConverts--
    if (activeConverts == 0) {
      chrome.browserAction.setBadgeText({ text: "" })
      chrome.browserAction.setTitle({ title: "Convert with Scribe" })
    } else {
      chrome.browserAction.setBadgeText({ text: activeConverts.toString() })
      chrome.browserAction.setTitle({ title: `Converting ${activeConverts} document(s)...` })
    }
    return
  }

  let formData = await constructFormData(url as string)

  let response = await submitDocument(formData)

  let retries = 3
  let success = false

  while (retries-- > 0 && !(success = handleServerResponse(response))) {
    formData = await constructFormData(url as string, true) // force download/upload of the doc
    response = await submitDocument(formData)
  }

  activeConverts--
  if (activeConverts == 0) {
    chrome.browserAction.setBadgeText({ text: "" })
    chrome.browserAction.setTitle({ title: "Convert with Scribe" })
  } else {
    chrome.browserAction.setBadgeText({ text: activeConverts.toString() })
    chrome.browserAction.setTitle({ title: `Converting ${activeConverts} document(s)...` })
  }
}

// TODO In cases of one-time downloads, we need a different way of handling those files (mirror downloaded data?)
// TODO hotkey in right click menu (oncontextMenu event and e.target)
// TODO send system notifications during convert