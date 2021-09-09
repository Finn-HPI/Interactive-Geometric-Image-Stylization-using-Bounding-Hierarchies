import { DataPoint } from '../dataPoint';
import { VPNode } from './vpNode';
import FastPriorityQueue from 'fastpriorityqueue';
import { select } from '../../utils/vpUtil';
import { ColorMode, Tree } from '../tree';
import { Path, Point } from 'paper/dist/paper-core';
import { SVGBuilder } from '../../building/builder/svgBuilder';

export class VPTree extends Tree{

    protected _root!: VPNode | null;
    protected _maxDist!: number;
    protected _width!: number;
    protected _height!: number;

    private buildTree(data: DataPoint[]){
        this._root = this.recursiveBuild(data);
    }

    private randIndex(arr: DataPoint[]){
        return Math.floor(this.random() * arr.length);
    }

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode){
        this.setupRand();
        this._colorMode = colorMode;

        this._width = width;
        this._height = height;

        this.buildTree(points);
        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public gatherSubPoints(node: VPNode){
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

    public meanData(node: VPNode): void{
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

        node.color = this.getColor(node);
        
        if(node.left == null && node.right == null && node.point){
            node.lod = node.point.lod;
        }
    }

    private recursiveBuild(data: DataPoint[]): VPNode | null{
        if(data.length == 0)
            return null;

        let index = this.randIndex(data);
        let vp: DataPoint = data.splice(index, 1)[0];
        let node = new VPNode();
        node.point = vp;

        let distances = [];
        for(let i = 0; i < data.length; i++){
            let dist = vp.dist(data[i]);
            distances[i] = dist;
        }

        let mu = select(distances, Math.floor(distances.length / 2));
        let leftList = [];
        let rightList = [];
        
        for(let i = 0; i < data.length; i++)
            if(vp.dist(data[i]) < mu)
                leftList.push(data[i]);
            else
                rightList.push(data[i]);

        node.threshold = mu;
        node.left = this.recursiveBuild(leftList);
        node.right = this.recursiveBuild(rightList);

        if(node.left !== null){
            node.left.parent = node;
            node.left.isLeftChild = true;
        }
        if(node.right !== null){
            node.right.parent = node;
            node.right.isLeftChild = false;
        }
        return node;
    }

    public traverse(node: VPNode, nodes: Array<VPNode>){
        if(node == null || node.path == null)
            return;
        nodes.push(node);
        
        if(node.left !== null)
            this.traverse(node.left, nodes);
        if(node.right !== null)
            this.traverse(node.right, nodes);
    }

    public findKnn(target: paper.Point, k: number): VPNode[]{
        let queue = new FastPriorityQueue(function(a: VPNode, b: VPNode) {
            return (b.point as DataPoint).distToPoint(target.x, target.y) <=  (a.point as DataPoint).distToPoint(target.x, target.y)
        });
        this._maxDist = Number.MAX_VALUE;
        if(this._root == null)
            return [];

        this.search(this._root, target, k, queue);
        return queue.kSmallest(k);
    }

    private search(node: VPNode, target: paper.Point, k: number, queue: FastPriorityQueue<VPNode>){
        if(node == null || !node.point)
            return;
        let dist = node.point.distToPoint(target.x, target.y);
        if(dist < this._maxDist){
            if(queue.size == k)
                queue.poll();
            queue.add(node);
            if(queue.size == k)
                this._maxDist = ((queue.peek() as VPNode).point as DataPoint).distToPoint(target.x, target.y);
        }
        if(node.left == null && node.right == null)
            return;

        if(dist < node.threshold){
            if(dist - this._maxDist <= node.threshold && node.left)
                this.search(node.left, target, k, queue);
            if(dist + this._maxDist >= node.threshold && node.right)
                this.search(node.right, target, k, queue);
        }else{
            if(dist + this._maxDist >= node.threshold && node.right)
                this.search(node.right, target, k, queue);
            if(dist - this._maxDist <= node.threshold && node.left)
                this.search(node.left, target, k, queue);
        }
    }

    public nodeToSVG(node: VPNode, clip: paper.PathItem, level: number, builder: SVGBuilder): paper.PathItem | null {
        if(node == null || !node.point) 
            return null;

        if(level > builder.maxUsedLevel)
            builder.maxUsedLevel = level;
        if(level < builder.minUsedLevel || builder.minUsedLevel == -1)
            builder.minUsedLevel = level;
        
        node.level = level;

        let intersect = clip.intersect(
            new Path.Circle(new Point(node.point.x, node.point.y), node.threshold)
        );

        let inside = intersect;
        let outside = clip.subtract(intersect);
        intersect.fillColor = node.color;

        node.path = intersect;

        let l: paper.PathItem | null = null;
        let r: paper.PathItem | null = null;

        if(node.left != null && node.left.lod / 255 > level / builder.maxLevel)
            l = this.nodeToSVG(node.left, inside, level + 1, builder);
        if(node.right != null && node.right.lod / 255 > level / builder.maxLevel)
            r = this.nodeToSVG(node.right, outside, level + 1, builder);

        if(l == null && r == null)
            return intersect;

        let path: paper.PathItem | null = null;
        if(l !== null && r !== null)
            path = l.unite(r);
        else if(l !== null)
            path = l;
        else if(r !== null)
            path = r;

        if(path !== null){
            node.path = node.path.subtract(path);
        }
        return (path && node.path)? path.unite(node.path) : null;
    }

    public removeDetail(){
        removeCheckNodePath(this._root as VPNode, this);

        function removeCheckNodePath(node: VPNode, tree: VPTree){
            if(node && node.path){
                if(node.left && node.left.path && node.left.color === node.color){
                    node.path = node.path.unite(node.left.path);
                    tree.resetChilds(node);
                    return;
                }
                if(node.left)
                    removeCheckNodePath(node.left, tree);
                if(node.right)
                    removeCheckNodePath(node.right, tree);
            }
        }
    }

    public applyFuncOnChilds(node: VPNode, func: (node: VPNode) => void){
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

    public get width(){
        return this._width;
    }

    public get heigth(){
        return this._height;
    }
}