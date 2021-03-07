/**
 * 数组函数劫持
 */

import {def} from "./util"

const arrayProto = Array.prototype

export const arrayMethods = Object.create(arrayProto)

const methodsToPatch =  ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"]

methodsToPatch.forEach(function (method) {
  // 保存原始方法
  const original = arrayProto[method]
  // 覆盖之
  def(arrayMethods, method, function (...args) {
    // 1.执行默认方法
    const result = original.apply(this, args)
    // 2.变更通知
    const ob = this.__ob__
    // 可能会有新元素加入
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 对新加入的元素做响应式
    if (inserted) ob.observeArray(inserted)
    // notify change
    // ob内部有一个dep，让它去通知更新
    ob.dep.notify()
    return result
  })
})
