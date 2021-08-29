import { Color, PaperScope, Path, PathItem, Point, PointText, Rectangle, Size } from "paper/dist/paper-core";
import { Config } from "../../config/config";
import { BorderMode, ColorMode } from "../../controls/vectorControls";
import { KdNode } from "../../trees/kd/kdNode";
import { KdTree } from "../../trees/kd/kdTree";
import { QuadNode } from "../../trees/quad/quadNode";
import { QuadTree } from "../../trees/quad/quadTree";
import { VPNode } from "../../trees/vp/vpNode";
import { VPTree } from "../../trees/vp/vpTree";
import { colorToGrayScale, colorToHex, getColorFromHex } from "../../utils/colorUtil";
import { colorLerp, lerp } from "../../utils/lerp";
export class SVGBuilder{

    protected _scope!: paper.PaperScope;
    protected _width!: number;
    protected _height!: number;

    protected _maxLod!: number;
    protected _maxLevel!: number;
    protected _minArea!: number;
    protected _minUsedLevel!: number;
    protected _maxUsedLevel!: number;

    protected _background!: paper.PathItem;

    protected _tree!: VPTree | QuadTree | KdTree;
    protected _colorGroups!: Map<string, Array<string>>;
    protected _pattern!: string;

    protected _lastSvg!: string;

    constructor(){
        this._colorGroups = new Map<string, Array<string>>();
        this._lastSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    public buildFrom(tree: any, width: number, height: number, maxLod: number = 255, maxLevel: number = 15, minArea = 5): void{
        this._scope = new PaperScope();
        this._scope.setup(new Size(width, height));

        this._scope.activate();
        this._maxLod = maxLod;
        this._minArea = minArea;
        this._width = width;
        this._height = height;

        this._tree = tree;

        this._background = new Path.Rectangle(new Rectangle(new Point(0, 0), new Size(width, height)));
        this._background.fillColor = new Color(0,0,0);

        this._maxUsedLevel = 0;
        this._minUsedLevel = -1;
        this._maxLevel = maxLevel;

        if(this._tree.root == null) 
            return;
    
        this.buildTree();
    }

    public buildTree(){
        if(this._tree.clipPath == undefined)
            this._tree.clipPath = new Path.Rectangle(new Rectangle(new Point(0, 0), new Size(this._width, this._height)));
        
        let tree;
        switch(this._tree.constructor){
            case VPTree: tree = this._tree as VPTree;
                tree.nodeToSVG(tree.root as VPNode, this._background, 0, this._tree.clipPath, this);
                // tree.removeDetail();
                break;
            case QuadTree: tree = this._tree as QuadTree;
                tree.nodeToSVG(tree.root as QuadNode, 0, tree.clipPath as paper.PathItem, this);
                break;
            case KdTree: tree = this._tree as KdTree;
                tree.nodeToSVG(tree.root as KdNode, new Rectangle(new Point(0,0), new Point(this._width, this._height)), 0, tree.clipPath as paper.PathItem, this);
        }
        console.log('finished build');
    }

    public treeToSvg(){
        if(this._tree.root == null) 
            return;

        this._tree.allTreeNodes(this._tree.root).forEach((each: any) => {
            if(each.path !== null){
                if(each.path.children && each.path.children.length > 0)
                    each.path.children.forEach((item: paper.Item) => {
                        item.fillColor = each.path.fillColor;
                        this.exportToSvg(item, each, true);
                    });
                else
                    this.exportToSvg(each.path, each, false);
            }
        });
    }

    public exportToSvg(item: any, node: any, child: boolean){
        node.maxLevel = this._maxUsedLevel;
        node.minLevel = this._minUsedLevel;
        let part = (item.exportSVG({asString: true}) as string).replace('xmlns="http://www.w3.org/2000/svg" ', '').replace(
            ' stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"', 
            ''
        ).replace('  ', ' ');
        part = '\t' + part.slice(0, part.length-2) 
            + ' depth="' + node.depth 
            + '" segment="' + node.point?.segment
            + '" matting="' + node.point?.matting
            + '" saliency-a="' + node.point?.saliencyA
            + '" saliency-o="' + node.point?.saliencyO
            + '" level="' + node.level
            + '" min-level="' + node.minLevel
            + '" max-level="' + node._maxLevel
            + '" id="' + node.path.id
            + '"/>\n';
       
        let path = part.match(/path d="([^"]*)"/);
        if(path && path[1] == '')
            return;
        let regex = part.match(/(fill="[^"]*"\sfill-rule="nonzero")/);
        if(regex){
            part = part.replace(' ' + regex[0] + ' ', ' ');
            let color = regex[1];
            if(this._colorGroups.get(color) !== undefined)
                (this._colorGroups.get(color) as Array<string>).push(part);
            else
                this._colorGroups.set(color, [part]);
        }
    }

    public display(){
        let div = document.getElementById('svg-canvas') as HTMLDivElement;
        div.innerHTML = this.generateSVG();
    }

    public generateSVG(){
        let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 ' + this._width + ' ' + this._height + '">\n';
        let pathData = this.gatherCompletePathData();
        svg += pathData;
        // svg += '<defs>\n';
        // svg += '\t<image id="copyImg" x="0" y="0" width="' + this._width + '" height="' + this._height + '" href="'+ this._encoded_original_image + '"/>\n';
        // svg += this._pattern;
        // svg += '</defs>\n';
        svg += '</svg>';
        this._lastSvg = svg;
        return svg;
    }

    private gatherCompletePathData(){
        let svg = '';
        this._colorGroups.forEach((parts: Array<string>, color: string) => {
            if(parts.length > 0){
                svg += '<g ' + color + ' shape-rendering="geometricPrecision">\n';
                parts.forEach((part: string) => {
                    let path_string = part;
                    svg += path_string;

                    let id = 'img';
                    let idRegex = part.match(/id="([^"]*)"/);
                    if(idRegex)
                        id = 'img' + idRegex[1];
                    
                    this._pattern += '\t<pattern id="' + id + '" width="' + this._width + '" height="' + this._height + '" patternUnits="userSpaceOnUse">\n';
                    this._pattern += '\t\t<use href="#copyImg"/>\n';
                    this._pattern += '\t</pattern>\n'
                });
                svg += '</g>\n';
            }
        });
        return svg;
    }

