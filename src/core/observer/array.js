/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */
// 用于设置数组的响应式
import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 可做数组响应式的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method] // 原始数组方法
  // 向数组装配自定义的数组方法
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args) // 首先调用原始数组方法执行
    const ob = this.__ob__ // 获取数组的监听对象
    let inserted
    // 获取被插入的新数据
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted) // 对新插入的数据进行监听
    // 执行后，触发监听
    ob.dep.notify()
    return result
  })
})
