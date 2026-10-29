var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个列表有一千项，每项都有删除按钮。不用给一千个按钮各绑一个监听器，只在外面的 <code>ul</code> 上绑一个就够了。点击按钮时，事件会从按钮一层层往上传，传到 <code>ul</code> 时统一处理，这就是事件委托。</p>
<p>处理时要分清两个属性。<code>event.target</code> 是最初被点的那个元素，<code>event.currentTarget</code> 是当前正在执行监听器的元素，委托时就是 <code>ul</code>。</p>
<p>委托的好处是监听器少，后来新加的子元素也不用再绑。实际写的时候，用 <code>target.closest(selector)</code> 往上找到真正关心的元素，再确认它在委托容器里面。</p>
<p>要注意，有些事件不冒泡，比如 <code>focus</code>、<code>mouseenter</code>，不能直接委托，可以改用 <code>focusin</code>、<code>pointerover</code>，或者在捕获阶段监听。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面在 <code>#todo-list</code> 上挂一个监听器，处理所有删除按钮：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> list = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#todo-list&#x27;</span>);

list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> button = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;button[data-action]&#x27;</span>);
  <span class="hljs-keyword">if</span> (!button || !list.<span class="hljs-title function_">contains</span>(button)) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> item = button.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;li&#x27;</span>);
  <span class="hljs-keyword">if</span> (button.<span class="hljs-property">dataset</span>.<span class="hljs-property">action</span> === <span class="hljs-string">&#x27;remove&#x27;</span>) item.<span class="hljs-title function_">remove</span>();
});
</code></pre></div>
<p>为什么不直接判断 <code>event.target</code> 是不是按钮？因为按钮里常常有图标。用户点到图标上，<code>target</code> 就是图标元素，不是按钮。所以要用 <code>closest()</code> 从被点的元素往上找，找到最近的按钮。</p>
<p>那 <code>list.contains(button)</code> 又是防什么？<code>closest()</code> 会一直往上找，可能越过 <code>ul</code> 找到外层的同名元素。加这一句，保证找到的按钮确实在列表里面。</p>
<h2>为什么这样能省事</h2>
<p>列表有成百上千项时，只注册一个监听器，内存和注册的成本都更低。动态加进来的新项不需要再单独绑定，因为监听器在父元素上，新项的事件照样冒泡上来。删掉某一项时，也不用逐个解绑。</p>
<h2>target 和 currentTarget 到底差在哪</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;list&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>文字<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>点击 <code>span</code>，监听器挂在 <code>ul</code> 上。这时 <code>event.target</code> 是 <code>span</code>，因为它是真正被点的元素。<code>event.currentTarget</code> 是 <code>ul</code>，因为监听器挂在它身上。如果监听器是普通函数，里面的 <code>this</code> 也是 <code>ul</code>。</p>
<p>还有一个容易踩的坑：<code>currentTarget</code> 只在事件分发的过程中有值。在 <code>setTimeout</code> 或 <code>await</code> 之后再读，拿到的是 <code>null</code>。需要的话，先存到变量里。</p>
<h2>委托时要注意什么</h2>
<p>中间某一层调用了 <code>stopPropagation()</code>，事件就传不上来，委托的监听器收不到。</p>
<p>委托范围也别太大。全挂到 <code>document</code> 上，页面上每次点击都要经过判断逻辑，范围应该尽量小。</p>
<p>最后，键盘能不能操作取决于用的是不是真正的 <code>button</code> 或 <code>a</code> 元素。委托只负责处理逻辑，不能替代正确的标签。</p>
<h2>常见追问</h2>
<p><strong><code>focus</code> 事件能委托吗？</strong></p>
<blockquote>
<p>不能直接委托，因为 <code>focus</code> 不冒泡。可以改用会冒泡的 <code>focusin</code>，或者在父元素上用捕获阶段监听 <code>focus</code>。<code>mouseenter</code> 也一样，可以换成 <code>pointerover</code>。</p>
</blockquote>
<p><strong>在异步回调里读 <code>event.currentTarget</code> 为什么是 null？</strong></p>
<blockquote>
<p>因为它只在事件分发期间有值，分发结束就被清空了。要在异步代码里用，先在同步部分把它存到变量里。</p>
</blockquote>`};export{e as default};