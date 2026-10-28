var e={notesHtml:`<p>Google Chrome Labs 维护的 Worker 通信库，把 postMessage 封装成异步代理对象，在主线程可以像调用普通方法一样调用 Worker 中的函数。</p>
<p>所有调用都变成异步的，参数仍按结构化克隆复制。大的 ArrayBuffer 用 <code>Comlink.transfer</code> 转移所有权，转移后原线程不能再使用。不再需要时调用 <code>releaseProxy</code>；终止 Worker 是另一个独立的动作。</p>
<p>许可：Apache-2.0。</p>`};export{e as default};