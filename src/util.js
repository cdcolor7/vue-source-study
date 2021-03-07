// 返回指定 key 对应的 data值
export function getDataVal(exp) {
  let value
  if(/\[|\|]|\./.test(exp)) {
    let keyArr = exp.replace(/\]/g, '').split(/\[|\./g);
    keyArr.forEach((key, index) => {
      value = index === 0? this[key]: value[key];
    })
  } else {
    value = this[exp]
  }
  return value;
}

// 设置指定 key 对应的 data值
export function setDataVal(exp, value) {
  let val
  if(/\[|\|]|\./.test(exp)) {
    let keyArr = exp.replace(/\]/g, '').split(/\[|\./g);
    let l = keyArr.length -1 ;
    keyArr.forEach((key, index) => {
      if(index === 0) {
        val = this[key]
      } else if (index === l){
        val[key] = value
      } else {
        val = val[key]
      }
    })
  } else {
    this[exp] = value
  }
}


// 定义一个Property
export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

// 数组响应式处理
export function dependArray (value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}

// 检测一个对象的属性是否存在
const hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwn(obj, key){
  return hasOwnProperty.call(obj, key)
}
