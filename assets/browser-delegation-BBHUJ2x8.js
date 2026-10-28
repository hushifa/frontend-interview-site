var e={answerHtml:`<h2>简答</h2>
<ul>
<li>事件委托是在父容器上统一监听子元素冒泡上来的事件。</li>
<li>target 是事件实际来源，currentTarget 是当前正在执行监听器的元素。</li>
<li>用 closest 匹配按钮，可以兼容点击到图标等子元素的情况；动态新增的子元素无需重新绑定。</li>
<li>不冒泡的事件、Shadow DOM 与 iframe 有各自的边界；异步处理前要先保存需要的元素引用。</li>
</ul>
<p>列表里有一百个“查看答案”按钮时，可以给每个按钮分别注册 click，也可以只给共同的列表容器注册一次。按钮的 click 沿 DOM 传播到容器后，容器判断来自哪个按钮，再执行对应操作。后一种方式就是常见的事件委托。</p>
<p>委托特别适合不断添加、删除项目的列表：新增按钮不必单独补绑监听，只要仍属于这个容器、事件也能传播到容器，就可以沿用同一套逻辑。但“减少监听数量”不是所有交互都应放到 document 的理由，边界清晰的小组件直接监听通常也很好维护。</p>
<h2>target 说明来自哪里，currentTarget 说明谁正在处理</h2>
<p>考虑下面的结构：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;questions&quot;</span> <span class="hljs-attr">data-question-list</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">data-question-id</span>=<span class="hljs-string">&quot;js-closure&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>↗<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
      查看闭包题
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>用户点中箭头 span 时，在普通 DOM 的这次事件中：</p>
<ul>
<li><code>event.target</code> 是 span，即监听者看到的事件目标。</li>
<li>按钮上的监听执行时，<code>event.currentTarget</code> 是按钮。</li>
<li>ul 上的监听执行时，<code>event.currentTarget</code> 是 ul。</li>
</ul>
<p>所以不能直接用 <code>event.target.dataset.questionId</code>：目标可能是按钮内部的图标或文字容器，那个元素没有题目编号。也不能用 <code>currentTarget.dataset.questionId</code>，因为委托监听挂在列表上，编号在按钮上。</p>
<p>常见做法是从 target 向上找最近的业务按钮，再确认它属于当前列表。</p>
<h2>一个可以直接用于该结构的绑定函数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindQuestionList</span>(<span class="hljs-params">list, onOpen</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  list.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!(event.<span class="hljs-property">target</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Element</span>)) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> button = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;button[data-question-id]&#x27;</span>);
    <span class="hljs-keyword">if</span> (!button || !list.<span class="hljs-title function_">contains</span>(button)) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (button.<span class="hljs-title function_">matches</span>(<span class="hljs-string">&#x27;:disabled&#x27;</span>)) <span class="hljs-keyword">return</span>;

    <span class="hljs-comment">// 嵌套的独立列表由它自己的监听器处理。</span>
    <span class="hljs-keyword">if</span> (button.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;[data-question-list]&#x27;</span>) !== list) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> id = button.<span class="hljs-property">dataset</span>.<span class="hljs-property">questionId</span>;
    <span class="hljs-keyword">if</span> (!id) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">onOpen</span>(id);
  }, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>在 DOM 就绪后，把 <code>document.querySelector(&#x27;#questions&#x27;)</code> 和实际的打开函数传入；组件销毁时调用返回的清理函数。示例假定 list 是存在的元素，且带有 <code>data-question-list</code>。</p>
<p><code>closest()</code> 先检查元素自身，再沿祖先向上找。因此直接点击按钮和点击内部 span 都能找到同一个按钮。<code>contains()</code> 把匹配限制在容器内，避免祖先查找越过组件边界。最近的列表标记检查则进一步防止内层列表的操作被外层重复处理。</p>
<p>这里使用固定的 data 字段映射业务 ID，没有把属性值当成函数名执行。服务端接口仍需校验权限，DOM 中的题目或资源编号不是可信的授权凭据。</p>
<h2>动态内容能复用监听，但替换容器不行</h2>
<p>向 ul 中追加新的 li 和按钮，不需要重新绑定，事件仍经过原来的 ul。删除一个 li，也不会留下“必须逐个移除按钮监听”的工作，因为监听本来就在 ul 上。</p>
<p>但如果用框架或 DOM 操作把整个 ul 替换成另一个新节点，旧节点上的监听不会自动搬过去。需要在新容器挂载时重新绑定，并在旧容器销毁时清理。</p>
<p>委托可以减少重复注册，不等于处理函数没有成本。把所有页面事件统一塞进 document，再进行大量 selector 匹配，可能让组件边界和调试都更复杂。优先选择能够覆盖业务子项的最近稳定祖先。</p>
<h2>不冒泡的事件，并非完全不能集中处理</h2>
<p>普通委托常用冒泡，但也可以把祖先监听放在捕获阶段。比如原生 <code>focus</code>、<code>blur</code> 不冒泡，可以用 <code>focusin</code>、<code>focusout</code> 处理冒泡式委托，或者在祖先上以 capture 监听 focus/blur，按需要选择兼容方式。</p>
<p><code>mouseenter</code> 不像 <code>mouseover</code> 那样冒泡；若改用 mouseover 或 pointerover 做委托，还要检查 <code>relatedTarget</code>，避免指针从按钮的一个内部子元素移到另一个时，误认为重新进入整个按钮。改事件名不是没有语义代价的替换。</p>
<p>如果子节点在事件到达委托容器前调用了 <code>stopPropagation()</code>，冒泡监听可能收不到它。换成捕获可以改变观察时机，却不应被当成无条件绕过子组件意图的手段。先约定组件如何合作，通常比相互截断传播更稳妥。</p>
<h2>Shadow DOM 和 iframe 有自己的边界</h2>
<p>事件跨越 Shadow DOM 时，外部观察到的 target 可能被重定向为宿主元素，不再是内部按钮。是否跨越边界还取决于事件的 <code>composed</code> 等属性；不是把监听挂得更高就能看到所有内部细节。</p>
<p><code>composedPath()</code> 可以提供当前派发的传播路径，但对 closed shadow root，外部不会得到其中所有内部节点。组件间通信更适合定义明确的自定义事件和数据，而不是依赖外部代码寻找私有按钮。</p>
<p>iframe 是另一个文档，它内部的 click 不会像普通后代元素事件那样冒泡到外层页面。跨文档协作需要另行设计，例如受控的消息通信。</p>
<h2>异步处理前先保存需要的信息</h2>
<p>原生事件对象的 <code>currentTarget</code> 只在监听器执行过程中有相应值，派发结束后会变回 null。若监听器中先 await，再访问 <code>event.currentTarget</code>，就可能得不到原来的容器。应在同步部分先保存容器引用和业务 ID，再做异步工作。</p>
<p>这不是“某个框架回收事件对象”才会出现的问题，原生 DOM 事件本身就有这样的生命周期。只需要题目编号时，像示例一样在同步阶段提取字符串，比长时间保留整个事件对象更明确。</p>
<p>最后，交互仍应使用原生 button、a 和表单控件。按钮可由键盘产生 click，使委托逻辑自然复用；把任意 div 变成可点击元素，再另外补键盘、焦点和禁用状态，会多出一套容易遗漏的行为。</p>`};export{e as default};