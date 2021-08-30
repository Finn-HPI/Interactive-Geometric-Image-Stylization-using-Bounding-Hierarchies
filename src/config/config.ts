import { Layer } from "../building/layer/layer";
import { defaultApplyIgnore, defaultValues } from "./default";
import { LayerControls } from "../controls/layerControls";
import { colorModeToString, criteriaToString, dataStructureToString, stringToColorMode, stringToCriteria, stringToDataStructure } from "../utils/conversionUtil";
import { Path, PathItem } from "paper/dist/paper-core";

export interface ValueItem {
    name: string,
    value: number | string
};

interface LayerItem {
    num: number,
    criteria: string,
    color: string,
    tree: string,
    from: number,
    to: number,
    maxLevel: number,
    minArea: number,
    paths: string[],
    scaling: [number, number]
}

interface ConfigFormat{
    input: Array<ValueItem>,
    layers: Array<LayerItem>
}

export class Config {

    static _applyIgnore = defaultApplyIgnore();

    static _htmlElements = new Map<string, HTMLInputElement|HTMLSelectElement>();
    static _layerControls: LayerControls;

    static _noiseData = new Uint8Array();
    static _needsRefresh = true;

    static _config: ConfigFormat = {
        input: new Array<ValueItem>(),
        layers: new Array<LayerItem>()
    }

    static _nextLayerNum = 0;
    static _layers = new Map<Layer, [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement]>();

    static setDefault(){
        this._config.input.push(
            ...defaultValues()
        );
    }

    static applyConfig(){
        this._applyIgnore = defaultApplyIgnore();

        this._config.input.forEach((item: ValueItem) => {
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", false, true);
            let element = Config.getHtmlElement(item.name);
            if(element instanceof HTMLInputElement)
                element.value = String(item.value);
            if(element instanceof HTMLSelectElement)
                element.selectedIndex = Number(item.value);
            if(element)
                element.dispatchEvent(evt);
        });

        this._needsRefresh = true;

        this._nextLayerNum = 0;
        this._layers = new Map<Layer, [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement]>();
        
        if(this._config.layers.length > 0){
            this._layerControls.applySettings().then((res) => {
                Config.needsRefresh = false;
                this._config.layers.forEach((item: LayerItem) => {
                    let layer = new Layer(
                        stringToDataStructure(item.tree),
                        stringToCriteria(item.criteria),
                        item.from,
                        item.to,
                        item.maxLevel,
                        item.minArea,
                        stringToColorMode(item.color)
                    );
                    this._layerControls.createLayer(layer, false, false);
                    
                    this._layerControls.acitvateScope();
                    item.paths.forEach((pathData: string) => {
                        layer.addPathArea(new Path(pathData), false);
                    });

                    layer.scaleX = item.scaling[0];
                    layer.scaleY = item.scaling[1];
                });
            });
        }
    }

    static register(name: string, element: HTMLInputElement|HTMLSelectElement){
        this._htmlElements.set(name, element);
    }

    static registerList(list: {name: string, element: HTMLInputElement|HTMLSelectElement}[]) {
        for(let i = 0; i < list.length; i++)
            this._htmlElements.set(list[i].name, list[i].element);
    }   

    static updateValue(name: string, value: number | string): boolean{
        let changed = false;
        let index = this._config.input.findIndex((item: ValueItem) => {
            return item.name === name
        });
        if(index != -1){
            if(this._config.input[index].value != value)
                changed = true;
            this._config.input[index].value = value;
        }else{
            this._config.input.push({name: name, value: value});
            changed = true;
        }
        return changed;
    }

    static updateValues(items: Array<[string, number | string]>){
        let changed = false;
        items.forEach((item: [string, number | string]) => {
            let result = this.updateValue(item[0], item[1]);
            changed ||= result;
        });
        return changed;
    }

    static getValue(name: string){
        const item = this._config.input.find((element: ValueItem) => {
            return element.name === name;
        });
        if(item)
            return item.value;
        return 0;
    }

