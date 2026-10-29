var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>事件中心就是“先登记、后通知”：<code>on</code> 登记一个回调，<code>emit</code> 时把登记过的回调按顺序同步调用一遍。数据结构用 <code>Map&lt;事件名, 监听器数组&gt;</code> 就够了。</p>
<p>难点在 <code>emit</code> 过程中回调又去增删监听器。如果直接遍历原数组，回调里调 <code>off</code> 会让后面的监听器下标前移，有一个被跳过；调 <code>on</code> 会让新监听器这一轮就被执行。所以 <code>emit</code> 要先复制一份数组再遍历。这样本轮新加的下一次才触发，本轮被移除的这一轮仍会执行，Node.js 的 <code>EventEmitter</code> 也是这样。</p>
<p><code>once</code> 是给监听器打个标记，<code>emit</code> 在调用它之前先把它移除。如果先调用再移除，回调里又 <code>emit</code> 同一事件，它就会被再触发一次。</p>
<p><code>off</code> 按函数引用查找，同一个函数注册了多次，一次只移除一条。各方法返回 <code>this</code>，可以链式调用。</p>
</blockquote>
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
<p>每个监听器都包成了 <code>{ listener, once }</code> 存起来。<code>off</code> 比较的仍然是原函数，所以用 <code>once</code> 注册的监听器，也能用原函数取消。</p>
<p>那 <code>emit</code> 里删除 once 监听器，为什么不直接调 <code>off</code>，而要另写一个 <code>#remove</code> 按包装对象删？考虑同一个函数既用 <code>on</code> 注册了一次，又用 <code>once</code> 注册了一次。如果本轮前面的某个监听器已经把 once 那条删掉了，再按函数去删，删掉的就是 <code>on</code> 那条，误删了。按包装对象删就不会弄错。实测两次 <code>emit</code> 后，按包装对象删，这个函数一共执行 3 次，和 Node.js 一样；按函数删只有 2 次。</p>
<h2>emit 过程中增删监听器会怎样</h2>
<p>下面第一个监听器在执行时，移除了 <code>b</code>，又新加了一个监听器：</p>
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
<p>第一次 <code>emit</code>，<code>b</code> 明明已经被移除了，却还是执行了；新加的监听器反而没执行。原因就是快照：遍历的是 <code>emit</code> 开始时复制的那份数组，执行中的增删改的是原数组，影响不到这一轮。</p>
<p>第二次 <code>emit</code> 用的是新快照，<code>b</code> 已经不在了，once 那条也在上一轮被移除了，新加的监听器开始执行，所以是 <code>a,new</code>。</p>
<p>把同样的代码换成 Node.js 的 <code>require(&#x27;events&#x27;).EventEmitter</code>，第一次输出同样是 <code>a,b,once1</code>。</p>
<h2>常见追问</h2>
<p><strong>某个监听器抛错了会怎样？</strong></p>
<blockquote>
<p>上面的实现里，错误会直接抛出去，后面的监听器就不执行了。如果要互不影响，可以在循环里加 <code>try...catch</code>，把错误交给统一的错误处理。</p>
</blockquote>
<p><strong>为什么一定要提供 <code>off</code>？</strong></p>
<blockquote>
<p>组件卸载时如果不移除监听器，回调会一直引用组件里的数据，造成内存泄漏，还会去更新一个已经卸载的组件。</p>
</blockquote>
<p><strong>浏览器里有现成的吗？</strong></p>
<blockquote>
<p>有。<code>EventTarget</code> 配合 <code>addEventListener</code>、<code>dispatchEvent</code> 能做同样的事，监听选项 <code>{ once: true }</code> 就对应 <code>once</code>。</p>
</blockquote>`};export{e as default};