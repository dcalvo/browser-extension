let downloadObj: any = null // actually a JSON object containing info about the downloaded file from the background script

// window initialization that builds our download JSON object
if (window.location.hash) {
    const downloadInfo = JSON.parse(atob(window.location.hash.substring(1))) // we remove the # and use atob to decode base64
    const downloadName = downloadInfo.downloadURL.substring(downloadInfo.downloadURL.lastIndexOf('/') + 1).replace(/[\#\?].*$/, '')

    downloadObj = JSON.parse(`{"downloadURL":"${downloadInfo.downloadURL}", "downloadName":"${downloadName}", "downloadID":"${downloadInfo.downloadID}"}`)

    // logging to be removed
    console.log(downloadObj)

} else {
    console.log("window.location.hash error")
}

// button handlers
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("convert-with-scribe")?.addEventListener("click", convertWithScribe)
    document.getElementById("continue-download")?.addEventListener("click", continueDownload)
    document.getElementById("downloadName")!.innerHTML = `Would you like to convert or download "${downloadObj.downloadName}" from`
    document.getElementById("downloadUrl")!.innerHTML = `${downloadObj.downloadURL}`
})

// handler for Escape-key exiting
document.addEventListener('keydown', function (event) {
    if (event.key == "Enter") {
        convertWithScribe()
    } else if (event.key == "Escape") {
        continueDownload()
    }
})

let continueDownloadOnExit: boolean = true // used to decide if we auto-continue the download on window exit
// handler used to ensure we always continue the user's download by default on window exit
window.addEventListener('beforeunload', function (event) {
    if (continueDownloadOnExit) {
        continueDownload()
    }
})

function convertWithScribe() {
    chrome.runtime.sendMessage({
        action: "convert",
        downloadURL: downloadObj.downloadURL,
        downloadName: downloadObj.downloadName,
        downloadID: downloadObj.downloadID
    })
    continueDownloadOnExit = false
    window.close()
}

function continueDownload() {
    if (downloadObj != null) {
        chrome.runtime.sendMessage({
            action: "download",
            downloadURL: downloadObj.downloadURL,
            downloadName: downloadObj.downloadName,
            downloadID: downloadObj.downloadID
        })
    }
    continueDownloadOnExit = false // required otherwise we fall into an infinite loop
    window.close()
}