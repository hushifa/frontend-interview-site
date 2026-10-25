var e={answerHtml:`<p>同一个点击可能被按钮、外层卡片和页面容器分别处理。<code>addEventListener()</code> 的选项不是四种“性能开关”，而是在回答不同问题：沿传播路径的什么时候执行、是否只执行一次、能不能取消默认动作，以及什么时候统一解除监听。</p>
<table><thead><tr><th>选项</th><th>主要作用</th></tr></thead><tbody><tr><td><code>capture</code></td><td>选择捕获方向的监听，默认是非捕获监听</td></tr><tr><td><code>once</code></td><td>监听器被调用一次后自动移除</td></tr><tr><td><code>passive</code></td><td>声明本监听器不会取消默认行为</td></tr><tr><td><code>signal</code></td><td>把监听器的移除与 AbortSignal 的取消关联起来</td></tr></tbody></table>
<p>这些选项可以组合，例如捕获阶段只执行一次的监听器，也可以在执行前因 signal 被取消而移除。</p>
<h2>capture 不等于事件永远处于捕获阶段</h2>
<p>对于普通 DOM 树中会冒泡的事件，可以先理解成：祖先捕获 → 到达目标 → 祖先冒泡。</p>
<p>祖先的捕获监听先执行，随后执行目标上的捕获监听和非捕获监听，再沿祖先链冒泡。<strong>目标元素上的两组监听执行时，<code>eventPhase</code> 都是 <code>AT_TARGET</code>，即 2。</strong> capture 决定监听器被哪次调用选中，不意味着 <code>capture: true</code> 对应的 eventPhase 永远是 1。</p>
<p>下面在浏览器中创建一棵离线 DOM 子树，不需要页面预先提供元素，也能验证事件在父子之间的传播：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> outer = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
<span class="hljs-keyword">const</span> button = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;button&#x27;</span>);
outer.<span class="hljs-title function_">append</span>(button);

<span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> records = [];
<span class="hljs-keyword">const</span> <span class="hljs-title function_">record</span> = (<span class="hljs-params">name</span>) =&gt; <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> records.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${name}</span>:<span class="hljs-subst">\${event.eventPhase}</span>\`</span>);

outer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">record</span>(<span class="hljs-string">&#x27;外层捕获&#x27;</span>), {
  <span class="hljs-attr">capture</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
});
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">record</span>(<span class="hljs-string">&#x27;目标捕获&#x27;</span>), {
  <span class="hljs-attr">capture</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
});
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">record</span>(<span class="hljs-string">&#x27;目标单次&#x27;</span>), {
  <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
});
outer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">record</span>(<span class="hljs-string">&#x27;外层冒泡&#x27;</span>), {
  <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
});

button.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Event</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, { <span class="hljs-attr">bubbles</span>: <span class="hljs-literal">true</span> }));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(records.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>));

records.<span class="hljs-property">length</span> = <span class="hljs-number">0</span>;
button.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Event</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, { <span class="hljs-attr">bubbles</span>: <span class="hljs-literal">true</span> }));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(records.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>));

controller.<span class="hljs-title function_">abort</span>();
records.<span class="hljs-property">length</span> = <span class="hljs-number">0</span>;
button.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Event</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, { <span class="hljs-attr">bubbles</span>: <span class="hljs-literal">true</span> }));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(records.<span class="hljs-property">length</span>);
</code></pre></div>
<p>三次输出依次为：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">外层捕获:1 → 目标捕获:2 → 目标单次:2 → 外层冒泡:3
外层捕获:1 → 目标捕获:2 → 外层冒泡:3
0
</code></pre></div>
<p>第二次派发时单次监听已经移除；取消 controller 后，剩下的关联监听也都移除。这里的自定义事件显式设置 <code>bubbles: true</code>，因为 <code>new Event()</code> 默认不会冒泡。真实事件是否冒泡、能否跨 Shadow DOM 边界，由事件自身的属性和相关规则决定，不是注册监听时指定 capture 就能改变的。</p>
<h2>once 限制调用次数，不等待异步工作结束</h2>
<p><code>once: true</code> 的监听器在这次调用过程中就会被移除，不需要等回调内部的 Promise 完成。因此它不是“第一次请求结束之后才禁止再次点击”的控制器。</p>
<p>如果回调发起上传，监听器移除不代表上传取消；如果上传失败，也不会自动把监听器重新挂回去。需要可重试、禁用按钮或防止并发提交时，应设计明确的业务状态，不能只依赖 once。</p>
<p>同理，事件监听系统不会等待 async 回调返回的 Promise，再决定是否继续传播或执行默认动作。需要阻止表单提交时，应在同步阶段及时调用 <code>preventDefault()</code>，不要先 await 一个接口再尝试取消已经发生的默认提交。</p>
<h2>passive 为什么与滚动性能有关</h2>
<p>某些触摸或滚轮事件能够取消浏览器的滚动。浏览器若不知道监听器会不会调用 <code>preventDefault()</code>，就可能需要等待相应处理结果，才能继续默认滚动。</p>
<p><code>passive: true</code> 告诉浏览器本监听器不取消默认行为，有助于减少这类等待。在 passive 监听器中调用 <code>preventDefault()</code> 不会成功取消默认动作，浏览器还可能给出警告。</p>
<p>但 passive 并不会把回调移到其他线程。一个里面执行大量计算的 passive 监听器，仍然会占用主线程。对本来不可取消的事件，passive 也不是额外获得流畅性的万能设置。</p>
<p>为了滚动性能，部分浏览器会把特定根节点上的 wheel、touchstart、touchmove 等监听默认按 passive 处理。确实需要取消且事件允许取消时，应按目标浏览器行为显式指定 <code>passive: false</code>；也应先考虑 <code>touch-action</code> 等更合适的交互声明，而不是给所有事件一律禁止默认动作。</p>
<h2>preventDefault 与停止传播不是同一件事</h2>
<p><code>preventDefault()</code> 作用于可取消的默认动作，例如链接导航、表单提交。只有事件 <code>cancelable</code> 为 true，且当前监听不是 passive 等条件满足时，取消才会生效。是否取消可以结合 <code>defaultPrevented</code> 观察。</p>
<p><code>stopPropagation()</code> 阻止事件继续沿传播路径传递，并不等于取消链接跳转；同一次监听调用序列中的其他监听器通常仍可运行。需要连同该序列中后续监听也阻止时，才是 <code>stopImmediatePropagation()</code> 的职责。</p>
<p>随意截断传播会影响父级菜单关闭、事件委托和埋点等逻辑。排查冲突时应确认是谁监听、处于哪个阶段、要阻止的是默认动作还是后续监听，而不是同时调用所有阻止方法。</p>
<h2>清理监听器时，函数引用和 capture 必须对应</h2>
<p>浏览器识别同一个监听注册，主要依据事件类型、监听器引用和 capture。重复用同一函数、同一类型、同一 capture 注册，不会创建第二份监听；改变 passive 或 once 后再次注册，也不能当成“更新旧监听选项”。需要修改时，应先移除再注册。</p>
<p>手动 <code>removeEventListener()</code> 需要使用原来的函数或监听对象引用，并匹配 capture；不要求提供与注册时完全同一个 options 对象。两个内容相同的匿名函数仍是两个不同引用，不能用新函数移除旧函数。</p>
<p>使用 signal 可以让一个组件的多条监听一起解除。controller 一旦 abort 就不能复位；重新挂载组件时应创建新的 controller。传入已经取消的 signal，不会建立一个稍后还能恢复的监听器。</p>
<p>最后，解除监听只负责今后不再调用它。回调之前创建的定时器、网络请求和订阅需要各自清理；把同一个 signal 传给支持取消的操作，可以协调生命周期，但不能自动撤销已经完成的业务副作用。</p>`};export{e as default};