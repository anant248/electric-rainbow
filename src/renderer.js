window.onload = function() {
    const counter = document.getElementById('counter')

    window.electronAPI.onUpdateCounter((_event, value) => {
        counter.innerText = value
    })
}