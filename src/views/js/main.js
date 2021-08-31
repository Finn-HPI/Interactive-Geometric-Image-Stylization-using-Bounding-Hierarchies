let app;

function onDOMLoaded(){
    app = new Application();
    app.startApplication();

    window.onhashchange = function(){
        render(window.location.hash);
        app.changePage(window.location.hash);
    };
    
    render('#vector');
}

function render(hashKey) {

    const unselected = '#23272b';
    const selected = '#0069d9';

    let pages = document.querySelectorAll('.page');
    for (let i = 0; i < pages.length; ++i)
        pages[i].style.display = 'none';

    let tabs = document.querySelectorAll(".tab");
    for (let i = 0; i < tabs.length; ++i)
        tabs[i].style.backgroundColor = unselected;

    let pointCanvas = document.getElementById('point-canvas');
    let layerCanvas = document.getElementById('layer-canvas');
    let clipCanvas = document.getElementById('clip-canvas');
    let maskCanvas = document.getElementById('mask-canvas');
    let svgCanvas = document.getElementById('svg-canvas');
    let gltfCanvas = document.getElementById('gltf-canvas');
    let gltfBackCanvas = document.getElementById('gltf-background-canvas');

    pointCanvas.style.display = 'none';
    layerCanvas.style.display = 'none';
    clipCanvas.style.display = 'none';
    maskCanvas.style.display = 'none';
    svgCanvas.style.display = 'none';
    gltfCanvas.style.display = 'none';
    gltfBackCanvas.style.display = 'none';

    switch(hashKey){
        case '':
            svgCanvas.style.display = 'block';
            pages[0].style.display = 'block';
            tabs[0].style.backgroundColor = selected;
            break;
        case '#vector':
            svgCanvas.style.display = 'block';
            pages[0].style.display = 'block';
            tabs[0].style.backgroundColor = selected;
            break;
        case '#input':
            pages[1].style.display = 'block';
            tabs[1].style.backgroundColor = selected;
            break;
        case '#importance-map':
            maskCanvas.style.display = 'block';
            pages[2].style.display = 'block';
            tabs[2].style.backgroundColor = selected;
            break;
        case '#layer':
            layerCanvas.style.display = 'block';
            clipCanvas.style.display = 'block';
            pages[3].style.display = 'block';
            tabs[3].style.backgroundColor = selected;
            break;
        case '#sampling':
            pointCanvas.style.display = 'block';
            pages[4].style.display = 'block';
            tabs[4].style.backgroundColor = selected;
            break;
        case '#3d':
            gltfCanvas.style.display = 'block';
            gltfBackCanvas.style.display = 'block';
            pages[5].style.display = 'block';
            tabs[5].style.backgroundColor = selected;
            break;
        case '#coloring-book':
            svgCanvas.style.display = 'block';
            pages[6].style.display = 'block';
            tabs[6].style.backgroundColor = selected;
            break;
        default:
            pages[0].style.display = 'block';
            tabs[0].style.backgroundColor = selected;
    }
}