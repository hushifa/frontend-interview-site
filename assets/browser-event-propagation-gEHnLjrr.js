var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上有一个 <code>div</code> 包着一个按钮，两者都监听了 <code>click</code>。点击按钮时，事件先从 <code>window</code> 一层层往下传，经过 <code>div</code> 到达按钮，这段叫捕获；然后再从按钮一层层往上传回 <code>window</code>，这段叫冒泡。<code>addEventListener</code> 默认在冒泡阶段执行，所以通常是按钮的监听器先执行、<code>div</code> 的后执行；第三个参数传 <code>true</code> 或 <code>{ capture: true }</code>，就改在捕获阶段执行，外层会先拿到事件。</p>
<p>阻止冒泡和阻止默认行为管的是两件事。<code>stopPropagation()</code> 让事件不再传给后面的节点，但当前节点上的其他监听器照常执行；<code>stopImmediatePropagation()</code> 连当前节点上后面的监听器也不执行。<code>preventDefault()</code> 不管传播，只取消浏览器自带的动作，比如链接跳转、表单提交、复选框勾选。</p>
<p>所以想让点击链接不跳转，要用 <code>preventDefault()</code>，只调 <code>stopPropagation()</code> 链接照样跳；反过来，调了 <code>preventDefault()</code>，外层的监听器仍然收得到事件。</p>
<p>要注意两个边界。不是所有事件都冒泡，<code>focus</code>、<code>blur</code>、<code>mouseenter</code>、<code>load</code> 都不冒泡，自己 <code>new Event()</code> 创建的事件默认也不冒泡。在 <code>passive: true</code> 的监听器里调 <code>preventDefault()</code> 不起作用。</p>
</blockquote>
<h2>先看事件按什么顺序传</h2>
<p>下面在 <code>#outer</code> 和里面的按钮上各挂两个监听器，一个在捕获阶段，一个在冒泡阶段，并打印 <code>eventPhase</code>（1 是捕获阶段，2 是到达目标，3 是冒泡阶段）：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">outer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;outer 捕获&#x27;</span>, e.<span class="hljs-property">eventPhase</span>), <span class="hljs-literal">true</span>);
btn.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;btn 冒泡监听器&#x27;</span>, e.<span class="hljs-property">eventPhase</span>));
btn.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;btn 捕获监听器&#x27;</span>, e.<span class="hljs-property">eventPhase</span>), <span class="hljs-literal">true</span>);
outer.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;outer 冒泡&#x27;</span>, e.<span class="hljs-property">eventPhase</span>));

