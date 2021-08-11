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

    constructor(){

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
                tree.nodeToSVG(tree.root as QuadNode, 0, tree.clipPath, this);
                break;
            case KdTree: tree = this._tree as KdTree;
                tree.nodeToSVG(tree.root as KdNode, new Rectangle(new Point(0,0), new Point(this._width, this._height)), 0, tree.clipPath, this);
        }
        console.log('finished build');
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
}