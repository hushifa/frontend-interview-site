var e={answerHtml:`<h2>简答</h2>
<ul>
<li>数据结构用 <code>Map&lt;事件名, 监听器数组&gt;</code>，数组保持注册顺序，<code>emit</code> 按顺序同步调用。</li>
<li><code>emit</code> 先复制数组再遍历。直接遍历原数组时，回调里调用 <code>off</code> 会让后面的监听器下标前移而被跳过，调用 <code>on</code> 会让新监听器在本轮就执行。</li>
<li>采用快照后，本轮执行期间新增的监听器下一次才会触发，被移除的监听器本轮仍会执行。Node.js 的 <code>EventEmitter</code> 也是这个行为。</li>
<li><code>once</code> 给监听器打标记，<code>emit</code> 调用它之前先按包装对象移除。先调用再移除时，回调内部再次 <code>emit</code> 同一事件会再次触发它。</li>
<li><code>off</code> 按函数引用查找，同一函数注册多次时只移除一次。返回 <code>this</code> 支持链式调用。</li>
</ul>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">EventEmitter</span> {
  #events = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

  <span class="hljs-title function_">on</span>(<span class="hljs-params">type, listener</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> listener !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;listener must be a function&#x27;</span>);
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">has</span>(type)) <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">set</span>(type, []);
    <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">get</span>(type).<span class="hljs-title function_">push</span>({ listener, <span class="hljs-attr">once</span>: <span class="hljs-literal">false</span> });
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }

  <span class="hljs-title function_">once</span>(<span class="hljs-params">type, listener</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">on</span>(type, listener);
    <span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">get</span>(type);
    list[list.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>].<span class="hljs-property">once</span> = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }

  <span class="hljs-title function_">off</span>(<span class="hljs-params">type, listener</span>) {
    <span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">get</span>(type);
    <span class="hljs-keyword">if</span> (!list) <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
    <span class="hljs-comment">// 从后往前找，同一函数注册多次时只移除最近一次，与 Node.js 一致</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = list.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
      <span class="hljs-keyword">if</span> (list[i].<span class="hljs-property">listener</span> === listener) {
        list.<span class="hljs-title function_">splice</span>(i, <span class="hljs-number">1</span>);
        <span class="hljs-keyword">break</span>;
      }
    }
    <span class="hljs-keyword">if</span> (list.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">delete</span>(type);
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
  }

  <span class="hljs-comment">// once 触发时按包装对象删除，避免误删同一函数用 on 注册的另一条</span>
  #<span class="hljs-title function_">remove</span>(<span class="hljs-params">type, entry</span>) {
    <span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">get</span>(type);
    <span class="hljs-keyword">const</span> index = list ? list.<span class="hljs-title function_">indexOf</span>(entry) : -<span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
    list.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">1</span>);
    <span class="hljs-keyword">if</span> (list.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">delete</span>(type);
  }

  <span class="hljs-title function_">emit</span>(<span class="hljs-params">type, ...args</span>) {
    <span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">this</span>.#events.<span class="hljs-title function_">get</span>(type);
    <span class="hljs-keyword">if</span> (!list) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    <span class="hljs-comment">// 快照：本轮执行期间的增删从下一次 emit 起生效</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> [...list]) {
      <span class="hljs-keyword">if</span> (entry.<span class="hljs-property">once</span>) <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">remove</span>(type, entry); <span class="hljs-comment">// 先移除，防止回调内重入时重复触发</span>
      entry.<span class="hljs-property">listener</span>.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }
}
</code></pre></div>
<p>监听器用 <code>{ listener, once }</code> 包装，<code>off</code> 仍按原函数比较，所以 <code>once</code> 注册的监听器也能用原函数取消。</p>
<p><code>emit</code> 删除 once 监听器时按包装对象删除，不调用 <code>off</code>。同一个函数既用 <code>on</code>、又用 <code>once</code> 注册时，如果本轮前面的监听器已经把 once 那条移除，按函数删除会误删 <code>on</code> 那条。按包装对象删除时，两次 <code>emit</code> 后该函数共执行 3 次，与 Node.js 的结果相同；按函数删除只有 2 次。</p>
<h2>emit 期间增删监听器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">const</span> emitter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
<span class="hljs-keyword">const</span> <span class="hljs-title function_">b</span> = (<span class="hljs-params"></span>) =&gt; log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;b&#x27;</span>);

emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
  emitter.<span class="hljs-title function_">off</span>(<span class="hljs-string">&#x27;x&#x27;</span>, b);
  emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;new&#x27;</span>));
});
emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;x&#x27;</span>, b);
emitter.<span class="hljs-title function_">once</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`once<span class="hljs-subst">\${v}</span>\`</span>));

emitter.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// a,b,once1</span>
log.<span class="hljs-property">length</span> = <span class="hljs-number">0</span>;

emitter.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// a,new</span>
</code></pre></div>
<p>第一次 <code>emit</code> 时，b 在本轮被移除但仍执行，新增的监听器没有执行。第二次 <code>emit</code> 时 b 已不在，once 已移除，新增的监听器开始执行。把同样的代码换成 Node.js 的 <code>require(&#x27;events&#x27;).EventEmitter</code>，第一次输出同样是 <code>a,b,once1</code>。</p>
<h2>常见追问</h2>
<ul>
<li>某个监听器抛错会怎样？上面的实现中错误直接抛出，后面的监听器不再执行。需要隔离时在循环里 <code>try...catch</code>，把错误交给统一的错误处理。</li>
<li>为什么要提供 <code>off</code>？组件卸载时不移除监听器，回调会继续引用组件里的数据，造成内存泄漏和对已卸载组件的更新。</li>
<li>浏览器里有现成的吗？<code>EventTarget</code> 配合 <code>addEventListener</code>、<code>dispatchEvent</code> 可以实现相同用途，监听器选项 <code>{ once: true }</code> 对应 <code>once</code>。</li>
</ul>`};export{e as default};