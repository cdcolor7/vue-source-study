/**
 * 编译器
 */

import { Watcher } from './watcher'
import { getDataVal, setDataVal } from './util'

export class Compile {
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);
    if(this.$el) {
      this.compile(this.$el);
    }
  }

  // 递归子节点
  compile(el) {
    const childNodes = el.childNodes;
    childNodes.forEach(node => {
      if(node.nodeType === 1) { // 元素节点
        this.compileElement(node);
        // 递归
        if(node.hasChildNodes) {
          this.compile(node);
        }
      } else if (this.isInter(node)) { // {{}}
        this.compileText(node);
      }
    })
  }

  // 正则 {{counter}}
  isInter(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  // 编译属性
  compileElement(node) {
    let nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach(attr => {
      // v-text="xxx"
      const attrname = attr.name; // v-text
      const exp = attr.value; // xxx
      // 指令解析
      if(attrname.indexOf("v-") === 0) {
        const dir = attrname.substring(2);
        const dirArr = dir.split(':')
        if(dirArr.length === 2 && dirArr[0] === 'on') { // 判断 v-on:click ="onclick"
          this.eventHandler(node, exp, dirArr[1])
        } else {
          this[dir] && this[dir](node, exp)
        }
      } else if (attrname.indexOf("@") === 0) { // 判断 @click ="onclick"
        const dir = attrname.substring(1);
        this.eventHandler(node, exp, dir)
      }
    })
  }

  // 事件处理
  eventHandler(node, exp, event) {
    const fn = this.$vm[exp]
    if(event && fn) {
      node.addEventListener(event, fn.bind(this.$vm), false);
    }
  }

  // 处理文本节点
  compileText(node) {
    this.update(node, RegExp.$1, 'text');
  }


  // 更新中转函数
  update(node, exp, dir) {
    const fn = this[`${dir}Updater`];
    fn && fn(node, getDataVal.call(this.$vm, exp));
    // 依赖wather初始化
    new Watcher(this.$vm, exp, val => {
      fn && fn(node, val)
    })
  }

  // v-model
  modelUpdater(node, value) {
    node.value = value
  }

  // 文本节点
  textUpdater(node, value) {
    node.textContent = value;
  }

  // html标签解析节点
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  // v-model
  model(node, exp) {
    this.update(node, exp, 'model');
    node.addEventListener('input', e => {
      setDataVal.call(this.$vm, exp, e.target.value)
    })
  }

  // v-text
  text(node, exp) {
    this.update(node, exp, 'text')
  }
   
  // v-html
  html(node, exp) {
    this.update(node, exp, 'html')
  }

}
