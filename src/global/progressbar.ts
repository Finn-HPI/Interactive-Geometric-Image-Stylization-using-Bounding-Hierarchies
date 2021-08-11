export function setProgress(progress: number){
    let progressbar = document.getElementById('progress-bar') as HTMLInputElement;
    progressbar.style.width = String(progress * 100) + '%';
    progressbar.value = String(progress * 100);
}