btn.<span class="hljs-title function_">click</span>();
<span class="hljs-comment">// outer 捕获 1</span>
<span class="hljs-comment">// btn 捕获监听器 2</span>
<span class="hljs-comment">// btn 冒泡监听器 2</span>
<span class="hljs-comment">// outer 冒泡 3</span>
</code></pre></div>
<p>这段在 Chrome 里实际运行过。<code>outer</code> 的捕获监听器最先执行，冒泡监听器最后执行，这符合“先往下、再往上”。</p>
<p>可是按钮上的两个监听器有点意外：冒泡监听器是先注册的，却后执行。原因是按钮本身就是目标，它的两个监听器都在“到达目标”阶段执行，<code>eventPhase</code> 都是 2。按现在的 DOM 规范，目标节点上也是先执行捕获监听器，再执行非捕获监听器，同一类里才按注册顺序。一些老文章说“目标节点上按注册顺序执行”，那是规范调整之前的旧说法，以现在的规范和浏览器行为为准。</p>
<h2>三个方法分别拦住了什么</h2>
<p><code>stopPropagation()</code> 拦的是“传到下一个节点”。MDN 说它阻止当前事件在捕获和冒泡阶段继续传播，但不阻止默认行为，也不阻止当前元素上的其他监听器。在 Chrome 里实测：中间那层 <code>div</code> 上有两个冒泡监听器，第一个调了 <code>stopPropagation()</code>，第二个照样执行，再外层的监听器就收不到了。</p>
<p><code>stopImmediatePropagation()</code> 拦得更彻底。MDN 说，同一个元素上的多个监听器按添加顺序调用，其中一个调用了它，剩下的监听器都不会执行，这个元素上的和其他元素上的都不会。</p>
<p><code>preventDefault()</code> 和传播没有关系。它告诉浏览器“这个事件的默认动作不要做”。在 Chrome 里实测：给 <code>href=&quot;#jump&quot;</code> 的链接调用 <code>preventDefault()</code>，地址的 hash 没有变；给复选框调用，点击后 <code>checked</code> 仍然是 <code>false</code>；而外层 <code>div</code> 的监听器两次都收到了点击。可以用 <code>event.defaultPrevented</code> 判断某个事件是否已被取消。</p>
<h2>哪些情况下 preventDefault() 不起作用</h2>
<p>第一种是事件本身不能取消。MDN 说，对 <code>cancelable</code> 为 <code>false</code> 的事件调用 <code>preventDefault()</code> 没有效果，比如 <code>load</code> 和媒体的 <code>play</code> 事件。自己用 <code>new Event(&#x27;x&#x27;)</code> 创建事件时，<code>cancelable</code> 和 <code>bubbles</code> 默认都是 <code>false</code>，要显式传 <code>{ cancelable: true }</code>。</p>
<p>第二种是监听器声明了 <code>passive: true</code>。DOM 规范规定，执行 passive 监听器时会标记“正在 passive 监听器中”，这期间调 <code>preventDefault()</code> 不会设置取消标记。在 Chrome 里实测，在 passive 的 <code>wheel</code> 监听器里调用后，<code>defaultPrevented</code> 仍然是 <code>false</code>。MDN 提到浏览器可能会在控制台给出警告。<code>passive</code> 的作用和默认值见<a href="/questions/browser-dom-events/">《addEventListener 的 capture、once、passive 和 signal 有什么作用？》</a>。</p>
<h2>哪些事件不冒泡</h2>
<p>按 MDN 各事件页面的说明，<code>focus</code> 和 <code>blur</code> 不冒泡，紧跟着触发的 <code>focusin</code> 和 <code>focusout</code> 会冒泡；<code>mouseenter</code>、<code>mouseleave</code> 不冒泡，<code>mouseover</code>、<code>mouseout</code> 会冒泡；<code>load</code> 和媒体元素的 <code>play</code> 不冒泡也不能取消。</p>
<p>不冒泡不等于外层完全拿不到。捕获阶段仍然会经过外层，所以在 <code>document</code> 上用捕获方式监听 <code>focus</code> 能收到。在 Chrome 里实测，给一个输入框派发 <code>focus</code>，<code>document</code> 上的捕获监听器执行了，冒泡监听器没有执行。这一点在做事件委托时很有用，委托的写法见<a href="/questions/browser-delegation/">《事件委托是什么？target 和 currentTarget 有何区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>return false</code> 能同时阻止冒泡和默认行为吗？</strong></p>
<blockquote>
<p>在原生 <code>addEventListener</code> 的监听器里，返回值会被忽略。写在 <code>onclick</code> 这种事件处理属性里时，<code>return false</code> 会取消默认行为，但不会阻止冒泡。在 Chrome 里实测，<code>onclick=&quot;return false&quot;</code> 的链接没有跳转，外层 <code>div</code> 仍然收到了点击。某些库会让 <code>return false</code> 同时阻止冒泡，那是库自己的约定。</p>
</blockquote>
<p><strong>什么时候需要在捕获阶段监听？</strong></p>
<blockquote>
<p>想比内层元素更早拿到事件时。比如点击页面任意位置关闭弹层，内层组件可能调了 <code>stopPropagation()</code>，在冒泡阶段就收不到了，改在捕获阶段监听就能先拿到。另一个场景是监听不冒泡的事件，比如在外层统一处理 <code>focus</code>。</p>
</blockquote>
<p><strong>随便调用 <code>stopPropagation()</code> 有什么问题？</strong></p>
<blockquote>
<p>它会让外层的监听器全部收不到这个事件，包括事件委托、埋点统计、点击外部关闭弹层这类逻辑，而且这类问题很难排查。如果只是想让外层不处理，可以在外层判断 <code>event.target</code> 或检查 <code>defaultPrevented</code>，而不是直接切断传播。</p>
</blockquote>`};export{e as default};