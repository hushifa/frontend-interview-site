var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浅拷贝（<code>{...obj}</code>、<code>Object.assign</code>、<code>arr.slice()</code>、<code>Array.from</code>）只复制一层，嵌套对象仍是同一个引用。</li>
<li><code>structuredClone</code> 深拷贝普通对象、数组、<code>Date</code>、<code>RegExp</code>、<code>Map</code>、<code>Set</code>、<code>ArrayBuffer</code>、<code>Error</code> 等，并正确处理循环引用。</li>
<li><code>structuredClone</code> 遇到函数、DOM 节点、Symbol 值会抛 <code>DataCloneError</code>；类实例会变成普通对象，getter 会被求值成普通值，不可枚举属性和 Symbol 键会丢失。</li>
<li><code>JSON.parse(JSON.stringify(x))</code> 会丢 <code>undefined</code> 和函数，把 <code>Date</code> 变成字符串，遇到循环引用和 BigInt 会抛错。</li>
<li>不可变状态更新只复制修改路径上的对象，其余部分共享引用。</li>
</ul>
<h2>浅拷贝</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = { <span class="hljs-attr">child</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> } };
<span class="hljs-keyword">const</span> shallow = { ...source };
<span class="hljs-keyword">const</span> deep = <span class="hljs-title function_">structuredClone</span>(source);

shallow.<span class="hljs-property">child</span>.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(deep.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>);   <span class="hljs-comment">// 1</span>
</code></pre></div>
<h2>structuredClone 的能力与限制</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> original = { <span class="hljs-attr">when</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>), <span class="hljs-attr">tags</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;a&#x27;</span>]) };
original.<span class="hljs-property">self</span> = original;

<span class="hljs-keyword">const</span> copy = <span class="hljs-title function_">structuredClone</span>(original);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">when</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">self</span> === copy); <span class="hljs-comment">// true</span>
</code></pre></div>
<table><thead><tr><th>值</th><th>结果</th></tr></thead><tbody><tr><td><code>Date</code>、<code>Map</code>、<code>Set</code>、<code>RegExp</code>、TypedArray</td><td>保留类型</td></tr><tr><td>循环引用</td><td>保留结构</td></tr><tr><td>类实例</td><td>变成普通对象，丢失原型方法</td></tr><tr><td>函数、DOM 节点、Symbol 值</td><td>抛 <code>DataCloneError</code></td></tr><tr><td>getter</td><td>复制求值结果</td></tr></tbody></table>
<p>第二个参数 <code>{ transfer: [buffer] }</code> 会把 ArrayBuffer 转移给副本，原 buffer 变为长度 0。<code>postMessage</code> 用的是同一个算法。</p>
<h2>状态更新：按路径复制</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> next = {
  ...state,
  <span class="hljs-attr">user</span>: { ...state.<span class="hljs-property">user</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;新名字&#x27;</span> },
};
</code></pre></div>
<p>只有 <code>next</code>、<code>next.user</code> 是新对象，<code>state.settings</code> 等未改动的部分仍共享。React 依赖引用变化判断更新，整棵树深拷贝既浪费又会让所有子组件认为数据变了。嵌套很深时可以用 Immer。</p>
<h2>常见追问</h2>
<ul>
<li>手写深拷贝要处理什么？基本类型直接返回；用 <code>WeakMap</code> 记录已复制对象处理循环引用；区分数组、<code>Date</code>、<code>Map</code>、<code>Set</code>；决定是否保留原型和 Symbol 键。</li>
<li><code>structuredClone</code> 在哪里可用？浏览器和 Node.js 17 起都是全局函数。</li>
</ul>`};export{e as default};