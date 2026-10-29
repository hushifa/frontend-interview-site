var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在 React 里写 <code>&lt;button onClick={(e) =&gt; ...}&gt;</code>，<code>e</code> 不是浏览器原生的事件对象，而是 React 包装过的一个对象，文档叫它 React 事件对象，也常被叫作合成事件。它的属性和方法跟原生事件基本一样，比如 <code>target</code>、<code>preventDefault()</code>、<code>stopPropagation()</code>，同时抹平了一些浏览器差异。需要原生事件时，从 <code>e.nativeEvent</code> 读。</p>
<p>React 并不是给每个按钮都调用 <code>addEventListener</code>。它在根节点上统一监听各类事件，事件冒泡到根节点后，React 再根据触发事件的元素找到对应的组件，按组件树的顺序调用你写的处理函数，这就是事件委托。React 17 之前监听挂在 <code>document</code> 上，17 起改成挂在 <code>createRoot</code> 传入的根容器上，这样同一个页面里嵌入多个 React 版本也不会互相干扰。</p>
<p>和原生事件的几个区别要记住。React 17 去掉了事件池，旧版本里事件对象在处理函数执行完后会被清空复用，异步回调里读 <code>e.target</code> 会出问题，现在没有这个限制了。除了 <code>onScroll</code>，React 里的事件都会沿组件树冒泡。<code>onChange</code> 每输入一个字符都会触发，行为对应原生的 <code>input</code> 事件，而不是原生 <code>change</code> 那样失焦才触发。</p>
<p>要注意，React 的冒泡是沿着组件树走的，所以通过 Portal 渲染到 <code>body</code> 下的弹窗，点击事件仍然会冒泡到 React 父组件上，哪怕它们在 DOM 里并不是父子关系。</p>
</blockquote>
<h2>React 事件和原生事件谁先执行</h2>
<p>下面在同一个按钮上同时有 React 监听和原生监听，外层 <code>document</code> 也加了一个原生监听：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> ref = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> button = ref.<span class="hljs-property">current</span>;
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">onNative</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;按钮原生&#x27;</span>);
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">onDocument</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;document 原生&#x27;</span>);
    button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onNative);
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onDocument);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      button.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onNative);
      <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onDocument);
    };
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> console.log(&#x27;React&#x27;)}&gt;点我<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>点击按钮，依次输出“按钮原生”“React”“document 原生”。</p>
<p>为什么按钮自己的原生监听先于 React？因为 React 的处理函数并没有绑在按钮上，而是等事件冒泡到根容器时才统一分发。事件先在按钮上触发原生监听，再往上冒泡到根容器，React 才调用 <code>onClick</code>，然后事件继续冒泡到 <code>document</code>。</p>
<p>这也说明，在 React 的 <code>onClick</code> 里调用 <code>e.stopPropagation()</code>，能阻止事件继续冒泡到 <code>document</code> 上的原生监听，却挡不住按钮自己的原生监听，因为那个已经执行过了。在 React 17 之前，React 监听挂在 <code>document</code> 上，这种情况下阻止冒泡就拦不住 <code>document</code> 上别的监听，这正是 17 改成挂在根容器上的原因之一。</p>
<h2>事件池去掉以后有什么变化</h2>
<p>React 16 及更早版本，为了在老浏览器上节省内存，会复用事件对象，处理函数一结束就把所有字段设成 <code>null</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">handleChange</span>(<span class="hljs-params">e</span>) {
  <span class="hljs-title function_">setData</span>(<span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> ({ ...data, <span class="hljs-attr">text</span>: e.<span class="hljs-property">target</span>.<span class="hljs-property">value</span> }));
}
</code></pre></div>
<p>这段代码在 React 16 里会报错，因为 <code>setData</code> 的更新函数执行时，<code>e</code> 已经被清空了，当时要先调用 <code>e.persist()</code> 才行。React 17 移除了事件池，现在这样写没有问题。</p>
<h2>常见追问</h2>
<p><strong>React 里怎么阻止默认行为？能不能 return false？</strong></p>
<blockquote>
<p>要显式调用 <code>e.preventDefault()</code>。原生 HTML 里内联处理函数 <code>return false</code> 可以阻止默认行为，React 里不行。</p>
</blockquote>
<p><strong>捕获阶段的事件怎么写？</strong></p>
<blockquote>
<p>在事件名后面加 <code>Capture</code>，比如 <code>onClickCapture</code>。它会在捕获阶段执行，比子元素的 <code>onClick</code> 更早，适合做埋点这类不管子元素是否阻止冒泡都要执行的逻辑。</p>
</blockquote>
<p><strong>为什么 onFocus 和 onBlur 能冒泡？</strong></p>
<blockquote>
<p>原生的 <code>focus</code> 和 <code>blur</code> 不冒泡。React 17 起 <code>onFocus</code>、<code>onBlur</code> 底层改用原生的 <code>focusin</code>、<code>focusout</code>，它们会冒泡，所以父元素也能监听到子元素获得或失去焦点。</p>
</blockquote>`};export{e as default};