    public applyAppearanceSettings(options?: {
        border0: number,
        border1: number,
        borderMode: number,
        colorMode: number,
        color0: string,
        color1: string
    }){

        let border0 = options? options.border0 : Config.getValue('border0') as number;
        let border1 = options? options.border1 : Config.getValue('border1') as number;
        let borderMode = options? options.borderMode : Config.getValue('borderMode') as number;
        let colorMode = options? options.colorMode : Config.getValue('colorMode') as number;
        let color0 = options? options.color0 : Config.getValue('color0') as string;
        let color1 = options? options.color1 : Config.getValue('color1') as string;

        this._colorGroups.forEach((parts: Array<string>, color: string) => {
            for(let i = 0; i < parts.length; i++){
                let part = parts[i];
                let strokeRegex = part.match(/stroke="([^"]*)"\sstroke-width="([^"]*)"/);
                let levelRegex = part.match(/level="([^"]*)"\smin-level="([^"]*)"\smax-level="([^"]*)"/);
                let colorRegex = part.match(/fill="([^"]*)"/);
                let originalColorRegex = color.match(/fill="([^"]*)"/);
                let idRegex = part.match(/id="([^"]*)"/);

                if(strokeRegex && strokeRegex.length >= 3 && levelRegex && levelRegex.length >= 4){

                    let stroke = strokeRegex[1];
                    let strokeWidth = strokeRegex[2];
                    let level = Number(levelRegex[1]);
                    let minLevel = Number(levelRegex[2])
                    let maxLevel = Number(levelRegex[3]);

                    let a = (level - minLevel) / (maxLevel - minLevel);
                    let newStrokeWidth = lerp(border0, border1, a).toString();

                    let updated = strokeRegex[0].replace('stroke="' + stroke + '"', 'stroke="' + this.borderModeToAttributeValue(a, color, borderMode, color0, color1) + '"');
                    updated = updated.replace('stroke-width="' + strokeWidth + '"', 'stroke-width="' + newStrokeWidth + '"');

                    let patternFill = 'url(#img)';
                    if(idRegex)
                        patternFill = 'url(#img' + idRegex[1] + ')';

                    if(colorRegex && colorRegex.length >= 2){
                        if(borderMode == BorderMode.FILL || borderMode == BorderMode.FILL_AND_BORDER){
                            if(colorMode == ColorMode.GRAY_SCALE && originalColorRegex){
                                let newColor = colorToHex(colorToGrayScale(getColorFromHex(originalColorRegex[1])));
                                parts[i] = parts[i].replace(colorRegex[1], newColor);
                            }else if(colorMode == ColorMode.WHITE){
                                parts[i] = parts[i].replace(colorRegex[1], '#ffffff');
                            }
                            else if(colorMode == ColorMode.IMAGE){
                                parts[i] = parts[i].replace(colorRegex[1], patternFill);
                            }
                            else{
                                parts[i] = parts[i].replace(' ' + colorRegex[0], '');
                            }
                        }else{
                            parts[i] = parts[i].replace(colorRegex[0], 'fill="none"');
                        }
                    }else if(borderMode == BorderMode.BORDER || borderMode == BorderMode.WIREFRAME)
                        updated += ' fill="none"';
                    else if(colorMode == ColorMode.GRAY_SCALE && originalColorRegex){
                        let newColor = colorToHex(colorToGrayScale(getColorFromHex(originalColorRegex[1])));
                        updated += ' fill="' + newColor + '"';
                    }else if(colorMode == ColorMode.WHITE){
                        updated += ' fill="#ffffff"'
                    }
                    else if(colorMode == ColorMode.IMAGE){
                        updated += ' fill="' + patternFill + '"';
                    }
                    parts[i] = parts[i].replace(strokeRegex[0], updated);
                }
            }
        });
    }

    private borderModeToAttributeValue(a: number, nodeColor: string, borderMode: BorderMode, color0: string, color1: string){
        switch(borderMode){
            case BorderMode.WIREFRAME:
                let colorRegex = nodeColor.match(/fill="(#[^"]*)"\sfill-rule="nonzero"/);
                if(colorRegex)
                    return colorRegex[1];
                break;
            case BorderMode.FILL:
                return 'none';
        }
        let color = colorLerp(getColorFromHex(color0), getColorFromHex(color1), a);
        return colorToHex(color);
    }

    private centroid(polygon: Array<[number, number]>): [number, number]{
        const length = polygon.length;
        return polygon.reduce(function(center, p, i) {
            center[0] += p[0];
            center[1] += p[1];
            if(i === length - 1) {
                center[0] /= length;
                center[1] /= length;
            }
            return center;
          }, [0, 0]);
    }

    public buildColoringTemplate(){
        const { pathDataToPolys } = require('svg-path-to-polygons');
        this._scope = new PaperScope();
        this._scope.setup(new Size(this._width, this._height));
        this._scope.activate();

        let items = new Map<paper.PointText, paper.PathItem>();
        let descriptions = new Array<paper.PointText>();


        let index = 0;
        let pos = new Point(20, this._height + 20);
        let x = 0;
        let y = 0;
        this._colorGroups.forEach((paths: string[], key: string) => {
            //legend
            y = (index % 5) * 20;
            x = Math.floor(index / 5) * 50;

            let text = new PointText(pos.add(new Point(x,y+15)));
            text.content = '' + (index + 1);
            text.justification = 'center';
            text.fontSize = 15;

            let colorRegex = key.match(/fill="([^"]*)"/);
            let color = new Color(1,1,1);
            if(colorRegex)
                color = getColorFromHex(colorRegex[1]);

            let rect = new Path.Rectangle(pos.add(new Point(x + 15, y)), new Size(20,20));
            rect.fillColor = color;
            rect.strokeColor = new Color(0,0,0);
            rect.strokeWidth = 1;

            items.set(text, rect);
            index++;

            //image
            paths.forEach((each: string) => {
                let idRegex = each.match(/id="([^"]*)"/);
                let pathRegex = each.match(/d="([^"]*)"/);
                if(pathRegex && idRegex){
                    let path = PathItem.create(pathRegex[1]);
                    
                    let poly = pathDataToPolys(pathRegex[1], 10, {tolerance:1, decimals:1});

                    if(path.area > 5){
                        
                        // let point = PathItem.create(pathRegex[1]).interiorPoint;
                        let point = new Point(this.centroid(poly[0]));
                        let desc = new PointText(point);
                        desc.content = '' + index;
                        desc.justification = 'center';
                        desc.fontSize = 8;
                        desc.strokeColor = new Color(0.639, 0.639, 0.639);
                        desc.strokeWidth = 0.3;

                        descriptions.push(desc);
                    }
                }
            });
        });
        const legendHeight = 120;
        let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + this._width + '" height="' + (this._height + legendHeight) + '" version="1.1">\n';
        
        svg += this.gatherCompletePathData();
        descriptions.forEach((desc: paper.PointText) => {
            svg += (desc.exportSVG({asString: true}) as string) + '\n';
        });
        items.forEach((value: paper.PathItem, key: paper.PointText) => {
            svg += (key.exportSVG({asString: true}) as string) + '\n';
            svg += (value.exportSVG({asString: true}) as string) + '\n';
        });
        svg += '</svg>';

        let link = document.createElement("a");
        link.download = 'legend.svg';
        link.href = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
        link.click();
    }

    public isEmpty(){
        return this._colorGroups.size == 0;
    }

    public reset(){
        this._colorGroups = new Map<string, Array<string>>();
        this._pattern = '';
    }

    public get maxLevel(){
        return this._maxLevel;
    }

    public get minArea(){
        return this._minArea;
    }

    public get minUsedLevel(){
        return this._minUsedLevel;
    }

    public set minUsedLevel(level: number){
        this._minUsedLevel = level;
    }

    public get maxUsedLevel(){
        return this._maxUsedLevel;
    }

    public set maxUsedLevel(level: number){
        this._maxUsedLevel = level;
    }

    public get colorGroups(){
        return this._colorGroups;
    }

    public get lastSVG(){
        return this._lastSvg;
    }

    public get tree(){
        return this._tree;
    }
}