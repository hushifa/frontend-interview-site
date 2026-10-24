var e={answerHtml:`<p>读取对象属性时，先查自身属性，找不到再沿内部原型链向上查找，直到 null。可以用 Object.getPrototypeOf 检查原型，用 Object.hasOwn 区分自身属性与继承属性。</p>
<p>class 提供了构造函数、原型方法和继承的语法，但并非所有语义都能等同于旧式函数写法：类默认采用严格模式、不能不带 new 调用，并支持私有字段等机制。实例方法通常位于类的 prototype，实例字段则属于实例自身。</p>
<p>组合通常比过深的继承更容易维护。修改内置原型会影响所有使用者，应谨慎避免；复制属性也不等于复制原型和内部状态。instanceof 检查的是原型关系，跨窗口或自定义 Symbol.hasInstance 时需注意边界。</p>`};export{e as default};