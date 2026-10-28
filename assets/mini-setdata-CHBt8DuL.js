var e={answerHtml:`<h2>简答</h2>
<ul>
<li>官方列出的两个主要因素是：调用 <code>setData</code> 的组件 Shadow 树节点总量，以及更新的数据量，前者影响更大。</li>
<li>合理拆分组件、控制单个 Shadow 树的大小，是最有效的优化手段。</li>
<li>只传变化的字段，可以用数据路径（如 <code>&#x27;list[3].done&#x27;</code>）更新局部，不要 <code>this.setData(this.data)</code>。</li>
<li><code>data</code> 只放渲染用到的数据，渲染无关的数据挂在实例的其他字段上。</li>
<li>合并连续调用、避免高频调用，页面进入后台后停止更新。</li>
</ul>
<h2>为什么会慢</h2>
<p><code>setData</code> 把逻辑层的数据序列化后发送给视图层，视图层再运行数据更新算法、重新渲染。官方文档指出，这个算法的耗时和 Shadow 树中的节点总量、节点复杂程度显著正相关；更新的数据量则影响数据拷贝和通信耗时。</p>
<p>调用过于频繁（毫秒级）时，逻辑层 JS 线程一直忙碌，无法及时响应用户事件和页面切换；视图层也忙于处理更新，滑动卡顿、操作反馈延迟。</p>
<h2>拆分组件，缩小 Shadow 树</h2>
<p>页面节点很多时，把频繁更新的部分封装成独立的自定义组件，在组件内部调用 <code>setData</code>。这样每次更新只在小组件的 Shadow 树上运行算法。秒杀倒计时就是典型场景：倒计时放进单独组件，不要在整个页面上每秒更新。</p>
<p>官方还建议对这类区域使用 CSS <code>contain</code> 属性，限制布局、样式和绘制的计算范围。</p>
<h2>只传变化的数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Page</span>({
  <span class="hljs-attr">data</span>: { <span class="hljs-attr">list</span>: [] },
  <span class="hljs-title function_">toggle</span>(<span class="hljs-params">e</span>) {
    <span class="hljs-keyword">const</span> index = e.<span class="hljs-property">currentTarget</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">index</span>;
    <span class="hljs-comment">// 只更新一条记录的一个字段，不重新传整个 list</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">setData</span>({ [<span class="hljs-string">\`list[<span class="hljs-subst">\${index}</span>].done\`</span>]: !<span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span>.<span class="hljs-property">list</span>[index].<span class="hljs-property">done</span> });
  },
});
</code></pre></div>
<p>长列表应分页加载，加载更多时只追加新的条目路径。</p>
<h2>data 只放渲染数据</h2>
<p><code>data</code> 中的字段每次更新都会触发渲染流程和跨层通信，因此：</p>
<ul>
<li>WXML 中用到的数据放在 <code>data</code>；</li>
<li>与渲染间接相关的数据可以设为纯数据字段，用 <code>observers</code> 监听变化；</li>
<li>用户 ID、计时器句柄等与渲染无关的数据挂到 <code>this.userData</code> 之类的普通字段上，不要用 <code>data</code> 在方法之间共享状态。</li>
</ul>
<h2>控制频率和后台更新</h2>
<ul>
<li>只在界面需要变化时调用，把同一轮里的多次 <code>setData</code> 合并为一次。</li>
<li>不要在每次页面滚动回调里调用 <code>setData</code>，可以节流或改用 WXS、IntersectionObserver 等方式。</li>
<li>小程序逻辑层是单线程，后台页面的更新会抢占前台页面的资源，用户也看不到。页面隐藏后应暂停倒计时等更新，<code>onShow</code> 时再恢复。</li>
</ul>
<h2>如何定位</h2>
<p>组件的 <code>setUpdatePerformanceListener</code> 接口可以获取每次更新的耗时统计，用来找到更新慢的组件。再结合开发者工具的性能面板和真机测试确认结果。</p>
<h2>常见追问</h2>
<ul>
<li><code>setData</code> 是同步还是异步？逻辑层的 <code>this.data</code> 会同步更新，视图层渲染是异步的，需要在渲染完成后执行的逻辑放进 <code>setData</code> 的回调。</li>
<li>Taro、uni-app 还需要关注 setData 吗？需要。框架最终仍通过 setData 更新视图，组件拆分和数据量由业务代码决定，原理见<a href="/questions/mini-cross-compile/">《Taro 和 uni-app 如何把代码转换成小程序？编译时和运行时有什么区别？》</a>。</li>
</ul>`};export{e as default};