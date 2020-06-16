// @ts-ignore
// button handlers
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("convert-with-scribe")?.addEventListener("click", convertWithScribe)
    document.getElementById("continue-download")?.addEventListener("click", continueDownload)
})

// Listener for filename and download URL
let downloadName: string
let downloadURL: string

if (window.location.hash) {
    const downloadInfo = JSON.parse(atob(window.location.hash.substr(1))) // we remove the # and use atob to decode base64
    downloadURL = downloadInfo.downloadURL
    downloadName = downloadURL.substr(downloadURL.lastIndexOf('/') + 1)
    // logging to be removed
    console.log(downloadURL)
    console.log(downloadName)
    console.log(downloadInfo)
} else {
    console.log("window.location.hash error")
}

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