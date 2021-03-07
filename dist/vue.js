(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Pvue = factory());
}(this, (function () { 'use strict';

/**
 * 消息管理器
 */

class Dep {
  constructor() {
    this.deps = new Set();
  }

  // 添加订阅者
  addSub(watcher) {
    this.deps.add(watcher);
  }

  // 操作watcher addDep 方法
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  // 通知更新
  notify() {
    this.deps.forEach(watcher => watcher.update());
  }

}

// 返回指定 key 对应的 data值


// 设置指定 key 对应的 data值


// 定义一个Property
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

// 数组响应式处理
function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

// 检测一个对象的属性是否存在
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
}

/**
 * 数组函数劫持
 */

const arrayProto = Array.prototype;

const arrayMethods = Object.create(arrayProto);

const methodsToPatch = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];

methodsToPatch.forEach(function (method) {
  // 保存原始方法
  const original = arrayProto[method];
  // 覆盖之
  def(arrayMethods, method, function (...args) {
    // 1.执行默认方法
    const result = original.apply(this, args);
    // 2.变更通知
    const ob = this.__ob__;
    // 可能会有新元素加入
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    // 对新加入的元素做响应式
    if (inserted) ob.observeArray(inserted);
    // notify change
    // ob内部有一个dep，让它去通知更新
    ob.dep.notify();
    return result;
  });
});

/**
 * 响应式数据
 */

class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep();
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      if ('__proto__' in {}) {
        value.__proto__ = arrayMethods;
      }
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  // 数组响应式处理
  observeArray(arr) {
    for (let i = 0, l = arr.length; i < l; i++) {
      observe(arr[i]);
    }
  }

  // 对象响应式处理
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key]);
    });
  }
}

// 数据劫持
function defineReactive(obj, key, val) {
  let childOb = observe(val);
  // 每一可以对应一个 dep;
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      dep.depend();
      if (childOb) {
        // 子ob也要做依赖收集
        childOb.dep.depend();
        if (Array.isArray(val)) {
          dependArray(val);
        }
      }
      return val;
    },
    set(newVal) {
      if (val !== newVal) {
        observe(newVal);
        val = newVal;
        // 通知更新
        dep.notify();
      }
    }
  });
}

// observe
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  let ob;
  if (hasOwn(obj, '__ob__') && obj.__ob__ instanceof Observer) {
    ob = obj.__ob__;
  } else {
    ob = new Observer(obj);
  }
  return ob;
}

// porxy
function proxy(vm) {
  Object.keys(vm.$data).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm.$data[key];
      },
      set(newVal) {
        vm.$data[key] = newVal;
      }
    });
  });
}

/**
 * 依赖收集
 */

class Watcher {
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
  addDep(dep) {
    dep.addSub(this);
  }

  update() {
    this.get();
    // this.updaterFn.call(this.vm, getDataVal.call(this.vm, this.key))
  }

}

/**
 * 编译器
 */

/** 
 * 入口文件
*/

class Pvue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    observe(this.$data);

    // 代理data
    proxy(this);

    // 代理methods
    for (const key in options.methods) {
      this[key] = typeof options.methods[key] === 'function' ? options.methods[key].bind(this) : noop;
    }

    // 模板编译
    // new Compile(options.el, this)
    if (options.el) {
      this.$mount(options.el);
    }
  }

  // 挂载
  $mount(el) {
    // 获取宿主原始
    this.$el = document.querySelector(el);
    // 组件更新函数
    const updateComponent = () => {
      // const { render } = this.$options;
      // const el = render.call(this);
      // const parent = this.$el.parentElement;
      // parent.insertBefore(el, this.$el.nextSibling);
      // parent.removeChild(this.$el);
      // this.$el = el;
      const { render } = this.$options;
      const vnode = render.call(this, this.$createElement);
      this._update(vnode);
    };
    // 创建wather
    new Watcher(this, updateComponent);
  }

  // 获取vnode
  $createElement(tag, props, children) {
    return { tag, props, children };
  }
  // 更新
  _update(vnode) {
    const preVnode = this._vnode;
    if (preVnode) {
      // 更新
      this.__patch__(preVnode, vnode);
    } else {
      // 初始化
      this.__patch__(this.$el, vnode);
    }
  }
  // patch方法
  __patch__(oldVode, vnode) {
    // 判断old是否为dom
    if (oldVode.nodeType) {
      // 初始化
      const parent = oldVode.parentElement;
      const refElm = oldVode.nextSibling;
      // 递归vnode创建dom树
      const el = this.createElm(vnode);
      parent.insertBefore(el, refElm);
      parent.removeChild(oldVode);
    } else {
      // 更新
      const el = vnode.el = oldVode.el;
      // 判断是否是相同节点samenode
      if (oldVode.tag === vnode.tag) {
        // diff
        // props
        // children
        const oldCh = oldVode.children;
        const newCh = vnode.children;
        if (typeof newCh === 'string') {
          if (typeof oldCh === 'string') {
            if (newCh !== oldCh) {
              el.textContent = newCh;
            }
          } else {
            // 清空并替换为文本
            el.textContent = newCh;
          }
        } else {
          // 数组
          if (typeof oldCh === 'string') {
            el.innerHTML = '';
            newCh.forEach(child => {
              el.appendChild(this.createElm(child));
            });
          } else {
            // 双方都有孩子 diff 
            this.updateChildren(el, oldCh, newCh);
          }
        }
      }
    }
    // 保存vnode
    this._vnode = vnode;
  }
  // 创建真实节点
  createElm(vnode) {
    const el = document.createElement(vnode.tag);
    // props
    for (const key in vnode.props) {
      el.setAttribute(key, vnode.props[key]);
    }

    // 处理子节点
    if (vnode.children) {
      if (typeof vnode.children !== 'object') {
        el.textContent = vnode.children;
      } else {
        // 数组类子元素
        vnode.children.forEach(vnode => {
          el.appendChild(this.createElm(vnode));
        });
      }
    }
    vnode.el = el;
    return el;
  }
  // 更新子元素
  updateChildren(el, oldCh, newCh) {}
}

// 空函数
function noop() {}

return Pvue;

})));
//# sourceMappingURL=vue.js.map
