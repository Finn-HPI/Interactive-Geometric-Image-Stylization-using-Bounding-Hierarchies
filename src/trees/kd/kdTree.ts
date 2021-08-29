import { Path, Point, Rectangle } from "paper/dist/paper-core";
import { SVGBuilder } from "../../building/builder/svgBuilder";
import { DataPoint } from "../dataPoint";
import { ColorMode, Tree } from "../tree";
import { KdNode } from "./kdNode";

export class KdTree extends Tree{

    protected _root!: KdNode | null;

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode){
        this.setupRand();
        this._colorMode = colorMode;

        points = points.sort((a, b) => 0.5 - this.random());
        let startPoint = points[Math.floor(points.length / 2)];
        this._root = this.insert(this._root, startPoint);

        points.forEach((point: DataPoint) => {
            if(point !== startPoint)
                this._root = this.insert(this._root, point);
        });

        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public insert(root: KdNode | null, point: DataPoint, level: number = 0): KdNode | null{
        if(root == null)
            return new KdNode(point);

        let data = [point.x, point.y, (root.point as DataPoint).x, (root.point as DataPoint).y];

        if(data[level % 2] <= data[(level % 2) + 2])
            root.left = this.insert(root.left, point, level + 1);
        else
            root.right = this.insert(root.right, point, level + 1);
        return root;
    }

    public gatherSubPoints(node: KdNode){
        if(node == null)
            return;
        if(node.left !== null)
            this.gatherSubPoints(node.left);
        if(node.right !== null)
            this.gatherSubPoints(node.right);
        
        node.addSubpoint(node.point);
        if(node.left !== null)
            node.mergeSubPoints(node.left.subPoints);
        if(node.right !== null)
            node.mergeSubPoints(node.right.subPoints);
    }

    public meanData(node: KdNode): void{
        if(node == null)
            return;

        if(node.left !== null)
            this.meanData(node.left);
        if(node.right !== null)
            this.meanData(node.right);

        node.numberOfPoints += (node.left !== null? node.left.numberOfPoints : 0)
            + (node.right !== null? node.right.numberOfPoints : 0); 
            
        node.lod = ((node.left !== null? node.left.lod : 0)
            + (node.right !== null? node.right.lod : 0)) / 2; 

        let total = 1;
        node.lod = node.point !== null? node.point.lod : 0;
        if(node.left !== null){
            node.lod += node.left.lod * node.left.numberOfPoints;
            total += node.left.numberOfPoints;
        }
        if(node.right !== null){
            node.lod += node.right.lod * node.right.numberOfPoints;
            total += node.right.numberOfPoints;
        }
        
        node.lod /= total;
        node.color = this.getColor(node);
    }

    public traverse(node: KdNode, nodes: Array<KdNode>){
        if(node == null)
            return;
        nodes.push(node);
        if(node.left !== null)
            this.traverse(node.left, nodes);
        if(node.right !== null)
            this.traverse(node.right, nodes);
    }

    public nodeToSVG(node: KdNode, area: paper.Rectangle, level: number, clipPath: paper.PathItem, builder: SVGBuilder){
        if(node == null || node.point == null)
            return;
            
        if(level > builder.maxUsedLevel)
            builder.maxUsedLevel = level;
        
        node.level = level;

        let left = new Rectangle(area.topLeft, (level % 2) == 0? new Point(node.point.x, area.bottom) : new Point(area.right, node.point.y));
        let right = new Rectangle((level % 2) == 0? new Point(node.point.x, area.top) : new Point(area.left, node.point.y), area.bottomRight);

        let l = false, r = false;
        let rect;
        if(node.left != null && level * 255 / builder.maxLevel < node.left.lod)
            this.nodeToSVG(node.left, left, level + 1, clipPath, builder);
        else
            l = true;
        if(node.right != null && level * 255 / builder.maxLevel < node.right.lod)
            this.nodeToSVG(node.right, right,level + 1, clipPath, builder);
        else    
            r = true;

        l ||= (node.left && node.left.path && (node.left.path as paper.Path).area < builder.minArea)? true : false;
        r ||= (node.right && node.right.path && (node.right.path as paper.Path).area < builder.minArea)? true : false;

        if(l && node.left && node.left.path){
            this.resetChilds(node.left);
            node.left.path = null;
        }

        if(r && node.right && node.right.path){
            this.resetChilds(node.right);
            node.right.path = null;
        }

        if(l && r)
            rect = new Path.Rectangle(area);
        else if(l)
            rect = new Path.Rectangle(left);
        else if(r)
            rect = new Path.Rectangle(right);
        
        if(rect !== undefined){
            if(level < builder.minUsedLevel || builder.minUsedLevel == -1)
                builder.minUsedLevel = level;
            rect.fillColor = node.color;
            node.path = rect;
        }
    }

    public applyFuncOnChilds(node: KdNode, func: (node: KdNode) => void){
        if(node){
            if(node.left)
                func(node.left);
            if(node.right)
                func(node.right)
        }
    }

    public get root(){
        return this._root;
    }
}