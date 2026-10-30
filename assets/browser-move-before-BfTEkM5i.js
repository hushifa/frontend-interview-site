var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>parent.moveBefore(node, ref)</code> 把 <code>node</code> 移动到 <code>parent</code> 里、<code>ref</code> 前面，<code>ref</code> 传 <code>null</code> 就放到最后。参数和 <code>insertBefore</code> 一样，区别在于它不会先把节点移除再插入。</p>
<p>用 <code>insertBefore</code>、<code>append</code> 移动一个已经在页面上的节点，浏览器内部是先移除、再插入，节点的一部分状态会被重置。最明显的是 iframe 会重新加载，正在播放的嵌入视频回到开头。焦点也会丢，CSS 动画和过渡重新开始，打开的 popover 被关掉，模态 dialog 也会关闭。</p>
<p><code>moveBefore</code> 是真正的移动，这些状态都能保留。所以拖拽排序、把播放器挪到另一个区域、框架在列表重排时移动 DOM，都可以用它避免状态丢失。自定义元素用它移动时，会调用 <code>connectedMoveCallback()</code>，而不是先后调用 <code>disconnectedCallback()</code> 和 <code>connectedCallback()</code>。</p>
<p>要注意它有限制。节点和目标必须在同一个文档里，并且要么都连接在页面上、要么都不在，否则抛出 <code>HierarchyRequestError</code>。兼容性上 Chrome 133、Firefox 144 起支持，Safari 还不支持。所以要用 <code>try...catch</code> 回退到 <code>insertBefore</code>。</p>
</blockquote>
<h2>用 insertBefore 移动会丢什么</h2>
<p>假设页面上有一个嵌入视频的 iframe，用户正在看，界面布局变了，要把它移到侧边栏：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">sidebar.<span class="hljs-title function_">insertBefore</span>(player, <span class="hljs-literal">null</span>);
</code></pre></div>
<p>视频会从头开始，因为 iframe 被移除后重新插入，浏览器会重新加载它的内容。MDN 列出了用 <code>insertBefore</code> 这类方法移动时会被重置、用 <code>moveBefore</code> 能保留的状态：</p>
<ul>
<li>动画和过渡的进度</li>
<li><code>&lt;iframe&gt;</code> 的加载状态</li>
<li>交互状态，比如 <code>:focus</code> 和 <code>:active</code></li>
<li>全屏元素的状态</li>
<li>popover 的打开状态</li>
<li><code>&lt;dialog&gt;</code> 的模态状态，模态对话框不会被关闭</li>
</ul>
<p><code>&lt;video&gt;</code> 和 <code>&lt;audio&gt;</code> 的播放状态不在列表里，因为这两个元素被移除再插入时本来就会保留播放状态，不管用哪种方法移动。</p>
<h2>改用 moveBefore</h2>
<p>把上面那行换成 <code>moveBefore</code>，视频就能接着播放：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">moveNode</span>(<span class="hljs-params">parent, node, ref</span>) {
  <span class="hljs-keyword">try</span> {
    parent.<span class="hljs-title function_">moveBefore</span>(node, ref);
  } <span class="hljs-keyword">catch</span> {
    parent.<span class="hljs-title function_">insertBefore</span>(node, ref);
  }
}

<span class="hljs-title function_">moveNode</span>(sidebar, player, <span class="hljs-literal">null</span>);
</code></pre></div>
<p>为什么要包一层 <code>try...catch</code>？一方面不支持的浏览器里没有这个方法，调用会抛 <code>TypeError</code>；另一方面就算支持，下面几种情况也会抛 <code>HierarchyRequestError</code>：</p>
<ul>
<li>节点不在页面上，却要移到页面上的元素里，或者反过来</li>
<li>节点是调用者的祖先</li>
<li>节点和目标属于不同的文档</li>
<li>节点不是 <code>Element</code> 或 <code>CharacterData</code> 节点</li>
</ul>
<p>另外，<code>ref</code> 不是调用者的子节点时抛 <code>NotFoundError</code>，第二个参数没传时抛 <code>TypeError</code>。回退到 <code>insertBefore</code> 就是接受状态被重置，至少位置能移过去。</p>
<h2>自定义元素和 MutationObserver 能感知到吗</h2>
<p>自定义元素用 <code>insertBefore</code> 移动时，会先调用 <code>disconnectedCallback()</code> 再调用 <code>connectedCallback()</code>，组件可能会在这两步里做清理和重新初始化。用 <code>moveBefore</code> 移动时，如果元素定义了 <code>connectedMoveCallback()</code>，浏览器只调用它，不再走断开和连接：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">VideoCard</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">startPlayer</span>();
  }
  <span class="hljs-title function_">disconnectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">stopPlayer</span>();
  }
  <span class="hljs-title function_">connectedMoveCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-comment">// 只是换了位置，播放器不用停也不用重建</span>
  }
}
</code></pre></div>
<p>MutationObserver 那边没有新的记录类型。用 <code>moveBefore</code> 移动的节点，仍然记录成一次移除加一次添加，所以已有的监听代码不用改。</p>
<h2>常见追问</h2>
<p><strong>MutationObserver 能区分 moveBefore 和普通的移除插入吗？</strong></p>
<blockquote>
<p>不能。按 MDN 的说明，<code>moveBefore</code> 移动的节点同样记录成一次移除和一次添加。需要区分时，自定义元素可以用 <code>connectedMoveCallback()</code>。</p>
</blockquote>
<p><strong>iframe 还有哪些常见问题？</strong></p>
<blockquote>
<p>加载开销、跨域通信这些问题见<a href="/questions/browser-iframe/">《iframe 有哪些优缺点？父页面和 iframe 之间怎样通信？》</a>。</p>
</blockquote>`};export{e as default};