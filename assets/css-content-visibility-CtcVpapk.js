var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>长文章里有几百个段落，用户一次只看得到一屏。给每节加上 <code>content-visibility: auto</code>，离开视口的部分浏览器就先不算布局、不画，等它快滚进视口时再渲染。</p>
<p>它跟虚拟列表那种移除 DOM 的做法不同，节点一直都在。页内查找、锚点跳转、Tab 切换焦点、读屏软件都能正常访问，组件的状态也不会丢。</p>
<p>要注意，没渲染的内容没有高度，所以要用 <code>contain-intrinsic-size: auto 500px</code> 给一个估计高度，不然滚动条会乱跳。</p>
<p>它只省了渲染的工作。节点占的内存、JavaScript 的工作都还在，上万条数据仍然应该用虚拟列表。</p>
</blockquote>
<h2>基本写法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article-section</span> {
  <span class="hljs-attribute">content-visibility</span>: auto;
  <span class="hljs-attribute">contain-intrinsic-size</span>: auto <span class="hljs-number">600px</span>;
}
</code></pre></div>
<p>为什么一定要写 <code>contain-intrinsic-size</code>？因为被跳过的内容浏览器根本没有去算，不知道它多高。不写的话，屏幕外每一节都按高度 0 处理，一滚动进来突然变高，滚动条就会跳。</p>
<p><code>auto 600px</code> 的意思是：第一次还没渲染时，先按 600px 占位；真正渲染过一次后，浏览器记住真实高度，之后再离开视口就按真实高度占位。</p>
<p>它适合长文章分节、评论区、长表单分组这类结构简单、数量中等的内容。</p>
<h2>和虚拟列表比，差在哪里</h2>
<p>虚拟列表只把看得见的那几十条放进 DOM，其余的直接删掉，所以节点很少，能撑住几千到几十万条数据。代价是不在 DOM 里的内容，页内查找找不到，焦点也到不了，状态要自己保存和恢复。</p>
<p><code>content-visibility: auto</code> 节点数量不变，查找、焦点、状态都正常，但节点本身的开销省不掉，适合几百个区块这样的规模。</p>
<p>所以两者不是谁替代谁。数据量大就用虚拟列表，内容多但数量可控就用 <code>content-visibility</code>。</p>
<h2>加上以后，样式为什么变了</h2>
<p><code>content-visibility: auto</code> 会给元素加上布局、样式和绘制三种包含，意思是把元素里面和外面隔开计算。所以有两个副作用：里面 <code>position: fixed</code> 的元素会改成以这个元素为参照，不再相对视口；超出元素的内容会被裁掉。</p>
<p>还有几件它管不了的事。屏幕外的图片和 iframe 仍然会加载，要另外加 <code>loading=&quot;lazy&quot;</code>。里面的定时器、订阅照常运行，要自己暂停。</p>
<p>收益有多大，取决于跳过的内容有多复杂。用 Performance 面板对比开启前后的渲染耗时再下结论。</p>
<h2>hidden 值和 display: none 有什么不同</h2>
<p><code>content-visibility: hidden</code> 不管在不在视口，都跳过内容的渲染。它的内容对页内查找和焦点也不可用。</p>
<p>和 <code>display: none</code> 的区别是，它会保留元素已经算好的渲染状态。切回可见时，比 <code>display: none</code> 恢复得更快。所以它适合暂时隐藏、很快又会切回来的标签页面板。</p>
<h2>常见追问</h2>
<p><strong>怎么知道一个元素现在被跳过了？</strong></p>
<blockquote>
<p>元素在跳过渲染和恢复渲染时，会触发 <code>contentvisibilityautostatechange</code> 事件。可以在这个事件里暂停或者恢复里面的工作，比如动画和数据轮询。</p>
</blockquote>`};export{e as default};