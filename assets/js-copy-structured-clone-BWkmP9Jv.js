var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浅拷贝只复制最外面一层。<code>{...obj}</code>、<code>Object.assign</code>、<code>arr.slice()</code>、<code>Array.from</code> 都是浅拷贝，复制出来的新对象里，嵌套的对象还是和原来共用同一个。</p>
<p>要完整复制一份，可以用 <code>structuredClone</code>。它能深拷贝普通对象、数组、<code>Date</code>、<code>RegExp</code>、<code>Map</code>、<code>Set</code>、<code>ArrayBuffer</code>、<code>Error</code> 等，循环引用也能正确处理。</p>
<p>但它有限制。遇到函数、DOM 节点、Symbol 值会抛 <code>DataCloneError</code>；类的实例会变成普通对象，丢掉原型上的方法；getter 会被求值成普通值；不可枚举属性和 Symbol 键会丢掉。老办法 <code>JSON.parse(JSON.stringify(x))</code> 问题更多，会丢掉 <code>undefined</code> 和函数，把 <code>Date</code> 变成字符串，碰到循环引用和 BigInt 直接报错。</p>
<p>实际更新状态时，一般不做整体深拷贝，而是只复制被修改的那条路径，其他部分继续共用。</p>
</blockquote>
<h2>浅拷贝和深拷贝差在哪</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = { <span class="hljs-attr">child</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> } };
<span class="hljs-keyword">const</span> shallow = { ...source };
<span class="hljs-keyword">const</span> deep = <span class="hljs-title function_">structuredClone</span>(source);

shallow.<span class="hljs-property">child</span>.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(deep.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>);   <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>改的是 <code>shallow.child.count</code>，可 <code>source.child.count</code> 也变成了 2。</p>
<p>因为展开语法只复制了 <code>source</code> 这一层，<code>shallow.child</code> 和 <code>source.child</code> 指向同一个对象，从哪边改都是改它。<code>structuredClone</code> 会把里面的对象也重新创建一份，所以 <code>deep.child</code> 是独立的，还是 1。</p>
<h2>structuredClone 能复制什么，不能复制什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> original = { <span class="hljs-attr">when</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>), <span class="hljs-attr">tags</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;a&#x27;</span>]) };
original.<span class="hljs-property">self</span> = original;

<span class="hljs-keyword">const</span> copy = <span class="hljs-title function_">structuredClone</span>(original);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">when</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">self</span> === copy); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>original.self</code> 指向自己，这叫循环引用，手写递归拷贝很容易在这里陷入死循环。<code>structuredClone</code> 会记住已经复制过的对象，所以副本的 <code>self</code> 正确地指向副本自己。<code>Date</code> 复制出来也还是 <code>Date</code>。</p>
<p>各种值的处理结果如下：</p>
<table><thead><tr><th>值</th><th>结果</th></tr></thead><tbody><tr><td><code>Date</code>、<code>Map</code>、<code>Set</code>、<code>RegExp</code>、TypedArray</td><td>保留类型</td></tr><tr><td>循环引用</td><td>保留结构</td></tr><tr><td>类实例</td><td>变成普通对象，丢失原型方法</td></tr><tr><td>函数、DOM 节点、Symbol 值</td><td>抛 <code>DataCloneError</code></td></tr><tr><td>getter</td><td>复制求值结果</td></tr></tbody></table>
<p>它还有第二个参数。传 <code>{ transfer: [buffer] }</code> 时，<code>ArrayBuffer</code> 不是被复制，而是被转移给副本，原来的 buffer 长度变成 0。<code>postMessage</code> 给 Worker 发数据时用的也是这同一套复制规则。</p>
<h2>更新状态时为什么不整个深拷贝</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> next = {
  ...state,
  <span class="hljs-attr">user</span>: { ...state.<span class="hljs-property">user</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;新名字&#x27;</span> },
};
</code></pre></div>
<p>这里只创建了两个新对象：<code>next</code> 和 <code>next.user</code>。<code>state.settings</code> 这类没改动的部分，还是原来的引用。</p>
<p>React 靠引用有没有变来判断数据有没有更新。如果把整棵状态树都深拷贝一遍，不光浪费，而且每个部分的引用都变了，所有子组件都会以为自己的数据变了，跟着重新渲染。只复制修改路径，没改的部分引用不变，就能跳过。嵌套很深、手写展开太繁琐时，可以用 Immer 这类库。</p>
<h2>常见追问</h2>
<p><strong>手写深拷贝要处理什么？</strong></p>
<blockquote>
<p>基本类型直接返回。用 <code>WeakMap</code> 记下已经复制过的对象，碰到循环引用时直接返回之前的副本。数组、<code>Date</code>、<code>Map</code>、<code>Set</code> 要分别处理。还要想清楚要不要保留原型、要不要复制 Symbol 键。</p>
</blockquote>
<p><strong><code>structuredClone</code> 在哪里能用？</strong></p>
<blockquote>
<p>现代浏览器里都能直接用，Node.js 从 17 版开始也是全局函数。</p>
</blockquote>`};export{e as default};