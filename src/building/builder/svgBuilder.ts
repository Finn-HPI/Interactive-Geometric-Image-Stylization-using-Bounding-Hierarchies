import { Color, PaperScope, Path, Point, Rectangle, Size } from "paper/dist/paper-core";
import { KdNode } from "../../trees/kd/kdNode";
import { KdTree } from "../../trees/kd/kdTree";
import { QuadNode } from "../../trees/quad/quadNode";
import { QuadTree } from "../../trees/quad/quadTree";
import { VPNode } from "../../trees/vp/vpNode";
import { VPTree } from "../../trees/vp/vpTree";
export class SVGBuilder{

    protected _scope!: paper.PaperScope;
    protected _width!: number;
    protected _height!: number;

    protected _maxLod!: number;
    protected _maxLevel!: number;
    protected _minUsedLevel!: number;
    protected _maxUsedLevel!: number;

    protected _background!: paper.PathItem;

    protected _tree!: VPTree | QuadTree | KdTree;
    protected _colorGroups!: Map<string, Array<string>>;

    protected _lastSvg!: string;

    constructor(){
        this._colorGroups = new Map<string, Array<string>>();
        this._lastSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    public buildFrom(tree: any, width: number, height: number, maxLod: number = 255, maxLevel: number = 15): void{
        this._scope = new PaperScope();
        this._scope.setup(new Size(width, height));
        this._scope.activate();
        this._maxLod = maxLod;
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
            + ' depth="' + node.point?.depth 
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
                });
                svg += '</g>\n';
            }
        });
        return svg;
    }

    public reset(){
        this._colorGroups = new Map<string, Array<string>>();
    }

    public get maxLevel(){
        return this._maxLevel;
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
}