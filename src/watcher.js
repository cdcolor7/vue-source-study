/**
 * 依赖收集
 */

import { Dep } from "./dep";
import { getDataVal } from "./util"

export class Watcher {
  constructor(vm, updaterFn) {
    this.vm = vm;
    this.getter = updaterFn;

    // 依赖收集
    this.get();
  }

  get() {
    Dep.target = this;
    this.getter.call(this.vm);
    Dep.target = null;
  }
  
  // 相互添加引用
  addDep (dep) {
    dep.addSub(this)
  }

  update() {
    this.get();
    // this.updaterFn.call(this.vm, getDataVal.call(this.vm, this.key))
  }
  
}