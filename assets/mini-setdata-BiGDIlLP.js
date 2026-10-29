var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>小程序里改界面只能调 <code>setData</code>。它要把逻辑层的数据序列化后发给视图层，视图层再算出哪些节点要变、重新渲染。所以它慢不慢，主要看两件事：调用它的组件 Shadow 树有多少节点，以及这次传了多少数据。官方说前者影响更大。</p>
<p>所以最有效的办法是拆组件，让每棵 Shadow 树都小一点，频繁更新的部分在小组件里自己 <code>setData</code>。</p>
<p>其次是少传数据。只传变了的字段，可以用 <code>&#x27;list[3].done&#x27;</code> 这样的数据路径更新局部，不要 <code>this.setData(this.data)</code>。<code>data</code> 里只放渲染要用的东西，别的挂到实例的其他字段上。</p>
<p>最后是控制频率：连续的调用合并成一次，不要高频调用，页面进了后台就停止更新。</p>
</blockquote>
<h2>为什么会慢</h2>
<p>先解释一个词。小程序的自定义组件内部有一棵自己的节点树，叫 Shadow 树，<code>setData</code> 的更新就是在这棵树上算的。</p>
<p><code>setData</code> 把逻辑层的数据序列化，发到视图层，视图层跑一遍数据更新算法，再重新渲染。官方文档指出，这个算法的耗时和 Shadow 树里的节点总数、节点复杂程度明显正相关。更新的数据量，则影响数据拷贝和通信的耗时。</p>
<p>调用太频繁，比如毫秒级地调，逻辑层的 JS 线程就一直在忙，来不及响应用户的操作和页面切换。视图层也忙着处理更新，结果就是滑动卡顿、点了半天没反应。</p>
<h2>为什么拆组件最有效</h2>
<p>页面节点很多时，把经常更新的那部分封装成一个独立的自定义组件，在组件里面调用 <code>setData</code>。这样每次更新只在这个小组件的 Shadow 树上跑算法，而不是整个页面。</p>
<p>秒杀倒计时就是典型例子。倒计时每秒都变，要是在页面上直接更新，每秒都要在整页的大树上算一遍。把它放进单独的组件，每秒只算这一小块。</p>
<p>官方还建议给这类区域加上 CSS 的 <code>contain</code> 属性，限制布局、样式和绘制的计算范围。</p>
<h2>怎样只传变化的数据</h2>
<p>下面的代码切换列表里某一项的完成状态，只传这一项的这一个字段：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Page</span>({
  <span class="hljs-attr">data</span>: { <span class="hljs-attr">list</span>: [] },
  <span class="hljs-title function_">toggle</span>(<span class="hljs-params">e</span>) {
    <span class="hljs-keyword">const</span> index = e.<span class="hljs-property">currentTarget</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">index</span>;
    <span class="hljs-comment">// 只更新一条记录的一个字段，不重新传整个 list</span>
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">setData</span>({ [<span class="hljs-string">\`list[<span class="hljs-subst">\${index}</span>].done\`</span>]: !<span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span>.<span class="hljs-property">list</span>[index].<span class="hljs-property">done</span> });
  },
});
</code></pre></div>
<p>如果写成把整个 <code>list</code> 重新传一遍，列表越长传得越多。用数据路径 <code>list[3].done</code> 这种写法，传的只有一个布尔值。</p>
<p>长列表还应该分页加载，加载更多时也只追加新条目的路径。</p>
<h2>data 里该放什么</h2>
<p><code>data</code> 里的字段每次更新，都会触发渲染流程和跨层通信。所以 WXML 里用到的数据才放进 <code>data</code>。</p>
<p>和渲染间接相关的数据，可以设成纯数据字段，再用 <code>observers</code> 监听它的变化。纯数据字段的意思是它在 <code>data</code> 里，但不参与渲染、不传到视图层。</p>
<p>用户 ID、定时器句柄这类跟渲染完全无关的东西，挂到 <code>this.userData</code> 之类的普通字段上，不要拿 <code>data</code> 在方法之间共享状态。</p>
<h2>怎样控制调用频率</h2>
<p>只在界面确实需要变的时候才调用，同一轮里的多次 <code>setData</code> 合并成一次。</p>
<p>页面滚动的回调触发得非常频繁，不要在里面每次都调 <code>setData</code>。可以节流，或者改用 WXS、IntersectionObserver 这类方式。</p>
<p>后台页面也要注意。小程序的逻辑层是单线程的，后台页面的更新会抢前台页面的资源，而用户根本看不到。所以页面隐藏以后，要暂停倒计时这类更新，<code>onShow</code> 时再恢复。</p>
<h2>怎样找到慢的地方</h2>
<p>组件的 <code>setUpdatePerformanceListener</code> 接口能拿到每次更新的耗时统计，用它找出更新慢的组件。然后再结合开发者工具的性能面板和真机测试确认结果。</p>
<h2>常见追问</h2>
<p><strong>setData 是同步还是异步？</strong></p>
<blockquote>
<p>两半不一样。逻辑层的 <code>this.data</code> 会同步更新，调完马上就能读到新值；视图层的渲染是异步的。所以要等渲染完成再做的事，放进 <code>setData</code> 的回调里。</p>
</blockquote>
<p><strong>用 Taro、uni-app 还需要关注 setData 吗？</strong></p>
<blockquote>
<p>需要。框架最后还是通过 setData 去更新视图，组件怎么拆、一次传多少数据，仍然由业务代码决定。原理见<a href="/questions/mini-cross-compile/">《Taro 和 uni-app 如何把代码转换成小程序？编译时和运行时有什么区别？》</a>。</p>
</blockquote>`};export{e as default};