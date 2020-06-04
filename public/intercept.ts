// @ts-ignore
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("convert-with-scribe")?.addEventListener("click", convert)
    document.getElementById("continue-download")?.addEventListener("click", download)
})

function convert() {
    alert("scribe")
}

function download() {
    alert("download")
}

// TODO receive download filename from background and send appropiate responses back