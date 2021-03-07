/**
 * 消息管理器
 */

export class Dep {
  constructor() {
    this.deps = new Set();
  }

  // 添加订阅者
  addSub(watcher) {
    this.deps.add(watcher);
  }

  // 操作watcher addDep 方法
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知更新
  notify() {
    this.deps.forEach(watcher => watcher.update());
  }
  
}