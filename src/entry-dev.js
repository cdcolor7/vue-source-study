/** 
 * 入口文件
*/

import { observe, proxy } from './observer.js'
import { Compile } from './compile'
import { Watcher } from './watcher'

export default class Pvue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    observe(this.$data)

    // 代理data
    proxy(this)

    // 代理methods
    for(const key in options.methods) {
      this[key] = typeof options.methods[key] === 'function'? options.methods[key].bind(this): noop;
    }

    // 模板编译
    // new Compile(options.el, this)
    if(options.el) {
      this.$mount(options.el);
    }
  }

  // 挂载
  $mount(el){
    // 获取宿主原始
    this.$el = document.querySelector(el);
    // 组件更新函数
    const updateComponent = () => {
      const { render } = this.$options;
      const vnode = render.call(this, this.$createElement);
      this._update(vnode);

    }
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
     if(preVnode) { // 更新
      this.__patch__(preVnode, vnode)
     } else { // 初始化
      this.__patch__(this.$el, vnode)
     }
  }
  // patch方法
  __patch__(oldVode, vnode){
    // 判断old是否为dom
    if(oldVode.nodeType) {  // 初始化
      const parent = oldVode.parentElement;
      const refElm = oldVode.nextSibling;
      // 递归vnode创建dom树
      const el = this.createElm(vnode);
      parent.insertBefore(el, refElm);
      parent.removeChild(oldVode);
    } else { // 更新
      const el = vnode.el = oldVode.el;
      // 判断是否是相同节点samenode
      if(oldVode.tag === vnode.tag) {
        // diff
        // props
        // children
        const oldCh = oldVode.children;
        const newCh = vnode.children;
        if(typeof newCh === 'string') {
          if(typeof oldCh === 'string') {
            if(newCh !== oldCh) {
              el.textContent = newCh;
            }
          } else {
            // 清空并替换为文本
            el.textContent = newCh;
          }
        } else {
          // 数组
          if(typeof oldCh === 'string') {
            el.innerHTML = '';
            newCh.forEach(child => {
              el.appendChild(this.createElm(child));
            })
          } else { // 双方都有孩子 diff 
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
    if(vnode.children) {
      if(typeof vnode.children !== 'object') {
        el.textContent = vnode.children;
      } else {
        // 数组类子元素
        vnode.children.forEach(vnode => {
          el.appendChild(this.createElm(vnode));
        })
      }
    }
    vnode.el = el;
    return el;
  }
  // 更新子元素
  updateChildren(parentElm, oldCh, newCh){
    const len = Math.min(oldCh.length, newCh.length);
    // 强制更新，不管节点是否相同
    for(let i=0; i<len; i++) {
      this.__patch__(oldCh[i], newCh[i]);
    }
    if(oldCh.length > newCh.length) { // 删除
      oldCh.slice(len).forEach(child => {
        parentElm.removeChild(child.el);
      })
    } else { // 追加
      newCh.slice(len).forEach(child => {
        const el = this.createElm(child);
        parentElm.appendChild(el);
      })
    }
  }
}

// 空函数
function noop(){}