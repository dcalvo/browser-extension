// @ts-ignore
// button handlers
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("convert-with-scribe")?.addEventListener("click", convertWithScribe)
    document.getElementById("continue-download")?.addEventListener("click", continueDownload)
})

// Listener for filename and download URL
let downloadName:string = ""
let downloadURL:string = ""
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(request)
        if (request.downloadName != null && request.downloadURL != null) {
          downloadName = request.downloadName
          downloadURL = request.downloadURL
      }
})

function convertWithScribe() {
    if (downloadName != null && downloadURL != null) {
        chrome.runtime.sendMessage({action: "convert", downloadName: downloadName, downloadURL: downloadURL})
    } else {
        console.log("downloadName or downloadURL is invalid")
    }
}

function continueDownload() {
    if (downloadName != null && downloadURL != null) {
        chrome.runtime.sendMessage({action: "download", downloadName: downloadName, downloadURL: downloadURL})
    } else {
        console.log("downloadName or downloadURL is invalid")
    }
}

// TODO receive download filename from background and send appropiate responses back