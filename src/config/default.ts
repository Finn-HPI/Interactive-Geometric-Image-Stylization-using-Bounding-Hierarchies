import { Color } from "paper/dist/paper-core";
import { ValueItem } from "./config";

export function defaultApplyIgnore(): Map<string, boolean>{
    return new Map<string, boolean>([
        ['input', true],
        ['importance', true],
        ['seeding', true]
    ]);
}

export function defaultValues(): ValueItem[]{
    return [
        //3d
        {name: 'exportMode', value: 1},
        //input
        {name: 'image', value: 0},
        {name: 'layer', value: 0},
        //importance map global
        {name: 'depth', value: 0.3},
        {name: 'matting', value: 0.3},
        {name: 'saliencya', value: 0.5},
        {name: 'saliencyo', value: 0.3},
        {name: 'normal', value: 0.3},
        {name: 'normalx', value: 0.5},
        {name: 'normaly', value: -0.35},
        {name: 'normalz', value: 0.3},
        //importance map local
        {name: 'intensity', value: 0.5},
        {name: 'brushSize', value: 3},
        //sampling
        {name: 'samplingMode', value: 0},
        {name: 'minDist', value: 4},
        {name: 'maxTries', value: 42},
        {name: 'probability', value: 0.3},
        {name: 'maxColorCount', value: 64},
        {name: 'seed', value: '4cdfe1e5-1fdd-4cf0-8cf3-31f757f69d44'},
        //layer
        {name: 'criteria', value: 0},
        {name: 'tree', value: 0},
        {name: 'from', value: 0},
        {name: 'to', value: 255},
        {name: 'color', value: 0},
        {name: 'maxLevel', value: 15},
        {name: 'minArea', value: 20},
        //vector
        {name: 'colorMode', value: 0},
        {name: 'borderMode', value: 1},
        {name: 'border0', value: 0.3},
        {name: 'border1', value: 0.3},
        {name: 'color0', value: '#000000'},
        {name: 'color1', value: '#000000'},
        //global
        {name: 'maxRecursionDepth', value: 10},
    ];
}