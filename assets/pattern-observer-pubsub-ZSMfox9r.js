var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>商品降价时要通知所有关注它的用户，这就是“一个东西变了，很多地方要知道”的场景，两种模式都是为它设计的。</p>
<p>观察者模式里，商品自己保存一份关注者列表，提供“添加关注”“取消关注”的方法，价格一变，就遍历列表挨个调用关注者的方法。商品和关注者是直接联系的，商品知道自己通知的是谁。</p>
<p>发布订阅模式在中间加了一个事件中心。订阅者向事件中心说“我关心 <code>price-change</code> 这个事件”，发布者只管向事件中心发出 <code>price-change</code>，由事件中心找到所有订阅者去通知。发布者和订阅者彼此不知道对方存在，只靠事件名联系，所以耦合更松，可以跨模块使用。</p>
<p>前端里两者都很常见。Vue 的响应式数据记住了哪些副作用依赖它，变化时直接触发它们，更接近观察者模式。Node.js 的 EventEmitter、浏览器的 <code>addEventListener</code>、Vue 2 常用的全局事件总线，都是按事件名订阅和触发，属于发布订阅。要注意，订阅了就要在不用时取消，组件卸载时不移除监听，回调和它引用的数据会一直留在内存里。</p>
</blockquote>
<h2>两种写法对比</h2>
<p>下面用同一个降价通知分别实现：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 观察者模式：被观察者直接持有观察者</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Product</span> {
  #observers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">price</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">price</span> = price;
  }
  <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">observer</span>) {
    <span class="hljs-variable language_">this</span>.#observers.<span class="hljs-title function_">add</span>(observer);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.#observers.<span class="hljs-title function_">delete</span>(observer);
  }
  <span class="hljs-title function_">setPrice</span>(<span class="hljs-params">price</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">price</span> = price;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> observer <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#observers) observer.<span class="hljs-title function_">update</span>(<span class="hljs-variable language_">this</span>);
  }
}

<span class="hljs-comment">// 发布订阅：通过事件中心解耦</span>
<span class="hljs-keyword">class</span> <span class="hljs-title class_">EventBus</span> {
  #handlers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-title function_">on</span>(<span class="hljs-params">event, handler</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">has</span>(event)) <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">set</span>(event, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>());
    <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">get</span>(event).<span class="hljs-title function_">add</span>(handler);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">get</span>(event).<span class="hljs-title function_">delete</span>(handler);
  }
  <span class="hljs-title function_">emit</span>(<span class="hljs-params">event, payload</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> handler <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">get</span>(event) ?? []) <span class="hljs-title function_">handler</span>(payload);
  }
}

<span class="hljs-keyword">const</span> logs = [];
<span class="hljs-keyword">const</span> phone = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Product</span>(<span class="hljs-number">3000</span>);
<span class="hljs-keyword">const</span> unsubscribe = phone.<span class="hljs-title function_">subscribe</span>({ <span class="hljs-attr">update</span>: <span class="hljs-function">(<span class="hljs-params">p</span>) =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`观察者：<span class="hljs-subst">\${p.price}</span>\`</span>) });
phone.<span class="hljs-title function_">setPrice</span>(<span class="hljs-number">2800</span>);
<span class="hljs-title function_">unsubscribe</span>();
phone.<span class="hljs-title function_">setPrice</span>(<span class="hljs-number">2500</span>);

<span class="hljs-keyword">const</span> bus = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventBus</span>();
bus.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;price-change&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">price</span>) =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`订阅者：<span class="hljs-subst">\${price}</span>\`</span>));
bus.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;price-change&#x27;</span>, <span class="hljs-number">2800</span>);
bus.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;stock-change&#x27;</span>, <span class="hljs-number">0</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(logs.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// 观察者：2800|订阅者：2800</span>
</code></pre></div>
<p><code>phone.setPrice(2500)</code> 为什么没有记录？因为在那之前调用了 <code>subscribe</code> 返回的取消函数，观察者已经从列表里删掉了。把取消函数作为返回值，调用方不用自己保存回调的引用，组件卸载时调用一下就能清理。</p>
<p>发布订阅这边，<code>bus.emit(&#x27;stock-change&#x27;, 0)</code> 也没有输出。因为没有人订阅这个事件名，事件中心找不到处理函数，什么也不做，发布者并不知道有没有人在听。</p>
<h2>怎么选</h2>
<p>需要通知的对象明确、关系固定，比如一个数据源对应几个视图，用观察者模式就够了，调用关系清楚，调试时容易顺着找到是谁触发的。</p>
<p>需要跨模块、跨层级通信，发布方不应该依赖接收方，比如埋点、全局消息提示，用发布订阅更合适。可是事件名多了以后，很难知道一个事件被谁发出、被谁接收，所以大型项目里不建议用全局事件总线代替状态管理。手写完整的事件中心，包括 <code>once</code> 和错误处理，见<a href="/questions/alg-event-emitter/">《怎样手写一个支持 on、off、once 和 emit 的事件中心？》</a>。</p>
<h2>常见追问</h2>
<p><strong>DOM 事件属于哪一种？</strong></p>
<blockquote>
<p><code>addEventListener</code> 按事件类型订阅，<code>dispatchEvent</code> 按类型触发，按事件名解耦，更接近发布订阅。不过事件中心就是元素自己，还多了捕获和冒泡这类传播规则。</p>
</blockquote>
<p><strong>Vue 3 为什么去掉了 $on、$off？</strong></p>
<blockquote>
<p>Vue 3 移除了实例上的事件接口，官方认为全局事件总线难以追踪数据流，推荐用 props、emit、provide/inject 或状态管理库。确实需要事件总线时，可以用 mitt 这类小库。</p>
</blockquote>`};export{e as default};