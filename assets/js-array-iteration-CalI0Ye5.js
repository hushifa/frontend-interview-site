var e={answerHtml:`<p>map 用于逐项转换，filter 用于筛选，find 返回首个匹配元素，some 和 every 表达存在性与全称判断。reduce 适合明确的累积过程，但复杂业务不必为了使用 reduce 牺牲可读性。</p>
<p>sort、reverse、splice、push 等会修改原数组；toSorted、toReversed、toSpliced 提供相应的复制版本，兼容性需要根据目标浏览器确认。sort 默认按字符串比较，排序数字要提供比较函数。</p>
<p>forEach 不等待 async 回调完成。需要串行处理时用 for...of 配合 await；需要并行时显式创建任务并控制并发量。稀疏数组的空位与值为 undefined 的元素也有区别，不同方法对空位的处理不完全一致。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。可先用一个最小示例验证“数组、不可变、迭代”，再补充空值、异常和兼容性边界。</p>`};export{e as default};