    static exportConfig(){
        let link = document.createElement("a");
        link.download = 'config.json';
        link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this._config, null, 2));
        link.click();
    }

    static importConfig(config: any){
        try {
            this.removeAllLayers();
            this._config = config;
            this.applyConfig();
        }
        catch (e) {
            console.log('Error: imported config has wrong format!');
        }
    }

    static addLayer(layer: Layer, row: HTMLElement, show: HTMLButtonElement, clip: HTMLButtonElement, remove: HTMLButtonElement, addToConfig = true){
        this._layers.set(layer, [this._nextLayerNum, row, show, clip, remove]);

        let prev = this.getLayerWithNum(this._nextLayerNum - 1);
        if(prev){
            layer.prevLayer = prev;
            prev.nextLayer = layer;
        }

        if(addToConfig)
            this._config.layers.push({
                num: this._nextLayerNum,
                criteria: criteriaToString(layer.criteria),
                color: colorModeToString(layer.colorMode),
                tree: dataStructureToString(layer.structure),
                from: layer.from,
                to: layer.to,
                maxLevel: layer.maxLevel,
                minArea: layer.minArea,
                paths: [],
                scaling: [1,1]
            });
        this._nextLayerNum++;
    }

    static getLayerWithNum(num: number): Layer | null {
        let layer = null;
        this._layers.forEach((value: [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement], key: Layer) => {
            if(value[0] === num)
                layer = key;
        });
        return layer;
    }

    static removeAllLayers(){
        this._layers.forEach((item: [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement], key: Layer) => {
            this.removeLayer(key);
        });
        this._layers.clear();
    }

    static removeLayer(layer: Layer){
        let rLayer = this._layers.get(layer);
        if(!rLayer) return;

        if(layer.prevLayer)
            layer.prevLayer.nextLayer = layer.nextLayer;
        if(layer.nextLayer)
            layer.nextLayer.prevLayer = layer.prevLayer;

        rLayer[1].remove();
        rLayer[2].remove();
        rLayer[3].remove();
        rLayer[4].remove();

        let num = rLayer[0];
        this._layers.delete(layer);

        this._layers.forEach((item: [number, HTMLElement, HTMLButtonElement, HTMLButtonElement, HTMLButtonElement]) => {
            if(item[0] > num)
                item[0]--;
        });

        for(let i = 0; i < this._config.layers.length; i++){
            let layerI = this._config.layers[i];
            if(layerI.num > num){
                layerI.num--;
                this._config.layers[i] = layerI;
            }
        }

        let index = this._config.layers.findIndex((item: LayerItem) => {
           return item.num == num; 
        });
        if(index > -1)
            this._config.layers.splice(index, 1);
        this._nextLayerNum--;
    }

    static getHtmlElement(name: string){
        return this._htmlElements.get(name);
    }

    static setScaleOfLayer(scaling: [number, number], layer: Layer){
        let layerI = this.getLayerItem(layer);
        if(layerI)
            layerI.scaling = scaling;
    }

    static addPathToLayer(area: paper.Path, layer: Layer){
        let layerI = this.getLayerItem(layer);
        if(layerI)
            layerI.paths.push(area.pathData);
    }

    static removePathFromLayer(pathIndex: number, layer: Layer){
        let layerI = this.getLayerItem(layer);
        if(layerI)
            layerI.paths.splice(pathIndex, 1);
    }

    static getLayerItem(layer: Layer){
        let layerParts = this.layers.get(layer);
        if(!layerParts)
            return null;
        
        const index = layerParts[0];
        if (index > -1)
            return this._config.layers[index]
        return null;
    }

    static get config(){
        return this._config;
    }

    static get layers(){
        return this._layers;
    }

    static seed(){
        this.getValue('seed');
    }

    static get noiseData(){
        return this._noiseData;
    }

    static set needsRefresh(refreshed: boolean){
        this._needsRefresh = refreshed;
    }

    static get needsRefresh(){
        return this._needsRefresh;
    }

    static set noiseData(noiseData: Uint8Array){
        this._noiseData = noiseData;
    }

    static set layerControls(controls: LayerControls){
        this._layerControls = controls;
    }

    static applyIgnore(name: string){
        return this._applyIgnore.get(name);
    }

    static setApplyIgnore(name: string, value = false){
        this._applyIgnore.set(name, value);
    }
}
