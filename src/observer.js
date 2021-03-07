/**
 * 响应式数据
 */

import { Dep } from './dep'
import { arrayMethods } from './array'
import { def, hasOwn, dependArray } from './util'

export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep()
    def(value, '__ob__', this)
    if(Array.isArray(value)) {
      if('__proto__' in {}) {
        value.__proto__ = arrayMethods;
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  // 数组响应式处理
  observeArray(arr) {
    for(let i=0, l = arr.length; i<l; i++) {
      observe(arr[i]);
    }
  }

  // 对象响应式处理
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key]);
    })
  }
}

// 数据劫持
export function defineReactive(obj, key, val){
  let childOb = observe(val);
  // 每一可以对应一个 dep;
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      dep.depend();
      if (childOb) {
        // 子ob也要做依赖收集
        childOb.dep.depend()
        if (Array.isArray(val)) {
          dependArray(val)
        }
      }
      return val;
    },
    set(newVal) {
      if(val !== newVal) {
        observe(newVal);
        val = newVal;
        // 通知更新
        dep.notify();
      }
    }
  })
}

// observe
export function observe(obj) {
  if(typeof obj !== 'object' || obj === null) {
    return;
  }
  let ob;
  if(hasOwn(obj, '__ob__') && obj.__ob__ instanceof Observer) {
    ob = obj.__ob__
  } else {
    ob = new Observer(obj);
  }
  return ob;
}

// porxy
export function proxy(vm) {
  Object.keys(vm.$data).forEach(key => {
    Object.defineProperty(vm, key, {
      get() {
        return vm.$data[key]
      },
      set(newVal) {
        vm.$data[key] = newVal;
      }
    })
  })
}

