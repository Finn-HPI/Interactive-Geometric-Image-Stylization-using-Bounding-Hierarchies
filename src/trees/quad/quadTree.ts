import { DataPoint } from "../dataPoint";
import { QuadNode } from "./quadNode";
import { Vec2 } from "../vec2";
import { ColorMode, Tree } from "../tree";
import { SVGBuilder } from "../../building/builder/svgBuilder";
import { Path, Point, Rectangle } from "paper/dist/paper-core";
export class QuadTree extends Tree{

    protected _root!: QuadNode;
    protected _width!: number;
    protected _height!: number;

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode){
        this.setupRand();
        this._colorMode = colorMode;

        this._root = new QuadNode(new Vec2(0,0), new Vec2(width, height));
        this._width = width;
        this._height = height;

        points.forEach((point: DataPoint) => {
            this._root.insert(point, this._root);
        });

        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public meanData(node: QuadNode): void{
        if(node == null)
            return;
        
        if(node.topLeftChild !== null)
            this.meanData(node.topLeftChild);
        if(node.topRightChild !== null)
            this.meanData(node.topRightChild);
        if(node.bottomLeftChild !== null)
            this.meanData(node.bottomLeftChild);
        if(node.bottomRightChild !== null)
            this.meanData(node.bottomRightChild);

        node.numberOfPoints += (node.topLeftChild !== null? node.topLeftChild.numberOfPoints : 0)
            + (node.topRightChild !== null? node.topRightChild.numberOfPoints : 0)
            + (node.bottomLeftChild !== null? node.bottomLeftChild.numberOfPoints : 0)
            + (node.bottomRightChild !== null? node.bottomRightChild.numberOfPoints : 0);

        let total = 1;
        node.lod = node.point !== null? node.point.lod : 0;
        if(node.topLeftChild !== null){
            node.lod += node.topLeftChild.lod * node.topLeftChild.numberOfPoints;
            total += node.topLeftChild.numberOfPoints;
        }
        if(node.topRightChild !== null){
            node.lod += node.topRightChild.lod * node.topRightChild.numberOfPoints;
            total += node.topRightChild.numberOfPoints;
        }
        if(node.bottomLeftChild !== null){
            node.lod += node.bottomLeftChild.lod * node.bottomLeftChild.numberOfPoints;
            total += node.bottomLeftChild.numberOfPoints;
        }
        if(node.bottomRightChild !== null){
            node.lod += node.bottomRightChild.lod * node.bottomRightChild.numberOfPoints;
            total += node.bottomRightChild.numberOfPoints;
        }
        node.lod /= total;
        node.color = this.getColor(node);
       
    }

    public gatherSubPoints(node: QuadNode){
        if(node == null)
            return;
        if(node.topLeftChild !== null)
            this.gatherSubPoints(node.topLeftChild);
        if(node.topRightChild !== null)
            this.gatherSubPoints(node.topRightChild);
        if(node.bottomLeftChild !== null)
            this.gatherSubPoints(node.bottomLeftChild);
        if(node.bottomRightChild !== null)
            this.gatherSubPoints(node.bottomRightChild);
        
        node.addSubpoint(node.point);
        if(node.topLeftChild !== null)
            node.mergeSubPoints(node.topLeftChild.subPoints);
        if(node.topRightChild !== null)
            node.mergeSubPoints(node.topRightChild.subPoints);
        if(node.bottomLeftChild !== null)
            node.mergeSubPoints(node.bottomLeftChild.subPoints);
        if(node.bottomRightChild !== null)
            node.mergeSubPoints(node.bottomRightChild.subPoints);
    }

    public traverse(node: QuadNode, nodes: Array<QuadNode>){
        if(node == null)
            return;

        if(node.path)
            nodes.push(node);
        
        if(node.topLeftChild !== null)
            this.traverse(node.topLeftChild, nodes);
        if(node.topRightChild !== null)
            this.traverse(node.topRightChild, nodes);
        if(node.bottomLeftChild !== null)
            this.traverse(node.bottomLeftChild, nodes);
        if(node.bottomRightChild !== null)
            this.traverse(node.bottomRightChild, nodes);
    }

    public nodeToSVG(node: QuadNode, level: number, clipPath: paper.PathItem, builder: SVGBuilder){
        if(node == null)
            return;

        if(level > builder.maxUsedLevel)
            builder.maxUsedLevel = level;

        node.level = level;

        let tl = false, tr = false, bl = false, br = false;
        if(node.topLeftChild != null && level * 255 / builder.maxLevel < node.topLeftChild.lod)
            this.nodeToSVG(node.topLeftChild, level + 1, clipPath, builder);
        else
            tl = true;
        if(node.topRightChild != null && level * 255 / builder.maxLevel < node.topRightChild.lod)
            this.nodeToSVG(node.topRightChild, level + 1, clipPath, builder);
        else
            tr = true;
        if(node.bottomLeftChild != null && level * 255 / builder.maxLevel < node.bottomLeftChild.lod)
            this.nodeToSVG(node.bottomLeftChild, level + 1, clipPath, builder);
        else
            bl = true;
        if(node.bottomRightChild != null && level * 255 / builder.maxLevel < node.bottomRightChild.lod)
            this.nodeToSVG(node.bottomRightChild, level + 1, clipPath, builder);
        else 
            br = true;

        tl ||= (node.topLeftChild && node.topLeftChild.path && (node.topLeftChild.path as paper.Path).area < builder.minArea)? true : false;
        tr ||= (node.topRightChild && node.topRightChild.path && (node.topRightChild.path as paper.Path).area < builder.minArea)? true : false;
        bl ||= (node.bottomLeftChild && node.bottomLeftChild.path && (node.bottomLeftChild.path as paper.Path).area < builder.minArea)? true : false;
        br ||= (node.bottomRightChild && node.bottomRightChild.path && (node.bottomRightChild.path as paper.Path).area < builder.minArea)? true : false;

        if(tl && node.topLeftChild && node.topLeftChild.path){
            this.resetChilds(node.topLeftChild);
            node.topLeftChild.path = null;
        }
        if(tr && node.topRightChild && node.topRightChild.path){
            this.resetChilds(node.topRightChild);
            node.topRightChild.path = null;
        }
        if(bl && node.bottomLeftChild && node.bottomLeftChild.path){
            this.resetChilds(node.bottomLeftChild);
            node.bottomLeftChild.path = null;
        }
        if(br && node.bottomRightChild && node.bottomRightChild.path){
            this.resetChilds(node.bottomRightChild);
            node.bottomRightChild.path = null;
        }
        if(tl || tr || bl || br){

            let rectangle = new Rectangle(
                new Point(node.topLeft.x, node.topLeft.y),
                new Point(node.bottomRight.x, node.bottomRight.y)
            );

            let q1 = new Path.Rectangle(
                rectangle.topLeft,
                rectangle.center
            );

            let q2 = new Path.Rectangle(
                rectangle.topCenter,
                rectangle.rightCenter
            );

            let q3 = new Path.Rectangle(
                rectangle.leftCenter,
                rectangle.bottomCenter
            );

            let q4 = new Path.Rectangle(
                rectangle.center,
                rectangle.bottomRight
            );

            let rect: paper.PathItem = new Path.Rectangle(rectangle);

            if(!tl)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.topLeft,
                    rectangle.center
                ));
            if(!tr)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.topCenter,
                    rectangle.rightCenter
                ));
            if(!bl)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.leftCenter,
                    rectangle.bottomCenter
                ));
            if(!br)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.center,
                    rectangle.bottomRight
                ));

            if(tl){
                q1.fillColor = node.color;
                node.addChild(q1);
            }
            if(tr){
                q2.fillColor = node.color;
                node.addChild(q2);
            }
            if(bl){
                q3.fillColor = node.color;
                node.addChild(q3);
            }
            if(br){
                q4.fillColor = node.color;
                node.addChild(q4);
            }

            if(level < builder.minUsedLevel || builder.minUsedLevel == -1)
                builder.minUsedLevel = level;

            rect.fillColor = node.color;
            node.path = rect;
        }
    }

    public removeDetail(minArea = 0, sameColors = false){
        let node = this._root;
        while(node && node.path){
            if((node.path as paper.Path).area < minArea){
                this.resetChilds(node);
                break;
            }
        }
    }

    public applyFuncOnChilds(node: QuadNode, func: (node: QuadNode) => void){
        if(node){
            if(node.topLeftChild)
                func(node.topLeftChild);
            if(node.topRightChild)
                func(node.topRightChild);
            if(node.bottomLeftChild)
                func(node.bottomLeftChild);
            if(node.bottomRightChild)
                func(node.bottomRightChild);
        }
    }

    public get width(){
        return this._width;
    }

    public get height(){
        return this._height;
    }

    public get root(){
        return this._root;
    }
}